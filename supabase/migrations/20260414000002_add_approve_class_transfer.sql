-- ─────────────────────────────────────────────────────────────────────────────
-- approve_class_transfer(p_transfer_id)
-- ─────────────────────────────────────────────────────────────────────────────
-- Atomically approves a pending class transfer:
--   1. Validates the transfer is in 'pending' status.
--   2. Looks up the from_registration and from_session.
--   3. Updates the registration's session_id to the destination session.
--   4. Decrements enrolled_count on the from_session.
--   5. Increments enrolled_count on the to_session.
--   6. Marks the transfer as 'approved' with processed_at = NOW().
--   7. Returns from_session_id so the caller can check/notify the waitlist.
--
-- Returns JSON:
--   { "transfer_id": uuid, "from_session_id": uuid, "to_session_id": uuid }
-- or
--   { "error": true, "message": "..." }
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_class_transfer(p_transfer_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_transfer          RECORD;
  v_from_session_id   UUID;
  v_to_session_id     UUID;
  v_from_reg_id       UUID;
BEGIN
  -- Load and lock the transfer row
  SELECT *
  INTO   v_transfer
  FROM   public.class_transfers
  WHERE  id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', true, 'message', 'Transfer not found');
  END IF;

  IF v_transfer.status <> 'pending' THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Transfer is not in pending status (current: ' || v_transfer.status || ')'
    );
  END IF;

  v_from_reg_id  := v_transfer.from_registration_id;
  v_to_session_id := v_transfer.to_session_id;

  -- Look up the from_session from the original registration
  SELECT session_id
  INTO   v_from_session_id
  FROM   public.registrations
  WHERE  id = v_from_reg_id;

  IF v_from_session_id IS NULL THEN
    RETURN json_build_object('error', true, 'message', 'Source registration not found');
  END IF;

  -- Verify the target session still has capacity
  PERFORM 1
  FROM   public.sessions
  WHERE  id            = v_to_session_id
    AND  status        = 'active'
    AND  enrolled_count < capacity;

  IF NOT FOUND THEN
    RETURN json_build_object('error', true, 'message', 'Target session is full or inactive');
  END IF;

  -- 1. Move the registration to the new session
  UPDATE public.registrations
  SET    session_id = v_to_session_id,
         updated_at = NOW()
  WHERE  id = v_from_reg_id;

  -- 2. Decrement enrolled_count on the from_session (cannot go below 0)
  UPDATE public.sessions
  SET    enrolled_count = GREATEST(0, enrolled_count - 1),
         updated_at     = NOW()
  WHERE  id = v_from_session_id;

  -- 3. Increment enrolled_count on the to_session
  UPDATE public.sessions
  SET    enrolled_count = enrolled_count + 1,
         updated_at     = NOW()
  WHERE  id = v_to_session_id;

  -- 4. Approve the transfer
  UPDATE public.class_transfers
  SET    status       = 'approved',
         processed_at = NOW(),
         updated_at   = NOW()
  WHERE  id = p_transfer_id;

  RETURN json_build_object(
    'transfer_id',      p_transfer_id,
    'from_session_id',  v_from_session_id,
    'to_session_id',    v_to_session_id
  );
END;
$$;
