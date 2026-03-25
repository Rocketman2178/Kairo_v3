import { useEffect, useRef } from 'react';
import { X, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

interface ProactiveChatPopupProps {
  /** Which registration step is triggering this (0-indexed) */
  currentStep: number;
  /** What triggered the popup */
  triggerReason: 'inactivity' | 'time_on_step' | null;
  /** Called when user dismisses without clicking the CTA */
  onDismiss: () => void;
  /** Called when user clicks "Chat with Kai" */
  onChatWithKai: () => void;
  /** Step labels for contextual messaging */
  stepLabels?: string[];
}

// ─── Step-contextual messages ──────────────────────────────────────────────────

interface StepMessage {
  headline: string;
  subtext: string;
  cta: string;
}

function getStepMessage(step: number, reason: 'inactivity' | 'time_on_step' | null, stepLabels?: string[]): StepMessage {
  const stepName = stepLabels?.[step] ?? '';

  // Contextual messages per step
  const byStep: Record<number, StepMessage> = {
    0: {
      headline: 'Need help choosing a class?',
      subtext: 'Kai can find the perfect session for your child in under 60 seconds.',
      cta: 'Chat with Kai',
    },
    1: {
      headline: 'Questions about this class?',
      subtext: "I can answer questions about the schedule, coach, or location — just ask!",
      cta: 'Ask Kai',
    },
    2: {
      headline: 'Looks like you paused on the info form',
      subtext: 'Need help filling out any field? I can walk you through it.',
      cta: 'Get help',
    },
    3: {
      headline: 'Almost there! Payment questions?',
      subtext: 'I can explain payment plans, fees, or our refund policy.',
      cta: 'Ask about payment',
    },
  };

  const inactivityMessage: StepMessage = {
    headline: "Still there? Don't lose your spot!",
    subtext: 'Your selected class is being held. Continue registration to secure your place.',
    cta: 'Continue now',
  };

  if (reason === 'inactivity') return inactivityMessage;
  return byStep[step] ?? {
    headline: 'Need a hand?',
    subtext: `Kai can help you with the ${stepName ? `"${stepName}" step` : 'registration'}.`,
    cta: 'Chat with Kai',
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProactiveChatPopup({
  currentStep,
  triggerReason,
  onDismiss,
  onChatWithKai,
  stepLabels,
}: ProactiveChatPopupProps) {
  const msg = getStepMessage(currentStep, triggerReason, stepLabels);
  const popupRef = useRef<HTMLDivElement>(null);

  // Auto-focus for accessibility
  useEffect(() => {
    const btn = popupRef.current?.querySelector<HTMLButtonElement>('[data-autofocus]');
    btn?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    // Overlay (click outside to dismiss)
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:pr-6 sm:pb-6 pointer-events-none"
      aria-live="polite"
    >
      {/* Semi-transparent backdrop on mobile only */}
      <div
        className="absolute inset-0 bg-black/40 sm:bg-transparent pointer-events-auto sm:pointer-events-none"
        onClick={onDismiss}
      />

      {/* Popup card */}
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proactive-popup-title"
        className="relative pointer-events-auto w-full sm:w-80 bg-[#1a2332] border border-[#6366f1]/40 rounded-2xl shadow-2xl shadow-black/60 p-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-300"
      >
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Kai avatar / icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#6366f1]/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs font-semibold text-[#a5b4fc] mb-0.5">Kai · Registration Assistant</p>
            <h3
              id="proactive-popup-title"
              className="text-sm font-semibold text-white leading-snug"
            >
              {msg.headline}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-gray-400 mb-4 leading-relaxed pl-12">
          {msg.subtext}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            data-autofocus
            onClick={onChatWithKai}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#6366f1] to-[#06b6d4] rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {msg.cta}
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-2 text-xs text-gray-400 hover:text-gray-300 bg-gray-800/60 hover:bg-gray-800 rounded-xl transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
