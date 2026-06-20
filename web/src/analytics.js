/**
 * analytics.js — Young Writers Platform
 *
 * Single analytics module. All Mixpanel calls go through here.
 * Never import mixpanel-browser directly in components.
 *
 * India data residency: api-in.mixpanel.com
 * Token: 17fb49d9820cb22446d1b3b3f69cc225
 *
 * Tracking plan scope:
 *   Client-side (this file):  all in-app user actions
 *   Server-side (n8n/backend): safety_flag_raised, safety_flag_reviewed
 *
 * Identity pattern:
 *   signup  → identify(userId) → people.set() → track('sign_up_completed')
 *   login   → identify(userId)
 *   logout  → reset()
 */

import mixpanel from 'mixpanel-browser';

// ── Config ───────────────────────────────────────────────────
const TOKEN = '17fb49d9820cb22446d1b3b3f69cc225';
const API_HOST = 'https://api-in.mixpanel.com'; // India residency

let initialized = false;

// ── Age band helper ──────────────────────────────────────────
function getAgeBand(age) {
  if (!age || age < 5) return 'unknown';
  if (age <= 7) return '5-7';
  if (age <= 12) return '8-12';
  return '13-17';
}

// ── Init ─────────────────────────────────────────────────────
export function initAnalytics() {
  if (initialized) return;
  mixpanel.init(TOKEN, {
    api_host: API_HOST,
    persistence: 'localStorage',
    // Never track sensitive children's data beyond what's specified
    property_blacklist: ['$email', '$phone'],
    debug: import.meta.env.DEV,
  });
  initialized = true;
}

// ── Identity Management ──────────────────────────────────────

/**
 * Call after signup or login.
 * Sets super properties (auto-attached to every future event).
 */
export function identifyUser(userId, profile) {
  if (!initialized) return;
  mixpanel.identify(userId);

  const ageBand = getAgeBand(profile?.age);

  // Super properties — attached to every event for the session
  mixpanel.register({
    age_band: ageBand,
    language: profile?.language || 'en',
    account_type: profile?.role || 'child',
    platform: 'web',
  });

  // User profile (mutable attributes)
  mixpanel.people.set({
    $name: profile?.name,
    role: profile?.role,
    age_band: ageBand,
    language: profile?.language || 'en',
    platform: 'web',
  });
}

/**
 * Call on logout — clears identity and super properties.
 */
export function resetAnalytics() {
  if (!initialized) return;
  mixpanel.reset();
}

// ── Typed Event Helpers ───────────────────────────────────────
// Every event name matches the tracking plan exactly.
// No dynamic event names — names are always hardcoded strings.
// Missing optional props are omitted (never sent as null/"").

/**
 * sign_up_completed
 * Trigger: Supabase signUp succeeds, after identify()
 */
export function trackSignUpCompleted({ role, age, language }) {
  if (!initialized) return;
  mixpanel.track('sign_up_completed', {
    sign_up_method: 'email',
    role: role || 'child',
    age_band: getAgeBand(age),
    language: language || 'en',
  });
}

/**
 * login_completed
 * Trigger: signInWithPassword succeeds, after identify()
 */
export function trackLoginCompleted({ role, age, language }) {
  if (!initialized) return;
  mixpanel.track('login_completed', {
    role: role || 'child',
    age_band: getAgeBand(age),
    language: language || 'en',
  });
}

/**
 * piece_started
 * Trigger: User enters the Write editor (format selected)
 */
export function trackPieceStarted({ format, promptUsed = false }) {
  if (!initialized) return;
  mixpanel.track('piece_started', {
    format,
    prompt_used: promptUsed,
  });
}

/**
 * piece_completed
 * Trigger: Successful submit in Write.jsx (after AI feedback generates)
 * durationSeconds: seconds from piece_started to submit
 */
export function trackPieceCompleted({
  format,
  wordCount,
  durationSeconds,
  promptUsed = false,
  usedScaffold = false,
  usedCounterArg = false,
}) {
  if (!initialized) return;
  mixpanel.track('piece_completed', {
    format,
    word_count: wordCount,
    duration_seconds: durationSeconds,
    prompt_used: promptUsed,
    used_scaffold: usedScaffold,
    used_counter_arg: usedCounterArg,
  });
}

/**
 * badge_earned
 * Trigger: awardBadge() fires in store.js
 */
export function trackBadgeEarned({ badgeId, badgeName, format }) {
  if (!initialized) return;
  const props = { badge_id: badgeId, badge_name: badgeName };
  if (format) props.format = format;
  mixpanel.track('badge_earned', props);
}

/**
 * nudge_requested
 * Trigger: User taps "Get a writing tip"
 */
export function trackNudgeRequested({ format, wordCount }) {
  if (!initialized) return;
  mixpanel.track('nudge_requested', { format, word_count: wordCount });
}

/**
 * community_piece_shared
 * Trigger: Share button tapped in feedback screen
 */
export function trackCommunityPieceShared({ format, wordCount }) {
  if (!initialized) return;
  mixpanel.track('community_piece_shared', { format, word_count: wordCount });
}

/**
 * contest_entry_started
 * Trigger: User begins a contest entry
 */
export function trackContestEntryStarted({ contestId, contestTheme, format }) {
  if (!initialized) return;
  mixpanel.track('contest_entry_started', {
    contest_id: contestId,
    contest_theme: contestTheme,
    format,
  });
}

// ── Image Sprint Events ───────────────────────────────────────

/**
 * image_sprint_started
 * Trigger: Child taps start in Image Sprint watch phase
 * mode: 'normal' | 'memory' (thumbnail vs hidden)
 */
export function trackImageSprintStarted({ imageId, mode, age }) {
  if (!initialized) return;
  mixpanel.track('image_sprint_started', {
    image_id: imageId,
    mode,
    age_band: getAgeBand(age),
  });
}

/**
 * image_sprint_completed
 * Trigger: Child submits their sprint story
 * detailMatchCount: number of image-tagged objects found in story text
 */
export function trackImageSprintCompleted({ durationUsedSeconds, wordCount, detailMatchCount }) {
  if (!initialized) return;
  mixpanel.track('image_sprint_completed', {
    duration_used_seconds: durationUsedSeconds,
    word_count: wordCount,
    detail_match_count: detailMatchCount,
  });
}

/**
 * sharp_eyes_badge_earned
 * Trigger: detail_match_count >= SHARP_EYES_THRESHOLD on sprint submit
 */
export function trackSharpEyesBadgeEarned({ imageId, wordCount, detailMatchCount }) {
  if (!initialized) return;
  mixpanel.track('sharp_eyes_badge_earned', {
    image_id: imageId,
    word_count: wordCount,
    detail_match_count: detailMatchCount,
  });
}

// ── Voice Events ──────────────────────────────────────────────

/**
 * voice_input_used
 * Trigger: STT transcription completes (raw audio discarded by this point)
 * format: writing format active when voice was used
 * durationSeconds: length of the voice recording
 */
export function trackVoiceInputUsed({ format, language, durationSeconds }) {
  if (!initialized) return;
  mixpanel.track('voice_input_used', {
    format,
    language,
    duration_seconds: durationSeconds,
  });
}

/**
 * voice_playback_used
 * Trigger: TTS read-back triggered for a piece
 */
export function trackVoicePlaybackUsed({ pieceId, language }) {
  if (!initialized) return;
  mixpanel.track('voice_playback_used', {
    piece_id: pieceId,
    language,
  });
}

/**
 * page_viewed
 * Lightweight page tracking — fired from App.jsx on route change
 */
export function trackPageViewed(pageName) {
  if (!initialized) return;
  mixpanel.track('page_viewed', { page: pageName });
}
