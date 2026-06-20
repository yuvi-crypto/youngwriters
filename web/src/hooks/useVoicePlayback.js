/**
 * useVoicePlayback.js — Text-to-speech hook
 *
 * Scope:
 *   - Uses Web Speech API SpeechSynthesis
 *   - Reads the piece back in its own language — NEVER auto-translated
 *   - Language set from profile.language (en-IN, hi-IN, te-IN)
 *   - Falls back silently if SpeechSynthesis unavailable
 *   - Fires voice_playback_used Mixpanel event on play start
 */

import { useState, useRef, useCallback } from 'react';
import { trackVoicePlaybackUsed } from '../analytics';

const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

export function useVoicePlayback({ language = 'en' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported] = useState(
    typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const utteranceRef = useRef(null);

  const play = useCallback((text, pieceId = 'draft') => {
    if (!isSupported || !text) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.9;  // Slightly slower for children
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      trackVoicePlaybackUsed({ pieceId, language });
    };

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return { isPlaying, isSupported, play, stop };
}
