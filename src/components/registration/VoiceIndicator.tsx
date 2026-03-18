import { Mic, X } from 'lucide-react';

interface VoiceIndicatorProps {
  /** Whether the microphone is currently open */
  isListening: boolean;
  /** Live transcript updated while the user speaks */
  interimTranscript: string;
  /** Error message if recognition failed */
  error: string | null;
  /** Called when the user taps the mic button to finish speaking */
  onStop: () => void;
  /** Called when the user cancels — no transcript is submitted */
  onCancel: () => void;
}

/**
 * Full-screen overlay shown during voice input.
 *
 * Renders animated pulse rings while the mic is open, a live transcript preview,
 * and a cancel option. Tap the mic button to stop recording and submit the transcript.
 */
export function VoiceIndicator({
  isListening,
  interimTranscript,
  error,
  onStop,
  onCancel,
}: VoiceIndicatorProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/97 backdrop-blur-sm">
      {/* Animated pulse rings */}
      <div className="relative flex items-center justify-center mb-6">
        {isListening && (
          <>
            <div
              className="absolute w-32 h-32 rounded-full bg-emerald-500/10 animate-ping"
              style={{ animationDuration: '1.8s' }}
            />
            <div className="absolute w-22 h-22 rounded-full bg-emerald-500/15 animate-pulse" />
          </>
        )}

        {/* Tap-to-stop button */}
        <button
          onClick={onStop}
          className="relative w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/50 active:scale-95 transition-transform"
          aria-label="Stop recording"
        >
          <Mic className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Status label */}
      <p className="text-sm font-semibold text-white mb-3">
        {isListening ? 'Listening…' : 'Processing…'}
      </p>

      {/* Live transcript preview */}
      {interimTranscript ? (
        <div className="mx-8 px-4 py-2.5 bg-slate-800 rounded-xl max-w-[240px] text-center border border-slate-700/60">
          <p className="text-sm text-slate-300 italic leading-relaxed">{interimTranscript}</p>
        </div>
      ) : (
        !error && isListening && (
          <p className="text-xs text-slate-500">Speak now…</p>
        )
      )}

      {/* Error message */}
      {error && (
        <p className="mt-3 text-xs text-red-400 text-center mx-8 max-w-[240px] leading-relaxed">
          {error}
        </p>
      )}

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="mt-7 flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors min-h-[44px]"
        aria-label="Cancel voice input"
      >
        <X className="w-4 h-4" />
        <span>Cancel</span>
      </button>
    </div>
  );
}
