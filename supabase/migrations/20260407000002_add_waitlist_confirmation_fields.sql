-- ─── Migration: add_waitlist_confirmation_fields ─────────────────────────────
-- Enables direct-join waitlist from the public Sessions page for anonymous users
-- and adds confirmation email tracking to prevent duplicate sends.
--
-- Changes:
--   1. Makes waitlist.child_id and family_id nullable (anonymous waitlist support)
--   2. Adds contact_email and contact_name for anonymous waitlist entries
--   3. Adds confirmation_sent_at to track when confirmation email was sent
--   4. Replaces add_to_waitlist_with_position() to accept optional contact fields
--   5. Adds RLS policies allowing anonymous INSERT with restricted SELECT
--
-- ROLLBACK:
--   ALTER TABLE public.waitlist
--     DROP COLUMN IF EXISTS contact_email,
--     DROP COLUMN IF EXISTS contact_name,
--     DROP COLUMN IF EXISTS confirmation_sent_at;
--   ALTER TABLE public.waitlist ALTER COLUMN child_id SET NOT NULL;
--   ALTER TABLE public.waitlist ALTER COLUMN family_id SET NOT NULL;
--   -- Re-run add_to_waitlist_with_position from 20260404000001 to restore prior version.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Make child_id and family_id nullable to support anonymous entries
ALTER TABLE public.waitlist ALTER COLUMN child_id  DROP NOT NULL;
ALTER TABLE public.waitlist ALTER COLUMN family_id DROP NOT NULL;

-- 2. Add anonymous contact fields
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.waitlist.contact_email IS
  'Email for anonymous waitlist entries (no family_id). Used for confirmation and slot notifications.';
COMMENT ON COLUMN public.waitlist.contact_name IS
  'Display name for anonymous waitlist entries (child or parent name).';
COMMENT ON COLUMN public.waitlist.confirmation_sent_at IS
  'Timestamp when the waitlist confirmation email was sent. NULL = not yet sent.';

-- 3. RLS policy: anonymous users may INSERT to waitlist (for public join flow)
--    Only service_role may SELECT/UPDATE (waitlist data is Sensitive).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'waitlist'
      AND policyname = 'Anyone can join public waitlist'
  ) THEN
    CREATE POLICY "Anyone can join public waitlist" ON public.waitlist
      FOR INSERT TO public
      WITH CHECK (family_id IS NULL AND contact_email IS NOT NULL);
  END IF;
END $$;

-- 4. Replace add_to_waitlist_with_position to accept optional contact fields
CREATE OR REPLACE FUNCTION public.add_to_waitlist_with_position(
  p_session_id    UUID,
  p_child_id      UUID    DEFAULT NULL,
  p_family_id     UUID    DEFAULT NULL,
  p_contact_email TEXT    DEFAULT NULL,
  p_contact_name  TEXT    DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_position      INTEGER;
  v_waitlist_id   UUID;
  v_session_info  RECORD;
BEGIN
  SET search_path = '';

  -- Resolve session metadata for the response
  SELECT
    s.id,
    p.name                                  AS program_name,
    CASE s.day_of_week
      WHEN 0 THEN 'Sunday'
      WHEN 1 THEN 'Monday'
      WHEN 2 THEN 'Tuesday'
      WHEN 3 THEN 'Wednesday'
      WHEN 4 THEN 'Thursday'
      WHEN 5 THEN 'Friday'
      WHEN 6 THEN 'Saturday'
    END                                     AS day_name,
    TO_CHAR(s.start_time, 'HH12:MI AM')    AS start_time
  INTO v_session_info
  FROM public.sessions s
  JOIN public.programs p ON s.program_id = p.id
  WHERE s.id = p_session_id;

  IF v_session_info IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Session not found');
  END IF;

  -- Guard: prevent duplicate active/notified entries for the same family (authenticated flow)
  IF p_family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.waitlist
    WHERE session_id = p_session_id
      AND family_id  = p_family_id
      AND status IN ('pending', 'notified')
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'already_waitlisted',
      'message', 'This family is already on the waitlist for this session'
    );
  END IF;

  -- Guard: prevent duplicate email entries for the same session (anonymous flow)
  IF p_family_id IS NULL AND p_contact_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.waitlist
    WHERE session_id     = p_session_id
      AND contact_email  = LOWER(TRIM(p_contact_email))
      AND status IN ('pending', 'notified')
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'already_waitlisted',
      'message', 'This email is already on the waitlist for this session'
    );
  END IF;

  -- Determine next position (based on active entries only)
  SELECT COALESCE(MAX(position), 0) + 1
  INTO v_position
  FROM public.waitlist
  WHERE session_id = p_session_id
    AND status IN ('pending', 'notified');

  INSERT INTO public.waitlist (
    session_id, child_id, family_id, position, status,
    contact_email, contact_name
  )
  VALUES (
    p_session_id,
    p_child_id,
    p_family_id,
    v_position,
    'pending',
    CASE WHEN p_contact_email IS NOT NULL THEN LOWER(TRIM(p_contact_email)) ELSE NULL END,
    NULLIF(TRIM(COALESCE(p_contact_name, '')), '')
  )
  RETURNING id INTO v_waitlist_id;

  UPDATE public.sessions
  SET waitlist_count = waitlist_count + 1
  WHERE id = p_session_id;

  RETURN json_build_object(
    'success',     TRUE,
    'waitlistId',  v_waitlist_id,
    'position',    v_position,
    'programName', v_session_info.program_name,
    'dayOfWeek',   v_session_info.day_name,
    'startTime',   v_session_info.start_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_to_waitlist_with_position(UUID, UUID, UUID, TEXT, TEXT)
  TO anon, authenticated, service_role;
