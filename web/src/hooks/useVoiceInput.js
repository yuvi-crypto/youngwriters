/**
 * useVoiceInput.js — Speech-to-text hook
 *
 * Scope:
 *   - Uses Web Speech API (SpeechRecognition) — no external API calls
 *   - Languages: en-IN, hi-IN, te-IN (Telugu has limited browser support;
 *     te-IN is the correct BCP-47 tag but accuracy varies by browser)
 *   - Raw audio is NEVER stored — only the final transcript text is used
 *   - Transcription appends to existing content (never replaces it)
 *   - Falls back gracefully if mic permission denied or API unavailable
 *   - Note: On-device Web Speech accuracy for Telugu may be weak;
 *     TODO: swap to cloud STT via feature flag when budget allows
 *
 * Feature flag for cloud upgrade:
 *   Set VITE_USE_CLOUD_STT=true in .env to route through a backend
 *   proxy at /api/stt (not yet implemented — see TODO below).
 *
 * DPDP compliance:
 *   Raw audio stream is processed by the browser's built-in STT engine
 *   and discarded. The app only ever receives and stores the text transcript.
 *   Compliant with DPDP data-minimization for children's data.
 */

import { useState, useRef, useCallback } from 'react';
import { trackVoiceInputUsed } from '../analytics';

const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

const USE_CLOUD_STT = import.meta.env.VITE_USE_CLOUD_STT === 'true';

export function useVoiceInput({ language = 'en', format = 'story', onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const startTimeRef = useRef(null);

  // TODO (cloud STT): When VITE_USE_CLOUD_STT=true, send audio chunks to
  // /api/stt (backend proxy → Google Cloud STT or Azure Cognitive Services).
  // The proxy should return text only and log no audio. Swap this flag when
  // on-device accuracy is insufficient for Telugu/Hindi.
  if (USE_CLOUD_STT) {
    console.warn('[VoiceInput] Cloud STT feature flag is on but not yet implemented. Falling back to Web Speech API.');
  }

  const startListening = useCallback(() => {
    if (!isSupported) return;

    shouldListenRef.current = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[language] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      startTimeRef.current = Date.now();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      if (onTranscript && finalTranscript.trim()) {
        onTranscript((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
      }

      // Mixpanel: raw audio already discarded by this point (browser-handled)
      const durationSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      trackVoiceInputUsed({ format, language, durationSeconds });
    };

    recognition.onerror = (event) => {
      console.warn('[VoiceInput] Error: ', event.error);
      if (event.error === 'not-allowed') {
        setPermissionDenied(true);
        setIsSupported(false); // Treat as unsupported for this session
        shouldListenRef.current = false;
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[VoiceInput] Auto-restart failed: ', e.message);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, format, onTranscript]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported: isSupported && !permissionDenied,
    permissionDenied,
    startListening,
    stopListening,
  };
}
