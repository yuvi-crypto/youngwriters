import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { FORMATS, BADGES } from '../constants';
import { generatePrompts } from '../aiService';
import { evaluatePiece, saveEvaluation } from '../services/evaluationService';
import EvaluationCard from '../components/EvaluationCard';
import WritingImagePanel from '../components/WritingImagePanel';
import { supabase } from '../supabase';
import {
  trackPieceStarted, trackPieceCompleted, trackBadgeEarned,
  trackNudgeRequested, trackCommunityPieceShared,
} from '../analytics';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useVoicePlayback } from '../hooks/useVoicePlayback';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiShare2, FiZap, FiChevronsRight, FiRefreshCw, FiMic, FiMicOff, FiVolume2 } from 'react-icons/fi';
import './Write.css';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export default function Write() {
  const { format: formatId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { addPiece, saveDraft, getDraft, clearDraft, awardBadge, addXP } = useAppStore();

  const format = FORMATS.find((f) => f.id === formatId);

  // Assignment states
  const [assignment, setAssignment] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // Active scaffold is derived from assignment scaffold (if exists) or the base format scaffold
  const activeScaffold = assignment?.scaffold || format?.scaffold;

  // Voice hooks
  const voiceInput = useVoiceInput({
    language: profile?.language || 'en',
    format: formatId,
    onTranscript: (updater) => {
      if (activeScaffold) {
        setSectionContents((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          next[lastIdx] = typeof updater === 'function' ? updater(next[lastIdx]) : updater;
          return next;
        });
      } else {
        setContent(updater);
      }
    },
  });

  const voicePlayback = useVoicePlayback({ language: profile?.language || 'en' });

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sectionContents, setSectionContents] = useState(['', '', '']);
  const [counterArg, setCounterArg] = useState('');
  const [showCounterArg, setShowCounterArg] = useState(false);

  // UI State
  const [step, setStep] = useState('prompts'); // prompts | write | feedback
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [nudge, setNudge] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  const textareaRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const draftKey = `draft-${formatId}`;
  const startTimeRef = useRef(null); // For duration_seconds tracking

  // ── Format guard ────────────────────────────────────────────
  if (!format) {
    return (
      <div className="write-error">
        <h2>Format not found</h2>
        <Link to="/write" className="btn btn-primary">Back to Write</Link>
      </div>
    );
  }

  // ── Fetch assignment if param present ────────────────────────
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const assignmentId = searchParams.get('assignment');
    if (assignmentId) {
      fetchAssignment(assignmentId);
    } else {
      setAssignment(null);
      // Load standard drafts
      const saved = getDraft(draftKey);
      if (saved) {
        const parsed = typeof saved.content === 'object' ? saved.content : { content: saved.content };
        setTitle(parsed.title || '');
        setContent(parsed.content || '');
        if (parsed.sectionContents) setSectionContents(parsed.sectionContents);
      }
    }
  }, [formatId]);

  async function fetchAssignment(assignId) {
    setLoadingAssignment(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignId)
        .single();
      
      if (error) throw error;
      if (data) {
        setAssignment(data);
        setTitle(data.title || '');
        if (data.prompt_text) {
          setSelectedPrompt(data.prompt_text);
        }
        if (data.scaffold && Array.isArray(data.scaffold)) {
          setSectionContents(Array(data.scaffold.length).fill(''));
        }
        // Go straight to editor for classroom assignments
        setStep('write');
        startTimeRef.current = Date.now();
        trackPieceStarted({ format: formatId, promptUsed: true });
      }
    } catch (e) {
      toast.error('Failed to load assignment: ' + e.message);
    } finally {
      setLoadingAssignment(false);
    }
  }

  // ── Auto-save ───────────────────────────────────────────────
  const doSave = useCallback(() => {
    const data = activeScaffold
      ? { title, sectionContents }
      : { title, content };
    saveDraft(draftKey, data);
    setLastSaved(new Date());
  }, [title, content, sectionContents, activeScaffold]);

  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(doSave, AUTO_SAVE_INTERVAL);
    return () => clearTimeout(autoSaveTimer.current);
  }, [content, sectionContents, title]);

  // ── Word/char count ─────────────────────────────────────────
  useEffect(() => {
    const fullText = activeScaffold
      ? sectionContents.join(' ')
      : content;
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setCharCount(fullText.length);
  }, [content, sectionContents, activeScaffold]);

  // ── Load prompts ────────────────────────────────────────────
  const loadPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const age = profile?.age || 12;
      const results = await generatePrompts(age, formatId);
      setPrompts(results);
    } catch {
      toast.error('Could not load prompts. Try again!');
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    if (step === 'prompts' && !assignment) loadPrompts();
  }, [step, formatId, assignment]);

  // ── Select prompt ───────────────────────────────────────────
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setTitle(prompt);
    setStep('write');
    startTimeRef.current = Date.now();
    trackPieceStarted({ format: formatId, promptUsed: true });
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSkipPrompt = () => {
    setStep('write');
    startTimeRef.current = Date.now();
    trackPieceStarted({ format: formatId, promptUsed: false });
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // ── Section content change (for essay/opinion) ──────────────
  const handleSectionChange = (idx, val) => {
    setSectionContents((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // ── Get full text ───────────────────────────────────────────
  const getFullText = () =>
    activeScaffold ? sectionContents.join('\n\n') : content;

  // ── Submit piece ────────────────────────────────────────────
  const handleSubmit = async () => {
    const fullText = getFullText();
    if (!fullText.trim() || fullText.trim().length < 20) {
      toast.error('Write a little more before submitting! 😊');
      return;
    }
    if (format.requiresCounterArg && !showCounterArg) {
      setShowCounterArg(true);
      toast('Almost there! Add the "other side" view to publish. 💡');
      return;
    }

    setSubmitting(true);
    let pieceId = `piece-${Date.now()}`;
    let dbPieceId = null;

    try {
      // 1. Save Piece locally
      const localPiece = {
        id: pieceId,
        type: formatId,
        title: title || `My ${format.label}`,
        content: activeScaffold ? sectionContents.join('\n\n---\n\n') : content,
        scaffold: activeScaffold || null,
        counterArg: counterArg || null,
        prompt: selectedPrompt,
        status: 'private',
        wordCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addPiece(localPiece);
      clearDraft(draftKey);
      addXP(30);

      // 2. Save Piece to Supabase pieces table (if user logged in)
      if (user) {
        try {
          const { data: pieceData, error: pieceErr } = await supabase
            .from('pieces')
            .insert({
              author_id: user.id,
              type: formatId,
              title: title || `My ${format.label}`,
              content: activeScaffold ? sectionContents.join('\n\n---\n\n') : content,
              counter_arg: counterArg || null,
              prompt_used: selectedPrompt,
              status: 'private',
              word_count: wordCount,
              language: profile?.language || 'en'
            })
            .select('id')
            .single();

          if (pieceData) {
            dbPieceId = pieceData.id;
          }
        } catch (dbErr) {
          console.warn('DB piece save skipped or failed:', dbErr.message);
        }
      }

      // 3. Generate Rubric Evaluation using AI Evaluator
      const age = profile?.age || 12;
      const evalScores = await evaluatePiece(fullText, formatId, age, selectedPrompt || '');
      setEvaluation(evalScores);
      setFeedback(evalScores.feedback);
      setNudge(evalScores.growth_nudge);

      // 4. Save Submission and Evaluation to Supabase (if classroom assignment)
      if (user && assignment) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const classroomId = searchParams.get('classroom') || assignment?.classroom_id;

          const { data: subData, error: subErr } = await supabase
            .from('submissions')
            .insert({
              assignment_id: assignment.id,
              student_id: user.id,
              classroom_id: classroomId || null,
              title: title || `My ${format.label}`,
              content: fullText,
              word_count: wordCount,
              status: 'submitted',
              submitted_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (subErr) throw subErr;

          if (subData && evalScores) {
            await saveEvaluation(supabase, subData.id, evalScores, dbPieceId);
          }
        } catch (subErr) {
          console.warn('Assignment submission failed:', subErr.message);
          toast.error('Writing saved, but submission upload failed. Check your connection.');
        }
      }

      // Mixpanel: piece_completed
      const durationSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      trackPieceCompleted({
        format: formatId,
        wordCount,
        durationSeconds,
        promptUsed: !!selectedPrompt,
        usedScaffold: !!activeScaffold,
        usedCounterArg: !!counterArg,
      });

      // Award badges
      const badgeMap = {
        story:   BADGES.BRAVE_WRITER,
        poem:    BADGES.POET,
        essay:   BADGES.GRID_WRITER || BADGES.ESSAY_EXPLORER,
        opinion: BADGES.CRITICAL_THINKER,
      };
      const badge = badgeMap[formatId];
      if (badge) {
        awardBadge(badge);
        trackBadgeEarned({ badgeId: badge.id, badgeName: badge.name, format: formatId });
        awardBadge(BADGES.FIRST_DRAFT);
        trackBadgeEarned({ badgeId: BADGES.FIRST_DRAFT.id, badgeName: BADGES.FIRST_DRAFT.name, format: formatId });
        
        if (assignment) {
          awardBadge(BADGES.CLASS_WRITER);
          trackBadgeEarned({ badgeId: BADGES.CLASS_WRITER.id, badgeName: BADGES.CLASS_WRITER.name, format: formatId });
        }
      }

      setStep('feedback');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Your writing is saved in drafts!');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Request nudge ────────────────────────────────────────────
  const handleGetNudge = () => {
    trackNudgeRequested({ format: formatId, wordCount });
    setNudge(evaluation?.growth_nudge || 'One thing to try next time: add sensory details!');
    setShowNudge(true);
  };

  // ─── Render: Prompt Selection ────────────────────────────────
  if (step === 'prompts') {
    return (
      <div className="write-page">
        <div className="write-prompts-page">
          <Link to="/write" className="write-back-btn">
            <FiArrowLeft /> Back
          </Link>
          <div className="write-prompts-header">
            <div className="write-format-badge" style={{ background: format.gradient }}>
              {format.emoji}
            </div>
            <h1>Let's write a <span style={{ color: 'var(--color-primary)' }}>{format.label.toLowerCase()}</span>!</h1>
            <p>Pick a prompt to get started, or skip and write about anything you want.</p>
          </div>

          {loadingPrompts ? (
            <div className="prompts-loading">
              <div className="prompts-loading-dots">
                <span /><span /><span />
              </div>
              <p>Getting prompts just for you...</p>
            </div>
          ) : (
            <div className="prompts-grid">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  className="prompt-card animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <span className="prompt-number">Prompt {i + 1}</span>
                  <p className="prompt-text">{prompt}</p>
                  <span className="prompt-pick">Pick this →</span>
                </button>
              ))}
            </div>
          )}

          <div className="prompts-actions">
            <button className="btn btn-ghost" onClick={loadPrompts} disabled={loadingPrompts}>
              <FiRefreshCw size={16} /> New prompts
            </button>
            <button className="btn btn-outline-primary btn-lg" onClick={handleSkipPrompt}>
              Skip — I have my own idea ✍️
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Feedback ────────────────────────────────────────
  if (step === 'feedback') {
    return (
      <div className="write-page">
        <div className="write-feedback-page animate-scale-in">
          <div className="feedback-confetti">🎉✨🌟🎊⭐</div>
          <h1 className="feedback-title">You did it! Amazing work! 🎉</h1>

          {/* AI Rubric Evaluation display */}
          {evaluation ? (
            <div className="feedback-evaluation-wrapper card mt-6">
              <EvaluationCard evaluation={evaluation} age={profile?.age || 10} />
            </div>
          ) : (
            <>
              {/* Fallback old feedback card */}
              <div className="feedback-card card">
                <div className="feedback-card-header">
                  <span className="feedback-icon">✨</span>
                  <span>Here's what we loved about your {format.label.toLowerCase()}:</span>
                </div>
                <p className="feedback-text">{feedback}</p>
              </div>

              {!showNudge ? (
                <button className="btn btn-ghost mt-4" onClick={handleGetNudge} disabled={loadingNudge}>
                  <FiZap size={16} /> Get a writing tip (optional)
                </button>
              ) : (
                <div className="nudge-card card animate-fade-in mt-4">
                  <div className="nudge-header">
                    <span className="nudge-icon">💡</span>
                    <span>One thing to try next time:</span>
                  </div>
                  <p className="nudge-text">{nudge}</p>
                </div>
              )}
            </>
          )}

          {/* Badges earned */}
          <div className="feedback-badges mt-8">
            <h3>🏅 Badges earned!</h3>
            <div className="feedback-badge-list">
              {[
                BADGES.FIRST_DRAFT, 
                BADGES[`${formatId.toUpperCase()}_WRITER`] || BADGES.BRAVE_WRITER,
                assignment ? BADGES.CLASS_WRITER : null
              ].filter(Boolean).map((b) => (
                <div className="feedback-badge-item animate-bounce-in" key={b.id}>
                  <span className="feedback-badge-emoji">{b.emoji}</span>
                  <div>
                    <strong>{b.name}</strong>
                    <p>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="feedback-actions mt-8">
            <Link to="/journal" className="btn btn-primary btn-lg">
              View in my journal 📖
            </Link>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                trackCommunityPieceShared({ format: formatId, wordCount });
                toast.success('Shared to community! 🌍');
              }}
            >
              <FiShare2 size={18} /> Share with community
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStep('write');
                setFeedback('');
                setShowNudge(false);
                setNudge('');
              }}
            >
              Keep editing
            </button>
            <Link to="/write" className="btn btn-ghost">
              Write something new
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Editor ──────────────────────────────────────────
  const fullText = getFullText();
  const canSubmit = fullText.trim().length >= 20;

  return (
    <div className={`write-page ${focusMode ? 'focus-mode' : ''}`}>
      {/* Top Bar */}
      <div className="editor-topbar">
        <button className="write-back-btn btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <div className="editor-topbar-center">
          <span className="editor-format-badge" style={{ background: format.gradient }}>
            {format.emoji} {format.label}
          </span>
          {assignment && (
            <span className="assignment-indicator-badge">
              🏫 Classroom Assignment
            </span>
          )}
          {lastSaved && (
            <span className="editor-saved-indicator">
              ✓ Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="editor-topbar-actions">
          {/* Voice input */}
          {voiceInput.isSupported && (
            <button
              className={`btn btn-ghost btn-sm voice-btn ${voiceInput.isListening ? 'voice-btn-active' : ''}`}
              onClick={() => voiceInput.isListening ? voiceInput.stopListening() : voiceInput.startListening()}
            >
              {voiceInput.isListening ? <FiMicOff size={15} /> : <FiMic size={15} />}
              {voiceInput.isListening ? ' Stop' : ' Speak'}
            </button>
          )}

          {/* Voice playback */}
          {voicePlayback.isSupported && fullText.trim().length > 5 && (
            <button
              className={`btn btn-ghost btn-sm ${voicePlayback.isPlaying ? 'btn-active' : ''}`}
              onClick={() => voicePlayback.isPlaying
                ? voicePlayback.stop()
                : voicePlayback.play(fullText, `draft-${formatId}`)
              }
            >
              <FiVolume2 size={15} /> {voicePlayback.isPlaying ? 'Stop' : 'Read'}
            </button>
          )}

          <button
            className={`btn btn-ghost btn-sm ${focusMode ? 'btn-active' : ''}`}
            onClick={() => setFocusMode(!focusMode)}
          >
            {focusMode ? 'Exit focus' : '🎯 Focus'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={doSave}>
            <FiSave size={15} /> Save
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? '...' : <>Submit <FiChevronsRight size={16} /></>}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Main Editor */}
        <div className="editor-main">
          {/* Title */}
          <input
            className="editor-title-input"
            type="text"
            placeholder={selectedPrompt || `Give your ${format.label.toLowerCase()} a title...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Scaffold Editor */}
          {activeScaffold ? (
            <div className="scaffold-editor">
              {activeScaffold.map((sectionLabel, idx) => (
                <div key={idx} className="scaffold-section">
                  <label className="scaffold-label">
                    <span className="scaffold-number">{idx + 1}</span>
                    {sectionLabel}
                    <span className="scaffold-hint">(guide only — write as much or as little as you like)</span>
                  </label>
                  <textarea
                    className="editor-textarea scaffold-textarea"
                    placeholder={`${sectionLabel}...`}
                    value={sectionContents[idx]}
                    onChange={(e) => handleSectionChange(idx, e.target.value)}
                    rows={4}
                  />
                </div>
              ))}

              {/* Counter argument */}
              {format.requiresCounterArg && showCounterArg && (
                <div className="scaffold-section counter-arg animate-fade-in">
                  <label className="scaffold-label">
                    <span className="scaffold-number">🤔</span>
                    The Other Side
                    <span className="scaffold-hint">What would someone who disagrees say? (2–3 sentences)</span>
                  </label>
                  <textarea
                    className="editor-textarea scaffold-textarea"
                    placeholder="Someone who disagrees might say..."
                    value={counterArg}
                    onChange={(e) => setCounterArg(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Free-form Editor */
            <div className="free-editor">
              <div className="no-judgment-badge">
                <span>Space for creativity. Write freely! ✍️</span>
              </div>
              <textarea
                ref={textareaRef}
                className="editor-textarea free-textarea"
                placeholder={selectedPrompt ? `${selectedPrompt}\n\n` : format.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="sentences"
              />
            </div>
          )}

          {/* Word count */}
          <div className="editor-footer">
            <span className="editor-word-count">
              {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} characters
            </span>
            {wordCount >= 20 && (
              <span className="editor-ready-badge badge badge-accent">
                ✓ Ready to submit!
              </span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {!focusMode && (
          <div className="editor-sidebar">
            
            {/* Visual write assignment image panel */}
            {assignment?.image_url && (
              <WritingImagePanel 
                imageUrl={assignment.image_url} 
                title={assignment.title} 
              />
            )}

            {/* Writing tips */}
            <div className="sidebar-card card">
              <h4>✍️ Writing tips</h4>
              {format.id === 'story' && (
                <ul className="writing-tips">
                  <li>Give your main character a name</li>
                  <li>Describe one thing you can see, smell, or hear</li>
                  <li>What problem does your character face?</li>
                  <li>There are no wrong ideas here!</li>
                </ul>
              )}
              {format.id === 'poem' && (
                <ul className="writing-tips">
                  <li>Poems don't have to rhyme!</li>
                  <li>Use strong, vivid words</li>
                  <li>Compare something to something unexpected</li>
                  <li>Short lines are okay — even one word can be a line</li>
                </ul>
              )}
              {format.id === 'essay' && (
                <ul className="writing-tips">
                  <li>State your main idea clearly</li>
                  <li>Give at least one reason</li>
                  <li>Use an example from real life</li>
                  <li>Don't worry about perfect — just write!</li>
                </ul>
              )}
              {format.id === 'opinion' && (
                <ul className="writing-tips">
                  <li>State your opinion clearly</li>
                  <li>Give 2–3 reasons</li>
                  <li>Thinking about the other side makes you stronger!</li>
                  <li>No politics or religion — that's the only rule</li>
                </ul>
              )}
            </div>

            {/* Mind map */}
            <div className="sidebar-card card sidebar-mindmap">
              <h4>🗺️ Mind map</h4>
              <p className="text-muted text-sm">Jot down ideas before you write:</p>
              <textarea
                className="input textarea mindmap-input"
                placeholder="Characters... places... ideas..."
                rows={5}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Format Selector ──────────────────────────────────────────
export function WriteSelect() {
  const { profile } = useAuthStore();
  const age = profile?.age || 12;

  const availableFormats = FORMATS.filter((f) => !f.minAge || age >= f.minAge);

  return (
    <div className="write-select-page">
      <div className="container container-sm">
        <div className="write-select-header">
          <h1>What do you want to write? ✍️</h1>
          <p>Pick a format and let the words flow.</p>
        </div>
        <div className="write-select-grid">
          {availableFormats.map((fmt) => (
            <Link
              key={fmt.id}
              to={`/write/${fmt.id}`}
              className="write-select-card animate-fade-in"
              style={{ '--fmt-gradient': fmt.gradient }}
            >
              <div className="write-select-icon">{fmt.emoji}</div>
              <div className="write-select-info">
                <h2>{fmt.label}</h2>
                <p>{fmt.description}</p>
                {fmt.minAge && (
                  <span className="badge badge-primary">Ages {fmt.minAge}+</span>
                )}
              </div>
              <span className="write-select-arrow">→</span>
            </Link>
          ))}
        </div>
        {age < 8 && (
          <div className="write-age-note card">
            <span>🌱</span>
            <p>Essays and opinion pieces unlock at age 8. You've got stories and poems — that's two superpowers already!</p>
          </div>
        )}
      </div>
    </div>
  );
}
