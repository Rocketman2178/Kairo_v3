import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { saveCartRecovery, clearCartRecovery } from './useCartRecovery';

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

  // Persist cart recovery data to localStorage whenever key fields change,
  // so the CartRecoveryBanner can surface it on subsequent page visits.
  useEffect(() => {
    if (isComplete || !cartData.registrationToken) {
      if (isComplete) {
        // Registration completed — clear any recovery data
        clearCartRecovery();
      }
      return;
    }

    // Keep localStorage in sync with current cart state
    saveCartRecovery({
      registrationToken: cartData.registrationToken,
      programName: cartData.programName,
      childName: cartData.childName,
      amountCents: cartData.amountCents,
      stepAbandoned: ['session_review', 'info_entry', 'payment', 'confirmation'][cartData.currentStep] || 'unknown',
    });
  }, [
    cartData.registrationToken,
    cartData.programName,
    cartData.childName,
    cartData.amountCents,
    cartData.currentStep,
    isComplete,
  ]);

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
      }).select().single().then(({ data }) => {
        // If email is available at abandonment time, schedule a recovery email
        // via the trigger-cart-recovery edge function (it will respect timing windows)
        if (data?.id && cartData.email) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          if (supabaseUrl) {
            // Fire-and-forget: pre-schedule recovery (function validates timing)
            fetch(`${supabaseUrl}/functions/v1/trigger-cart-recovery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`,
                'Apikey': anonKey,
              },
              body: JSON.stringify({ mode: 'single', cartId: data.id }),
            }).catch(() => {
              // Silent failure — don't block unload
            });
          }
        }
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
    // Clear the localStorage recovery entry since registration is complete
    clearCartRecovery();
  }

  return { markRecovered };
}
