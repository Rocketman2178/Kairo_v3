/**
 * useCartRecovery — Stage 3.4: Cart Recovery Deep Links
 *
 * Detects abandoned carts stored by useCartAbandonment and exposes
 * a recovery link + cart metadata so the UI can show a persistent
 * "Continue Registration" banner.
 *
 * Storage format (from useCartAbandonment via Supabase abandoned_carts table):
 *  - cart_data.registration_token  → used to reconstruct /register?token=…
 *  - cart_data.program_name
 *  - cart_data.child_name
 *  - cart_data.amount_cents
 *  - cart_data.step_abandoned
 *
 * We also read the registration_token from localStorage (set by useConversation)
 * in case the user navigates away mid-chat before cart is saved.
 */

import { useState, useEffect } from 'react';

const CART_RECOVERY_STORAGE_KEY = 'kairo_cart_recovery';

export interface CartRecoveryData {
  registrationToken: string;
  programName?: string;
  childName?: string;
  amountCents?: number;
  stepAbandoned?: string;
  savedAt: string;
}

/**
 * Save cart recovery data to localStorage.
 * Called by the registration flow to persist the current in-progress cart.
 */
export function saveCartRecovery(data: Omit<CartRecoveryData, 'savedAt'>): void {
  try {
    const record: CartRecoveryData = { ...data, savedAt: new Date().toISOString() };
    localStorage.setItem(CART_RECOVERY_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage may be unavailable in some browsers — silent failure
  }
}

/**
 * Clear the cart recovery data.
 * Called when registration is completed or explicitly dismissed.
 */
export function clearCartRecovery(): void {
  try {
    localStorage.removeItem(CART_RECOVERY_STORAGE_KEY);
  } catch {
    // silent failure
  }
}

/**
 * Read stored cart recovery data synchronously.
 * Returns null if no cart is stored or if it has expired (> 24 hours old).
 */
export function readCartRecovery(): CartRecoveryData | null {
  try {
    const raw = localStorage.getItem(CART_RECOVERY_STORAGE_KEY);
    if (!raw) return null;

    const data: CartRecoveryData = JSON.parse(raw);
    if (!data.registrationToken) return null;

    // Expire carts older than 24 hours (matches DB expires_at)
    const ageMs = Date.now() - new Date(data.savedAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      clearCartRecovery();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * React hook that returns the current cart recovery state and helpers.
 */
export function useCartRecovery() {
  const [cartRecovery, setCartRecovery] = useState<CartRecoveryData | null>(() =>
    readCartRecovery()
  );

  // Re-read on focus (user may have another tab that modified storage)
  useEffect(() => {
    function handleFocus() {
      setCartRecovery(readCartRecovery());
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  function dismiss() {
    clearCartRecovery();
    setCartRecovery(null);
  }

  const recoveryUrl = cartRecovery
    ? `/register?token=${encodeURIComponent(cartRecovery.registrationToken)}`
    : null;

  return { cartRecovery, recoveryUrl, dismiss };
}
