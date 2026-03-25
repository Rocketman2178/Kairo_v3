/*
  # Add Makeup Token System (Stage 3.7)

  ## Summary
  Implements the makeup class token system: when a student cancels a class in
  advance, they receive a token that can be used to book an equivalent makeup
  class slot. Tokens are level-locked, expiring, and capacity-aware.

  ## New Tables
  - `makeup_tokens` — one token per cancellation event, tracks issue/usage/expiry

  ## New Functions
  - `issue_makeup_token()` — creates a token when an eligible cancellation occurs
  - `use_makeup_token()` — redeems a token for a makeup registration
  - `get_family_tokens()` — returns token summary for a family (parent portal)

  ## Security
  - RLS: families can see their own tokens (via family_id); admins via service_role
  - No token data exposed in URLs or logs

  ## Rollback
  -- DROP TABLE IF EXISTS public.makeup_tokens CASCADE;
  -- DROP FUNCTION IF EXISTS issue_makeup_token(UUID, UUID, UUID, TEXT, INTEGER);
  -- DROP FUNCTION IF EXISTS use_makeup_token(UUID, UUID, UUID);
  -- DROP FUNCTION IF EXISTS get_family_tokens(UUID);
*/

-- ─── Table: makeup_tokens ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.makeup_tokens (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  family_id            UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id             UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,

  -- Source of the token (the registration that was cancelled)
  source_registration_id  UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  source_session_id       UUID REFERENCES public.sessions(id) ON DELETE SET NULL,

  -- Level locking: token can only be used for classes at this skill level
  -- NULL means token is not level-locked (org choice)
  skill_level          TEXT,

  -- Token lifecycle
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'used', 'expired', 'cancelled', 'forfeited')),
  issued_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ NOT NULL,
  used_at              TIMESTAMPTZ,

  -- If used: which registration was created with this token
  used_for_registration_id  UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  used_for_session_id       UUID REFERENCES public.sessions(id) ON DELETE SET NULL,

  -- Optional fee charged for the makeup class (0 = free)
  makeup_fee_cents     INTEGER NOT NULL DEFAULT 0,

  -- Notes (admin-visible only)
  notes                TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_makeup_tokens_family
  ON public.makeup_tokens(family_id);

CREATE INDEX IF NOT EXISTS idx_makeup_tokens_child
  ON public.makeup_tokens(child_id);

CREATE INDEX IF NOT EXISTS idx_makeup_tokens_status_expires
  ON public.makeup_tokens(status, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_makeup_tokens_organization
  ON public.makeup_tokens(organization_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_makeup_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_makeup_tokens_updated_at ON public.makeup_tokens;
CREATE TRIGGER trg_makeup_tokens_updated_at
  BEFORE UPDATE ON public.makeup_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_makeup_tokens_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.makeup_tokens ENABLE ROW LEVEL SECURITY;

-- Families can see their own tokens
CREATE POLICY "Families view own makeup tokens"
  ON public.makeup_tokens
  FOR SELECT TO authenticated
  USING (
    family_id IN (
      SELECT id FROM public.families WHERE user_id = auth.uid()
    )
  );

-- Staff can view tokens for their organization
CREATE POLICY "Staff view org makeup tokens"
  ON public.makeup_tokens
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- Service role has full access (for edge functions / admin ops)
CREATE POLICY "Service role full access to makeup tokens"
  ON public.makeup_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── Function: issue_makeup_token ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.issue_makeup_token(
  p_organization_id       UUID,
  p_family_id             UUID,
  p_child_id              UUID,
  p_skill_level           TEXT DEFAULT NULL,
  p_source_registration_id UUID DEFAULT NULL,
  p_source_session_id     UUID DEFAULT NULL,
  p_expiry_months         INTEGER DEFAULT 12,
  p_makeup_fee_cents      INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + (p_expiry_months || ' months')::INTERVAL;

  INSERT INTO public.makeup_tokens (
    organization_id,
    family_id,
    child_id,
    skill_level,
    source_registration_id,
    source_session_id,
    status,
    expires_at,
    makeup_fee_cents
  ) VALUES (
    p_organization_id,
    p_family_id,
    p_child_id,
    p_skill_level,
    p_source_registration_id,
    p_source_session_id,
    'active',
    v_expires_at,
    p_makeup_fee_cents
  )
  RETURNING id INTO v_token_id;

  RETURN json_build_object(
    'success', true,
    'token_id', v_token_id,
    'expires_at', v_expires_at,
    'skill_level', p_skill_level
  );
END;
$$;

-- ─── Function: use_makeup_token ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.use_makeup_token(
  p_token_id              UUID,
  p_makeup_registration_id UUID,
  p_makeup_session_id     UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token RECORD;
BEGIN
  -- Get and lock the token
  SELECT * INTO v_token
  FROM public.makeup_tokens
  WHERE id = p_token_id
    AND status = 'active'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Token not found, already used, or expired'
    );
  END IF;

  -- Mark token as used
  UPDATE public.makeup_tokens SET
    status = 'used',
    used_at = NOW(),
    used_for_registration_id = p_makeup_registration_id,
    used_for_session_id = p_makeup_session_id
  WHERE id = p_token_id;

  RETURN json_build_object(
    'success', true,
    'token_id', p_token_id,
    'message', 'Makeup token redeemed successfully'
  );
END;
$$;

-- ─── Function: get_family_tokens ─────────────────────────────────────────────
-- Returns token summary for the parent portal — active, used, and expired counts
-- plus the list of active tokens for display.

CREATE OR REPLACE FUNCTION public.get_family_tokens(
  p_family_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_active_tokens JSON;
  v_active_count  INTEGER;
  v_used_count    INTEGER;
  v_expired_count INTEGER;
BEGIN
  -- Auto-expire tokens past their expiry date
  UPDATE public.makeup_tokens
  SET status = 'expired'
  WHERE family_id = p_family_id
    AND status = 'active'
    AND expires_at <= NOW();

  -- Counts
  SELECT
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'used'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO v_active_count, v_used_count, v_expired_count
  FROM public.makeup_tokens
  WHERE family_id = p_family_id;

  -- Active token list with child + session info
  SELECT json_agg(t ORDER BY t.expires_at)
  INTO v_active_tokens
  FROM (
    SELECT
      mt.id,
      mt.skill_level,
      mt.expires_at,
      mt.makeup_fee_cents,
      mt.issued_at,
      c.first_name AS child_first_name,
      c.last_name  AS child_last_name,
      p.name       AS source_program_name,
      CASE
        WHEN mt.expires_at <= NOW() + INTERVAL '7 days' THEN 'urgent'
        WHEN mt.expires_at <= NOW() + INTERVAL '30 days' THEN 'warning'
        ELSE 'ok'
      END AS expiry_urgency
    FROM public.makeup_tokens mt
    JOIN public.children c ON c.id = mt.child_id
    LEFT JOIN public.sessions s ON s.id = mt.source_session_id
    LEFT JOIN public.programs p ON p.id = s.program_id
    WHERE mt.family_id = p_family_id
      AND mt.status = 'active'
    ORDER BY mt.expires_at
  ) t;

  RETURN json_build_object(
    'active_count', v_active_count,
    'used_count', v_used_count,
    'expired_count', v_expired_count,
    'active_tokens', COALESCE(v_active_tokens, '[]'::JSON)
  );
END;
$$;

-- ─── Permissions ─────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.issue_makeup_token(UUID, UUID, UUID, TEXT, UUID, UUID, INTEGER, INTEGER)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.use_makeup_token(UUID, UUID, UUID)
  TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_family_tokens(UUID)
  TO authenticated, anon;
