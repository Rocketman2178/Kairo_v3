import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface CartData {
  registrationToken: string | null;
  sessionId?: string;
  childName?: string;
  programName?: string;
  amountCents?: number;
  currentStep: number;
  email?: string;
}

export function useCartAbandonment(cartData: CartData, isComplete: boolean) {
  const savedRef = useRef(false);

  useEffect(() => {
    if (isComplete || !cartData.registrationToken) return;

    function saveAbandonedCart() {
      if (savedRef.current || isComplete) return;
      savedRef.current = true;

      const stepNames = ['session_review', 'info_entry', 'payment', 'confirmation'];
      const abandonedStep = stepNames[cartData.currentStep] || 'unknown';

      supabase.from('abandoned_carts').insert({
        conversation_id: null,
        cart_data: {
          registration_token: cartData.registrationToken,
          session_id: cartData.sessionId,
          child_name: cartData.childName,
          program_name: cartData.programName,
          amount_cents: cartData.amountCents,
          email: cartData.email,
          step_abandoned: abandonedStep,
          abandoned_at: new Date().toISOString(),
        },
        abandoned_at_state: abandonedStep,
        recovery_attempts: 0,
        recovered: false,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        saveAbandonedCart();
      }
    }

    function handleBeforeUnload() {
      saveAbandonedCart();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cartData, isComplete]);

  function markRecovered() {
    savedRef.current = true;
  }

  return { markRecovered };
}
