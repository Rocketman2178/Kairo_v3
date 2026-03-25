import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Behavioral states that can trigger a proactive Kai intervention.
 * All tracking is in-memory only — no data leaves the browser.
 */
export interface ProactiveTriggerConfig {
  /** Seconds of inactivity before triggering (default: 30) */
  inactivityThresholdSec?: number;
  /** Seconds spent on the current step before triggering (default: 60) */
  timeOnStepThresholdSec?: number;
  /** Whether the trigger is globally enabled */
  enabled?: boolean;
}

export interface ProactiveTriggerState {
  /** True when trigger conditions have been met */
  shouldShow: boolean;
  /** Which condition was responsible */
  triggerReason: 'inactivity' | 'time_on_step' | null;
  /** Call to dismiss the popup (prevents re-trigger for this step) */
  dismiss: () => void;
  /** Reset tracking when user advances to a new step */
  resetForStep: (step: number) => void;
}

/**
 * Tracks user inactivity and time-on-step to detect registration abandonment
 * risk. Fires a callback when configured thresholds are crossed.
 *
 * No PII is captured — only timing events.
 */
export function useProactiveTrigger(
  currentStep: number,
  config: ProactiveTriggerConfig = {}
): ProactiveTriggerState {
  const {
    inactivityThresholdSec = 30,
    timeOnStepThresholdSec = 60,
    enabled = true,
  } = config;

  const [shouldShow, setShouldShow] = useState(false);
  const [triggerReason, setTriggerReason] = useState<'inactivity' | 'time_on_step' | null>(null);

  // Track whether popup was dismissed for this step
  const dismissedForStep = useRef<Set<number>>(new Set());
  // Track step entry time
  const stepEnteredAt = useRef<number>(Date.now());
  // Inactivity timer ref
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Time-on-step timer ref
  const timeOnStepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (timeOnStepTimer.current) clearTimeout(timeOnStepTimer.current);
    inactivityTimer.current = null;
    timeOnStepTimer.current = null;
  }, []);

  const startTimers = useCallback(() => {
    if (!enabled) return;
    clearTimers();

    // Inactivity timer — reset on any interaction
    inactivityTimer.current = setTimeout(() => {
      if (!dismissedForStep.current.has(currentStep)) {
        setTriggerReason('inactivity');
        setShouldShow(true);
      }
    }, inactivityThresholdSec * 1000);

    // Time-on-step timer — fires if user lingers too long without progressing
    const elapsed = (Date.now() - stepEnteredAt.current) / 1000;
    const remaining = Math.max(0, timeOnStepThresholdSec - elapsed);
    timeOnStepTimer.current = setTimeout(() => {
      if (!dismissedForStep.current.has(currentStep)) {
        setTriggerReason('time_on_step');
        setShouldShow(true);
      }
    }, remaining * 1000);
  }, [enabled, currentStep, inactivityThresholdSec, timeOnStepThresholdSec, clearTimers]);

  // Restart inactivity timer on user activity
  const handleActivity = useCallback(() => {
    if (!enabled || dismissedForStep.current.has(currentStep)) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (!dismissedForStep.current.has(currentStep)) {
        setTriggerReason('inactivity');
        setShouldShow(true);
      }
    }, inactivityThresholdSec * 1000);
  }, [enabled, currentStep, inactivityThresholdSec]);

  // Listen for user activity events
  useEffect(() => {
    if (!enabled) return;
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [enabled, handleActivity]);

  // Start fresh timers when step changes
  useEffect(() => {
    stepEnteredAt.current = Date.now();
    setShouldShow(false);
    setTriggerReason(null);
    startTimers();
    return () => clearTimers();
  }, [currentStep, startTimers, clearTimers]);

  const dismiss = useCallback(() => {
    dismissedForStep.current.add(currentStep);
    setShouldShow(false);
    setTriggerReason(null);
    clearTimers();
  }, [currentStep, clearTimers]);

  const resetForStep = useCallback((step: number) => {
    // Called externally if the parent already knows the step changed
    dismissedForStep.current.delete(step);
  }, []);

  return { shouldShow, triggerReason, dismiss, resetForStep };
}
