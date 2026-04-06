-- Migration: add_waitlist_declined_status
-- Adds 'declined' status to the waitlist table and normalizes legacy status values so the
-- database matches what the frontend already expects ('pending' instead of 'active',
-- 'notified' instead of 'promoted').  Also adds a declined_at timestamp and updates the
-- add_to_waitlist_with_position RPC so new entries use 'pending'.
--
-- NBC Priority 2 — Stage 3.6.1: Don't delete declined waitlist registrations.
-- Declined spots now transition to status='declined' (with a timestamp) instead of being
-- deleted, preserving the full waitlist audit trail.
--
-- ROLLBACK:
--   UPDATE public.waitlist SET status = 'active'    WHERE status = 'pending';
--   UPDATE public.waitlist SET status = 'promoted'  WHERE status = 'notified';
--   ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS valid_waitlist_status;
--   ALTER TABLE public.waitlist ADD CONSTRAINT valid_waitlist_status
--     CHECK (status IN ('active', 'promoted', 'cancelled'));
--   ALTER TABLE public.waitlist DROP COLUMN IF EXISTS declined_at;
--   -- Re-run the original add_to_waitlist_with_position from
--   -- 20251210204907_add_n8n_database_functions.sql to restore 'active' insert.

-- ─── 1. Drop old constraint ────────────────────────────────────────────────────
ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS valid_waitlist_status;

-- ─── 2. Normalize legacy status values ────────────────────────────────────────
-- 'active'   → 'pending'  (frontend has always expected this name)
-- 'promoted' → 'notified' (frontend has always expected this name)
UPDATE public.waitlist SET status = 'pending'  WHERE status = 'active';
UPDATE public.waitlist SET status = 'notified' WHERE status = 'promoted';

-- ─── 3. New constraint with full value set ────────────────────────────────────
ALTER TABLE public.waitlist ADD CONSTRAINT valid_waitlist_status CHECK (
  status IN ('pending', 'notified', 'enrolled', 'cancelled', 'declined')
);

-- ─── 4. Add declined_at column ───────────────────────────────────────────────
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

COMMENT ON COLUMN public.waitlist.declined_at IS
  'Timestamp when the family explicitly declined an available spot notification. '
  'Records are preserved (not deleted) — status transitions to ''declined'' and '
  'this column is populated so operators retain full waitlist history.';

-- ─── 5. Update add_to_waitlist_with_position RPC ─────────────────────────────
-- Replaces the version from 20251210204907_add_n8n_database_functions.sql to:
--   • Use 'pending' instead of 'active' for new entries.
--   • Guard against duplicate active/notified waitlist entries per family.
--   • Use fully-qualified table names (security best practice per CLAUDE.md).
CREATE OR REPLACE FUNCTION public.add_to_waitlist_with_position(
  p_session_id UUID,
  p_child_id   UUID DEFAULT NULL,
  p_family_id  UUID DEFAULT NULL
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

  -- Guard: prevent duplicate active/notified entries for the same family
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

  -- Determine next position (based on active entries only)
  SELECT COALESCE(MAX(position), 0) + 1
  INTO v_position
  FROM public.waitlist
  WHERE session_id = p_session_id
    AND status IN ('pending', 'notified');

  INSERT INTO public.waitlist (session_id, child_id, family_id, position, status)
  VALUES (p_session_id, p_child_id, p_family_id, v_position, 'pending')
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
