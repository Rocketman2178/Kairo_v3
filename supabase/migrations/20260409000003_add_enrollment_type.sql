/*
  # Add Enrollment Type to Organizations (Stage 3.10)

  ## Summary
  Adds an enrollment_type flag to organizations to distinguish between
  term-based programs (e.g., Soccer Shots — 8-week seasons) and perpetual
  enrollment models (e.g., swim schools — enroll once, stay until cancelled).

  ## Changes
  - `organizations.enrollment_type TEXT DEFAULT 'term_based'`
  - `get_pending_registration()` updated to return `enrollment_type`

  ## Rollback
  -- ALTER TABLE public.organizations DROP COLUMN IF EXISTS enrollment_type;
  -- Restore get_pending_registration() from migration 20260408000002.
*/

-- ─── Column: organizations.enrollment_type ───────────────────────────────────

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enrollment_type TEXT
    NOT NULL DEFAULT 'term_based'
    CHECK (enrollment_type IN ('term_based', 'perpetual', 'hybrid'));

COMMENT ON COLUMN public.organizations.enrollment_type IS
  'Enrollment model: '
  'term_based = season/session-based with defined start/end, '
  'perpetual = gym-model (enroll once, stay until cancelled), '
  'hybrid = organization supports both models.';

-- ─── Update get_pending_registration() to return enrollment_type ──────────────

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
      'id',                  s.id,
      'program_name',        p.name,
      'program_description', p.description,
      'day_of_week',         s.day_of_week,
      'start_time',          s.start_time,
      'start_date',          s.start_date,
      'end_date',            s.end_date,
      'duration_weeks',      p.duration_weeks,
      'location_name',       l.name,
      'location_address',    l.address,
      'capacity',            s.capacity,
      'enrolled_count',      s.enrolled_count
    ),
    'organization', json_build_object(
      'id',                      o.id,
      'name',                    o.name,
      'installment_start_mode',  COALESCE(o.installment_start_mode, 'registration'),
      'max_proration_cap_cents', o.max_proration_cap_cents,
      'checkout_products',       COALESCE(o.checkout_products, '[]'::jsonb),
      'enrollment_type',         COALESCE(o.enrollment_type, 'term_based')
    )
  )
  INTO v_result
  FROM public.registrations  r
  JOIN public.sessions        s ON r.session_id      = s.id
  JOIN public.programs        p ON s.program_id      = p.id
  JOIN public.locations       l ON s.location_id     = l.id
  JOIN public.organizations   o ON p.organization_id = o.id
  WHERE r.registration_token = p_registration_token
    AND r.status             = 'pending_registration'
    AND r.expires_at         > NOW();

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'error',   TRUE,
      'message', 'Registration not found or expired'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_pending_registration(TEXT)
  TO anon, authenticated, service_role;
