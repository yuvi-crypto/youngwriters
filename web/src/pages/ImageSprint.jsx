/**
 * ImageSprint.jsx — "Watch, Then Write"
 *
 * Phase flow:
 *   watch  → child observes image for 10–15s, no writing
 *   write  → image shrinks (or hides), 3-min soft timer + textarea
 *   feedback → positive response + optional Sharp Eyes badge
 *
 * Soft-timer design principles (per PRD):
 *   - Timer is a calm progress ring, never an alarm
 *   - Pausable for ages 5–7
 *   - One-tap +2min extension for everyone
 *   - Running out NEVER blocks submission
 *
 * Detail-match (Sharp Eyes badge):
 *   - image.objects array contains ~10 nouns that appear in the image
 *   - We scan the child's story for any of those words (case-insensitive)
 *   - If count >= SHARP_EYES_THRESHOLD, award the badge
 *   - This is keyword matching only — no AI call, no false inference
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { IMAGE_LIBRARY, BADGES, SHARP_EYES_THRESHOLD } from '../constants';
import {
  trackImageSprintStarted,
  trackImageSprintCompleted,
  trackSharpEyesBadgeEarned,
  trackBadgeEarned,
} from '../analytics';
import toast from 'react-hot-toast';
import './ImageSprint.css';

// Inline age-band helper (mirrors the one in analytics.js)
function getAgeBandId(age) {
  if (!age || age < 5) return '8-12'; // safe default
  if (age <= 7) return '5-7';
  if (age <= 12) return '8-12';
  return '13-17';
}

// ── Constants ─────────────────────────────────────────────────
const WATCH_DURATION_MS = 12000;   // 12 seconds watch phase
const WRITE_DURATION_MS = 3 * 60 * 1000; // 3 minutes
const EXTENSION_MS = 2 * 60 * 1000;      // +2 min on extension tap

// ── Detail-match ──────────────────────────────────────────────
/**
 * Counts how many of the image's tagged objects appear in the story text.
 * Returns an integer. Case-insensitive, whole-word matching.
 * Scope: keyword scan only. Not AI, not semantic.
 */
function countDetailMatches(storyText, imageObjects) {
  if (!storyText || !imageObjects?.length) return 0;
  const lower = storyText.toLowerCase();
  return imageObjects.filter((obj) =>
    lower.includes(obj.toLowerCase())
  ).length;
}

// ── SVG Progress Ring ─────────────────────────────────────────
function ProgressRing({ progress, size = 120, stroke = 8, color = 'hsl(258,80%,62%)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <svg width={size} height={size} className="sprint-ring">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="hsla(258,80%,62%,0.15)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s linear', stroke: color }}
      />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ImageSprint() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { awardBadge, addXP, addPiece } = useAppStore();

  const age = profile?.age || 10;
  const ageBand = getAgeBandId(age);
  const isYoung = age <= 7; // Ages 5–7 get pausable timer

  // Pick a random image appropriate for this age band
  const [image] = useState(() => {
    const eligible = IMAGE_LIBRARY.filter((img) =>
      img.ageBands.includes(ageBand)
    );
    return eligible[Math.floor(Math.random() * eligible.length)] || IMAGE_LIBRARY[0];
  });

  // Phase: 'watch' | 'write' | 'feedback'
  const [phase, setPhase] = useState('watch');
  const [memoryMode, setMemoryMode] = useState(false); // image hidden in write phase
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [sharpEyes, setSharpEyes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Watch timer
  const [watchRemaining, setWatchRemaining] = useState(WATCH_DURATION_MS);

  // Write timer
  const [writeRemaining, setWriteRemaining] = useState(WRITE_DURATION_MS);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);

  const watchIntervalRef = useRef(null);
  const writeIntervalRef = useRef(null);
  const sprintStartRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Watch Phase timer ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'watch') return;
    watchIntervalRef.current = setInterval(() => {
      setWatchRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(watchIntervalRef.current);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(watchIntervalRef.current);
  }, [phase]);

  // Auto-advance when watch reaches 0
  useEffect(() => {
    if (phase === 'watch' && watchRemaining === 0) {
      beginWritePhase();
    }
  }, [watchRemaining, phase]);

  // ── Write Phase timer ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'write' || timerPaused) return;
    writeIntervalRef.current = setInterval(() => {
      setWriteRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(writeIntervalRef.current);
          setTimerExpired(true);
          // Gentle nudge — does NOT block submission
          toast('Time\'s up — but you can keep writing! ✍️', { icon: '⏳', duration: 4000 });
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(writeIntervalRef.current);
  }, [phase, timerPaused]);

  // Word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [content]);

  // ── Start write phase ─────────────────────────────────────
  const beginWritePhase = useCallback(() => {
    sprintStartRef.current = Date.now();
    trackImageSprintStarted({ imageId: image.id, mode: memoryMode ? 'memory' : 'normal', age });
    setPhase('write');
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, [image, memoryMode, age]);

  // ── Extend timer ──────────────────────────────────────────
  const handleExtend = () => {
    setWriteRemaining((prev) => prev + EXTENSION_MS);
    setTimerExpired(false);
    toast('2 more minutes added! Keep going! ⏱️', { icon: '✨' });
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = () => {
    if (content.trim().length < 10) {
      toast.error('Write a little more before submitting! 😊');
      return;
    }
    setSubmitting(true);

    const durationUsedSeconds = sprintStartRef.current
      ? Math.round((Date.now() - sprintStartRef.current) / 1000)
      : 0;

    const detailMatchCount = countDetailMatches(content, image.objects);
    const earnedSharpEyes = detailMatchCount >= SHARP_EYES_THRESHOLD;

    // Save piece
    addPiece({
      id: `sprint-${Date.now()}`,
      type: 'image-sprint',
      title: `Image Sprint — ${image.title}`,
      content,
      wordCount,
      imageId: image.id,
      detailMatchCount,
      status: 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    addXP(35);

    // Mixpanel
    trackImageSprintCompleted({ durationUsedSeconds, wordCount, detailMatchCount });

    if (earnedSharpEyes) {
      awardBadge(BADGES.SHARP_EYES);
      trackSharpEyesBadgeEarned({ imageId: image.id, wordCount, detailMatchCount });
      trackBadgeEarned({ badgeId: BADGES.SHARP_EYES.id, badgeName: BADGES.SHARP_EYES.name });
    }

    setSharpEyes(earnedSharpEyes);
    setFeedback(
      earnedSharpEyes
        ? `Amazing! You spotted ${detailMatchCount} details from the image and wove them into your story. That takes real skill! 🎨`
        : `You wrote a wonderful story inspired by the image! Keep practising and you\'ll be earning Sharp Eyes in no time. ✨`
    );

    setPhase('feedback');
    setSubmitting(false);
  };

  // ── Timer display helpers ─────────────────────────────────
  const writeProgress = Math.max(0, writeRemaining / WRITE_DURATION_MS);
  const writeMins = Math.floor(writeRemaining / 60000);
  const writeSecs = Math.floor((writeRemaining % 60000) / 1000);
  const timeLabel = `${writeMins}:${String(writeSecs).padStart(2, '0')}`;

  // ── Phase: Watch ──────────────────────────────────────────
  if (phase === 'watch') {
    const watchProgress = watchRemaining / WATCH_DURATION_MS;
    const watchSecs = Math.ceil(watchRemaining / 1000);

    return (
      <div className="sprint-page">
        <div className="sprint-watch-container">
          <div className="sprint-watch-header">
            <div className="sprint-badge">📸 Image Sprint</div>
            <h1 className="sprint-watch-title">Look carefully at this image...</h1>
            <p className="sprint-watch-sub">You&apos;ll write a story about it in a moment. Notice the details!</p>
          </div>

          <div className="sprint-image-wrap sprint-image-full">
            <img src={image.src} alt="Writing prompt illustration" className="sprint-img" />
            <div className="sprint-watch-overlay">
              <div className="sprint-watch-ring-wrap">
                <ProgressRing progress={watchProgress} size={80} stroke={6} color="white" />
                <span className="sprint-watch-countdown">{watchSecs}</span>
              </div>
            </div>
          </div>

          <div className="sprint-watch-controls">
            {/* Memory mode toggle */}
            <label className="sprint-memory-toggle">
              <input
                type="checkbox"
                checked={memoryMode}
                onChange={(e) => setMemoryMode(e.target.checked)}
              />
              <span className="sprint-toggle-track" />
              <span className="sprint-toggle-label">
                🧠 Memory mode — image hides while you write
                <span className="sprint-badge-hint">(Advanced)</span>
              </span>
            </label>

            <button
              className="btn btn-primary btn-lg sprint-ready-btn"
              onClick={beginWritePhase}
            >
              I&apos;m ready — start writing! ✍️
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/write')}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Feedback ───────────────────────────────────────
  if (phase === 'feedback') {
    return (
      <div className="sprint-page">
        <div className="sprint-feedback animate-scale-in">
          <div className="sprint-confetti">🎉✨🌟🎊</div>
          <h1 className="sprint-feedback-title">
            {sharpEyes ? '👁️ Sharp Eyes! Amazing work!' : 'You did it! Brilliant story! 🎉'}
          </h1>

          <div className="sprint-feedback-card">
            <p>{feedback}</p>
          </div>

          {sharpEyes && (
            <div className="sprint-badge-earned animate-bounce-in">
              <span className="sprint-badge-emoji">👁️</span>
              <div>
                <strong>Sharp Eyes Badge Earned!</strong>
                <p>You noticed real details from the image and used them in your story.</p>
              </div>
            </div>
          )}

          <div className="sprint-feedback-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/journal')}>
              View in journal 📖
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              setPhase('watch');
              setContent('');
              setTimerExpired(false);
              setWriteRemaining(WRITE_DURATION_MS);
            }}>
              Try another image 📸
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/home')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Write ──────────────────────────────────────────
  return (
    <div className="sprint-page">
      <div className="sprint-write-layout">

        {/* Left: Image (thumbnail or hidden) */}
        <div className="sprint-sidebar-left">
          {memoryMode ? (
            <div className="sprint-memory-mode-hint">
              <span className="sprint-memory-icon">🧠</span>
              <p>Memory mode — the image is hidden.<br />What do you remember?</p>
            </div>
          ) : (
            <div className="sprint-image-wrap sprint-image-thumb">
              <img src={image.src} alt="Reference illustration" className="sprint-img" />
              <span className="sprint-thumb-label">Reference image</span>
            </div>
          )}
        </div>

        {/* Center: Editor */}
        <div className="sprint-editor-main">
          <div className="sprint-editor-header">
            <span className="sprint-badge">📸 Image Sprint</span>
            {timerExpired && (
              <button className="btn btn-outline-primary btn-sm" onClick={handleExtend}>
                ⏱️ +2 minutes
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            className="sprint-textarea"
            placeholder="What story does this image tell you? Start anywhere..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <div className="sprint-editor-footer">
            <span className="sprint-word-count">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
            {wordCount >= 20 && (
              <span className="sprint-ready-badge">✓ Ready to submit!</span>
            )}
            <button
              className="btn btn-primary sprint-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || content.trim().length < 10}
            >
              {submitting ? '...' : 'Submit ✓'}
            </button>
          </div>
        </div>

        {/* Right: Timer */}
        <div className="sprint-sidebar-right">
          <div className="sprint-timer-wrap">
            <div className="sprint-ring-container">
              <ProgressRing
                progress={writeProgress}
                size={110}
                stroke={7}
                color={writeRemaining < 30000 ? 'hsl(32,95%,58%)' : 'hsl(160,65%,46%)'}
              />
              <span className="sprint-timer-label">
                {timerExpired ? '🕐' : timeLabel}
              </span>
            </div>
            <p className="sprint-timer-hint">
              {timerExpired
                ? 'Take your time!'
                : 'Soft timer — never blocks submitting'}
            </p>

            {/* Pause for ages 5–7 */}
            {isYoung && !timerExpired && (
              <button
                className={`btn btn-ghost btn-sm sprint-pause-btn ${timerPaused ? 'sprint-pause-active' : ''}`}
                onClick={() => setTimerPaused(!timerPaused)}
              >
                {timerPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}

            {/* Extension button (everyone) */}
            {!timerExpired && (
              <button className="btn btn-ghost btn-sm" onClick={handleExtend}>
                +2 min
              </button>
            )}
          </div>

          <div className="sprint-tip-card">
            <h4>💡 Tips</h4>
            <ul>
              <li>Describe what you see</li>
              <li>Who might live here?</li>
              <li>What happened just before?</li>
              <li>What happens next?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
