-- ─── Migration: add_max_proration_cap ────────────────────────────────────────
-- Adds a configurable maximum proration discount cap to the organizations table.
-- When set, the prorated amount discount (mid-season enrollment) cannot exceed
-- this value, preventing unexpectedly large discounts on short-term prorations.
--
-- ROLLBACK:
--   ALTER TABLE public.organizations DROP COLUMN IF EXISTS max_proration_cap_cents;
--   -- Re-run get_pending_registration replacement from 20260406000001 to restore prior version.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add max_proration_cap_cents column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS max_proration_cap_cents INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.organizations.max_proration_cap_cents IS
  'Optional cap (in cents) on the prorated discount amount for mid-season enrollments. NULL = no cap.';

-- 2. Replace get_pending_registration() to return max_proration_cap_cents from organization
CREATE OR REPLACE FUNCTION public.get_pending_registration(
  p_registration_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SET search_path = '';

  SELECT json_build_object(
    'registration_id',  r.id,
    'child_name',       r.child_name,
    'child_age',        r.child_age,
    'amount_cents',     r.amount_cents,
    'expires_at',       r.expires_at,
    'session', json_build_object(
      'id',               s.id,
      'program_name',     p.name,
      'program_description', p.description,
      'day_of_week',      s.day_of_week,
      'start_time',       s.start_time,
      'start_date',       s.start_date,
      'end_date',         s.end_date,
      'duration_weeks',   p.duration_weeks,
      'location_name',    l.name,
      'location_address', l.address,
      'capacity',         s.capacity,
      'enrolled_count',   s.enrolled_count
    ),
    'organization', json_build_object(
      'id',                       o.id,
      'name',                     o.name,
      'installment_start_mode',   COALESCE(o.installment_start_mode, 'registration'),
      'max_proration_cap_cents',  o.max_proration_cap_cents
    )
  )
  INTO v_result
  FROM public.registrations r
  JOIN public.sessions   s ON r.session_id   = s.id
  JOIN public.programs   p ON s.program_id   = p.id
  JOIN public.locations  l ON s.location_id  = l.id
  JOIN public.organizations o ON p.organization_id = o.id
  WHERE r.registration_token = p_registration_token
    AND r.status              = 'pending_registration'
    AND r.expires_at          > NOW();

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'error',   TRUE,
      'message', 'Registration not found or expired'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_pending_registration(TEXT) TO anon, authenticated, service_role;
