import { useState, useEffect, useCallback } from 'react';

export interface SavedCard {
  methodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface UseSavedPaymentMethodsOptions {
  registrationToken: string | null;
  email: string;
  /** Only fetch when this is true (e.g., when step === 2) */
  enabled?: boolean;
}

interface UseSavedPaymentMethodsResult {
  methods: SavedCard[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function useSavedPaymentMethods({
  registrationToken,
  email,
  enabled = true,
}: UseSavedPaymentMethodsOptions): UseSavedPaymentMethodsResult {
  const [methods, setMethods] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || !registrationToken || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMethods([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/list-payment-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ANON_KEY}`,
            Apikey: ANON_KEY,
          },
          body: JSON.stringify({ registrationToken, email }),
        });

        if (!res.ok) throw new Error('Failed to load saved cards');
        const data: { methods: SavedCard[]; error?: boolean } = await res.json();

        if (!cancelled) {
          setMethods(data.error ? [] : (data.methods ?? []));
        }
      } catch {
        if (!cancelled) setError('Could not load saved cards');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationToken, email, enabled, version]);

  return { methods, loading, error, refresh };
}
