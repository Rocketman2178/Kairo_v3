/*
  # Add Phone Verification (Stage 3.6.1 — NBC Priority 2)

  ## Summary
  Adds server-side phone number verification using a short-lived OTP flow.
  Parents can optionally verify their phone during checkout when SMS opt-in
  is selected. Verified status is stored on the family record.

  ## Changes
  - `phone_verification_codes` — stores OTPs (6-digit, 10-min TTL)
  - `families.phone_verified_at TIMESTAMPTZ` — timestamp when phone was last verified

  ## Security
  - Codes stored in plaintext (6-digit, 10-min TTL — acceptable risk for SMS OTP)
  - One active code per phone at a time; prior codes auto-deleted on new request
  - RLS: service_role only (codes managed entirely by edge functions)
  - Family-scoped: verification links to a specific phone number, not a family row
    (family may not exist yet during checkout — created after verification)

  ## Rollback
  -- ALTER TABLE public.families DROP COLUMN IF EXISTS phone_verified_at;
  -- DROP TABLE IF EXISTS public.phone_verification_codes CASCADE;
*/

-- ─── Table: phone_verification_codes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,           -- E.164 or any normalized format
  code        TEXT NOT NULL,           -- 6-digit OTP (plaintext, short TTL)
  expires_at  TIMESTAMPTZ NOT NULL,    -- 10 minutes from creation
  verified_at TIMESTAMPTZ,             -- Set when code is successfully validated
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on phone for lookup
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_phone
  ON public.phone_verification_codes(phone);

-- Index on expiry for cleanup queries
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires
  ON public.phone_verification_codes(expires_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service_role) can read/write codes
CREATE POLICY "Service role only for verification codes"
  ON public.phone_verification_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── families.phone_verified_at ──────────────────────────────────────────────

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.families.phone_verified_at IS
  'Timestamp when the family phone number was last verified via OTP. '
  'NULL = unverified. Updated by the verify-phone-code edge function.';
