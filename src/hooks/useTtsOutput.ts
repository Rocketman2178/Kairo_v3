/**
 * useTtsOutput — Text-to-Speech hook for Kai responses
 *
 * Wraps the Web Speech API's SpeechSynthesis interface so Kai can read
 * responses aloud. Works in Chrome, Safari, Edge, and Firefox.
 *
 * Stage 2B.1 — Voice Registration (TTS component)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LanguageCode } from '../services/ai/languageService';
import { LANGUAGE_LOCALE } from '../services/ai/languageService';

interface UseTtsOutputOptions {
  language?: LanguageCode;
  /** Volume 0–1, default 1 */
  volume?: number;
  /** Rate 0.1–10, default 1 */
  rate?: number;
  /** Pitch 0–2, default 1 */
  pitch?: number;
}

interface UseTtsOutputReturn {
  /** Whether the browser supports SpeechSynthesis */
  isSupported: boolean;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Speak the given text aloud. Cancels any current speech first. */
  speak: (text: string) => void;
  /** Stop any ongoing speech */
  stop: () => void;
}

export function useTtsOutput({
  language = 'en',
  volume = 1,
  rate = 1,
  pitch = 1,
}: UseTtsOutputOptions = {}): UseTtsOutputReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Stop speaking if language changes mid-session
  useEffect(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Strip markdown-like syntax and action brackets for cleaner speech
      const cleaned = text
        .replace(/\*\*(.*?)\*\*/g, '$1')      // bold
        .replace(/\*(.*?)\*/g, '$1')           // italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/\[([^\]]+)\]/g, '')          // quick-reply brackets
        .replace(/#{1,6}\s/g, '')              // headings
        .replace(/`[^`]*`/g, '')               // inline code
        .replace(/\n{2,}/g, '. ')             // double newlines → pause
        .replace(/\n/g, ' ')
        .trim();

      if (!cleaned) return;

      // Cancel any ongoing utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = LANGUAGE_LOCALE[languageRef.current];
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, volume, rate, pitch]
  );

  return { isSupported, isSpeaking, speak, stop };
}
