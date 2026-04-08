import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, PhoneOff, Bot, User, ChevronDown, Loader2 } from 'lucide-react';
import { useVoiceMode, type VoiceSessionState, type VoiceTranscriptEntry } from '../../hooks/useVoiceMode';
import { VoiceOrb } from './VoiceOrb';

// ---------------------------------------------------------------------------
// Voice Options
// ---------------------------------------------------------------------------

const VOICE_OPTIONS = [
  { group: 'Warm & Friendly', voices: [
    { name: 'Puck', desc: 'Upbeat' },
    { name: 'Sulafat', desc: 'Warm' },
    { name: 'Achird', desc: 'Friendly' },
    { name: 'Leda', desc: 'Youthful' },
    { name: 'Sadachbia', desc: 'Lively' },
  ]},
  { group: 'Professional & Clear', voices: [
    { name: 'Charon', desc: 'Informative' },
    { name: 'Kore', desc: 'Firm' },
    { name: 'Schedar', desc: 'Even' },
    { name: 'Iapetus', desc: 'Clear' },
  ]},
  { group: 'Calm & Gentle', voices: [
    { name: 'Achernar', desc: 'Soft' },
    { name: 'Vindemiatrix', desc: 'Gentle' },
    { name: 'Aoede', desc: 'Breezy' },
  ]},
  { group: 'Bold & Energetic', voices: [
    { name: 'Fenrir', desc: 'Excitable' },
    { name: 'Zephyr', desc: 'Bright' },
    { name: 'Gacrux', desc: 'Mature' },
  ]},
];

const STATE_LABELS: Record<VoiceSessionState, string> = {
  idle: 'Tap to start a voice conversation',
  connecting: 'Connecting...',
  listening: 'Listening...',
  thinking: 'Looking into that...',
  speaking: 'Kai is speaking...',
  error: 'Something went wrong',
};

const STATE_COLORS: Record<VoiceSessionState, string> = {
  idle: 'text-slate-400',
  connecting: 'text-amber-400',
  listening: 'text-emerald-400',
  thinking: 'text-violet-400',
  speaking: 'text-sky-400',
  error: 'text-red-400',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VoiceModePageProps {
  onClose?: () => void;
  onEndSession?: (transcript: VoiceTranscriptEntry[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceModePage({ onClose, onEndSession }: VoiceModePageProps) {
  const [voiceName, setVoiceName] = useState(() => localStorage.getItem('kairo_voice_name') || 'Puck');
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  const voiceHook = useVoiceMode({ voiceName, assistantName: 'Kai' });
  const { state, transcript, errorMessage, isMuted, autoMuted, startSession, endSession, toggleMute, audioLevel, getFullTranscript } = voiceHook;

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const isActive = state !== 'idle' && state !== 'error';

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Detect scroll position for "new messages" button
  const handleTranscriptScroll = useCallback(() => {
    const el = transcriptContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const handleVoiceChange = (voice: string) => {
    setVoiceName(voice);
    localStorage.setItem('kairo_voice_name', voice);
    setShowVoicePicker(false);
  };

  const handleEndSession = () => {
    const fullTranscript = getFullTranscript();
    endSession();
    onEndSession?.(fullTranscript);
  };

  const handleStart = async () => {
    setShowVoicePicker(false);
    await startSession();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">Voice Mode</h2>
        <button
          onClick={() => { if (isActive) handleEndSession(); onClose?.(); }}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!isActive ? (
        /* ====== IDLE / ERROR STATE ====== */
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Talk to Kai</h3>
            <p className="text-slate-400 text-sm">Find the perfect sports program with a quick voice conversation</p>
          </div>

          {/* Voice picker */}
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              <span>Voice: {voiceName}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showVoicePicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                {VOICE_OPTIONS.map(group => (
                  <div key={group.group}>
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-900/50">{group.group}</div>
                    {group.voices.map(v => (
                      <button
                        key={v.name}
                        onClick={() => handleVoiceChange(v.name)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${voiceName === v.name ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300'}`}
                      >
                        {v.name} <span className="text-slate-500">— {v.desc}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orb */}
          <VoiceOrb
            state={state}
            audioLevel={audioLevel}
            isMuted={isMuted}
            size="large"
            onClick={handleStart}
          />

          {/* Status */}
          <p className={`text-sm ${STATE_COLORS[state]}`}>
            {errorMessage || STATE_LABELS[state]}
          </p>

          {/* Start button */}
          {state === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <Mic className="w-5 h-5" />
              Start Conversation
            </button>
          )}

          {state === 'error' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-full font-medium hover:bg-slate-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : (
        /* ====== ACTIVE SESSION ====== */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Compact orb + status */}
          <div className="flex flex-col items-center py-4 gap-2 flex-shrink-0">
            <VoiceOrb state={state} audioLevel={audioLevel} isMuted={isMuted} size="small" />
            <p className={`text-sm font-medium ${STATE_COLORS[state]}`}>
              {STATE_LABELS[state]}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
                title={autoMuted ? 'Auto-muted while Kai is speaking' : (isMuted ? 'Unmute' : 'Mute')}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-5 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                End
              </button>
            </div>

            {/* Auto-mute notice */}
            {autoMuted && (
              <p className="text-xs text-slate-500 mt-1">Mic auto-muted while Kai speaks</p>
            )}
          </div>

          {/* Transcript */}
          <div
            ref={transcriptContainerRef}
            onScroll={handleTranscriptScroll}
            className="flex-1 overflow-y-auto px-4 pb-4 space-y-3"
          >
            {transcript.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-sm">Say something to get started...</p>
              </div>
            )}

            {transcript.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  entry.role === 'user'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-emerald-600/20 text-emerald-400'
                }`}>
                  {entry.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  entry.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-tr-md'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-md'
                }`}>
                  {entry.text === 'Looking that up for you...' ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {entry.text}
                    </span>
                  ) : entry.text}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {state === 'thinking' && transcript[transcript.length - 1]?.text !== 'Looking that up for you...' && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-600/20 text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-600 hover:bg-slate-600 transition-colors"
            >
              New messages
            </button>
          )}
        </div>
      )}
    </div>
  );
}
