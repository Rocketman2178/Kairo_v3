-- ============================================================
-- Migration: add_installment_start_mode_and_proration
-- Purpose: Adds per-org installment billing start mode (Stage 3.1.0 NBC Priority 1)
--          and extend get_pending_registration() to return org billing config
-- ============================================================
-- Rollback:
--   ALTER TABLE public.organizations DROP COLUMN IF EXISTS installment_start_mode;
--   -- Then restore previous get_pending_registration() function body.
-- ============================================================

-- 1. Add installment_start_mode to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS installment_start_mode TEXT
    NOT NULL DEFAULT 'registration'
    CHECK (installment_start_mode IN ('registration', 'class_start'));

COMMENT ON COLUMN public.organizations.installment_start_mode IS
  'Controls when installment billing begins. '
  '"registration" = payments start immediately at registration (default). '
  '"class_start" = payment schedule begins on the first class date (useful for pre-season registration).';

-- 2. Replace get_pending_registration() to also return installment_start_mode
CREATE OR REPLACE FUNCTION public.get_pending_registration(p_registration_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'registration_id',  r.id,
    'status',           r.status,
    'amount_cents',     r.amount_cents,
    'child_name',       r.child_name,
    'child_age',        r.child_age,
    'family_id',        r.family_id,
    'session', json_build_object(
      'id',             s.id,
      'day_of_week',    s.day_of_week,
      'start_time',     s.start_time,
      'start_date',     s.start_date,
      'end_date',       s.end_date,
      'capacity',       s.capacity,
      'enrolled_count', s.enrolled_count,
      'duration_weeks', p.duration_weeks,
      'program_name',   p.name,
      'program_description', p.description,
      'location_name',  l.name,
      'location_address', l.address
    ),
    'organization', json_build_object(
      'id',                     o.id,
      'name',                   o.name,
      'installment_start_mode', o.installment_start_mode
    )
  )
  INTO v_result
  FROM public.registrations r
  JOIN public.sessions      s ON s.id = r.session_id
  JOIN public.programs      p ON p.id = s.program_id
  JOIN public.organizations o ON o.id = p.organization_id
  LEFT JOIN public.locations l ON l.id = s.location_id
  WHERE r.registration_token = p_registration_token
    AND r.status = 'pending_registration';

  IF v_result IS NULL THEN
    RETURN json_build_object('error', 'Registration not found or already completed');
  END IF;

  RETURN v_result;
END;
$$;
