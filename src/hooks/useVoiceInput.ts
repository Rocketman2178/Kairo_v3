/**
 * useVoiceInput
 *
 * Web Speech API hook for hands-free voice input in the Kai chat interface.
 * Supports Chrome, Safari, and Edge (webkit prefix handled automatically).
 *
 * Flow:
 * 1. `startListening()` — opens the microphone and begins recognition
 * 2. `interimTranscript` updates in real-time as the user speaks
 * 3. When recognition ends, `onFinalTranscript` is called with the full text
 * 4. `stopListening()` — manually finishes recognition (still fires onFinalTranscript)
 *
 * Security: only the transcript string ever leaves the device — no audio is sent to Kairo.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/** Extend Window to support the webkit-prefixed implementation */
interface VoiceWindow extends Window {
  webkitSpeechRecognition: typeof SpeechRecognition;
}

function getSpeechRecognitionConstructor(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const w = window as Partial<VoiceWindow>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseVoiceInputReturn {
  /** True if the browser supports the Web Speech API */
  isSupported: boolean;
  /** True while the microphone is open and recognition is active */
  isListening: boolean;
  /** Live transcript updated while the user is speaking */
  interimTranscript: string;
  /** Error message to display, if any */
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': 'No speech detected. Tap the mic and try speaking.',
  'audio-capture': 'Microphone not found. Check your device settings.',
  'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
  'service-not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
  'network': 'Network error during transcription. Please check your connection.',
  'language-not-supported': 'Your language is not supported for voice input.',
};

/**
 * @param onFinalTranscript — called with the complete recognised text when recognition ends
 * @param language — BCP-47 language tag (default 'en-US')
 */
export function useVoiceInput(
  onFinalTranscript: (text: string) => void,
  language = 'en-US',
): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const finalBufferRef = useRef('');

  // Keep callback ref current so the recognition closure never goes stale
  const onFinalRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Abort recognition and release mic on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const isSupported = getSpeechRecognitionConstructor() !== null;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    // onend handler will fire, submit whatever was captured, and reset state
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecog = getSpeechRecognitionConstructor();
    if (!SpeechRecog) {
      setError('Voice input is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    // Request microphone permission first — this triggers the browser's
    // permission dialog if not already granted. Without this, some browsers
    // silently deny SpeechRecognition.start() with a 'not-allowed' error.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep the stream alive so the mic stays "warm" for SpeechRecognition.
      // Released in onend/onerror to avoid macOS race conditions.
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = stream;
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      return;
    }

    // Abort any existing recognition session before starting a new one
    recognitionRef.current?.abort();

    setError(null);
    setInterimTranscript('');
    finalBufferRef.current = '';

    const recognition = new SpeechRecog();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        finalBufferRef.current = (finalBufferRef.current + ' ' + finalText).trim();
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' is silent — it fires when we call abort() ourselves
      if (event.error !== 'aborted') {
        const message = ERROR_MESSAGES[event.error] ?? 'Voice input failed. Please type your message instead.';
        setError(message);
      }
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setIsListening(false);
      setInterimTranscript('');

      const final = finalBufferRef.current.trim();
      finalBufferRef.current = '';

      if (final) {
        onFinalRef.current(final);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    startListening,
    stopListening,
  };
}
