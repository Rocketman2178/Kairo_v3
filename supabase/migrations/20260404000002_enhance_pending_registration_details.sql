-- Migration: enhance_pending_registration_details
-- Updates the get_pending_registration() RPC to return end_date and duration_weeks
-- so that the pre-checkout step 0 screen can display full season details:
--   • Season end date
--   • Number of classes (derived from duration_weeks)
--   • Per-class cost ($total / duration_weeks)
--
-- NBC Priority 2 — Stage 3.0: Confirmation screen detail overhaul.
-- Families can now see full class details and a pricing breakdown before paying.
--
-- ROLLBACK:
--   Re-run the original get_pending_registration() from
--   20260109181912_add_registration_flow_architecture.sql to restore the previous version.

CREATE OR REPLACE FUNCTION public.get_pending_registration(
  p_registration_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_registration RECORD;
  v_session      RECORD;
BEGIN
  SET search_path = '';

  -- Retrieve registration
  SELECT * INTO v_registration
  FROM public.registrations
  WHERE registration_token = p_registration_token
    AND status = 'pending_registration'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object(
      'error',   true,
      'message', 'Registration not found or expired'
    );
  END IF;

  -- Retrieve session + program details (including end_date and duration_weeks)
  SELECT
    s.id,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.start_date,
    s.end_date,
    s.capacity,
    s.enrolled_count,
    p.name           AS program_name,
    p.description    AS program_description,
    p.duration_weeks AS duration_weeks,
    l.name           AS location_name,
    l.address        AS location_address
  INTO v_session
  FROM public.sessions  s
  JOIN public.programs  p ON s.program_id = p.id
  LEFT JOIN public.locations l ON s.location_id = l.id
  WHERE s.id = v_registration.session_id;

  RETURN json_build_object(
    'success',         true,
    'registration_id', v_registration.id,
    'child_name',      v_registration.child_name,
    'child_age',       v_registration.child_age,
    'session', json_build_object(
      'id',               v_session.id,
      'program_name',     v_session.program_name,
      'program_description', v_session.program_description,
      'day_of_week',      v_session.day_of_week,
      'start_time',       v_session.start_time,
      'end_time',         v_session.end_time,
      'start_date',       v_session.start_date,
      'end_date',         v_session.end_date,
      'duration_weeks',   v_session.duration_weeks,
      'location_name',    v_session.location_name,
      'location_address', v_session.location_address,
      'capacity',         v_session.capacity,
      'enrolled_count',   v_session.enrolled_count
    ),
    'amount_cents', v_registration.amount_cents,
    'expires_at',   v_registration.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
