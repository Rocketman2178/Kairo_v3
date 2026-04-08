import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import type { VoiceSessionState } from '../../hooks/useVoiceMode';

interface VoiceOrbProps {
  state: VoiceSessionState;
  audioLevel: number;
  isMuted: boolean;
  size?: 'large' | 'small';
  onClick?: () => void;
}

const STATE_GRADIENTS: Record<VoiceSessionState, string> = {
  idle: 'from-emerald-500/30 to-teal-500/20',
  connecting: 'from-amber-500/30 to-amber-600/15',
  listening: 'from-emerald-500/40 to-teal-500/25',
  thinking: 'from-violet-500/30 to-violet-600/15',
  speaking: 'from-sky-500/40 to-sky-600/20',
  error: 'from-red-500/30 to-red-600/15',
};

const STATE_BORDERS: Record<VoiceSessionState, string> = {
  idle: 'border-emerald-500/30',
  connecting: 'border-amber-500/30',
  listening: 'border-emerald-500/50',
  thinking: 'border-violet-500/30',
  speaking: 'border-sky-500/50',
  error: 'border-red-500/30',
};

function OrbIcon({ state, isMuted }: { state: VoiceSessionState; isMuted: boolean }) {
  const iconClass = 'w-8 h-8';
  switch (state) {
    case 'idle':
      return <Mic className={`${iconClass} text-emerald-400`} />;
    case 'connecting':
      return <Loader2 className={`${iconClass} text-amber-400 animate-spin`} />;
    case 'listening':
      return isMuted
        ? <MicOff className={`${iconClass} text-red-400`} />
        : <Mic className={`${iconClass} text-emerald-400`} />;
    case 'thinking':
      return <Loader2 className={`${iconClass} text-violet-400 animate-spin`} />;
    case 'speaking':
      return <Volume2 className={`${iconClass} text-sky-400`} />;
    case 'error':
      return <AlertCircle className={`${iconClass} text-red-400`} />;
    default:
      return <Mic className={`${iconClass} text-slate-400`} />;
  }
}

export function VoiceOrb({ state, audioLevel, isMuted, size = 'large', onClick }: VoiceOrbProps) {
  const isActive = state !== 'idle' && state !== 'error';
  const shouldPulse = state === 'connecting' || state === 'thinking';
  const scale = isActive ? 1 + audioLevel * 0.2 : 1;

  if (size === 'small') {
    return (
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div
          className={`absolute w-24 h-24 rounded-full bg-gradient-to-br ${STATE_GRADIENTS[state]} ${shouldPulse ? 'animate-pulse' : ''}`}
          style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease-out' }}
        />
        {/* Inner orb */}
        <div className={`relative w-16 h-16 rounded-full bg-slate-800 border-2 ${STATE_BORDERS[state]} flex items-center justify-center shadow-lg`}>
          <OrbIcon state={state} isMuted={isMuted} />
        </div>
      </div>
    );
  }

  // Large orb (idle state)
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center group"
      disabled={state === 'connecting'}
    >
      {/* Outer glow */}
      <div className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${STATE_GRADIENTS[state]} opacity-50 group-hover:opacity-70 transition-opacity ${shouldPulse ? 'animate-pulse' : ''}`} />
      {/* Middle ring */}
      <div className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${STATE_GRADIENTS[state]} opacity-30`} />
      {/* Inner button */}
      <div className={`relative w-32 h-32 rounded-full bg-slate-800 border-2 ${STATE_BORDERS[state]} flex items-center justify-center shadow-2xl group-hover:shadow-emerald-500/20 transition-all`}>
        <OrbIcon state={state} isMuted={isMuted} />
      </div>
    </button>
  );
}
