-- ============================================================
-- Feature 3.7: Makeup Token Cancellation Trigger
-- Adds cancelled_at to registrations + cancel_registration() RPC
-- ============================================================

-- 1. Add cancelled_at audit column
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.registrations.cancelled_at IS
  'Timestamp when the registration was cancelled (NULL if never cancelled).';

-- 2. cancel_registration() RPC — atomically:
--    a. Marks registration cancelled + stamps cancelled_at
--    b. Decrements session enrolled_count (if was confirmed)
--    c. Issues a makeup token for the child (level-locked, org-configured expiry)
--
--    p_registration_id  - the registration to cancel
--    p_issue_token      - if TRUE (default) a makeup token is issued
--    p_notes            - unused (reserved for future use)
CREATE OR REPLACE FUNCTION public.cancel_registration(
  p_registration_id UUID,
  p_issue_token     BOOLEAN DEFAULT TRUE,
  p_notes           TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_reg            RECORD;
  v_org_id         UUID;
  v_child_skill    TEXT;
  v_expiry_months  INTEGER := 12;
  v_token_result   JSON;
  v_token_id       UUID;
BEGIN
  -- Lock & load the registration with org context
  SELECT r.*, s.program_id, p.organization_id
  INTO   v_reg
  FROM   public.registrations r
  JOIN   public.sessions  s ON s.id = r.session_id
  JOIN   public.programs  p ON p.id = s.program_id
  WHERE  r.id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', true, 'message', 'Registration not found');
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RETURN json_build_object('error', true, 'message', 'Registration is already cancelled');
  END IF;

  IF v_reg.status NOT IN ('confirmed', 'awaiting_payment', 'pending') THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Cannot cancel a registration with status: ' || v_reg.status
    );
  END IF;

  v_org_id := v_reg.organization_id;

  -- Look up org token expiry preference (default 12 months)
  SELECT COALESCE((settings->>'makeup_token_expiry_months')::INTEGER, 12)
  INTO   v_expiry_months
  FROM   public.organizations
  WHERE  id = v_org_id;

  -- Fetch child's current skill level for token level-locking
  IF v_reg.child_id IS NOT NULL THEN
    SELECT skill_level INTO v_child_skill
    FROM   public.children
    WHERE  id = v_reg.child_id;
  END IF;

  -- 1. Cancel the registration
  UPDATE public.registrations
  SET    status       = 'cancelled',
         cancelled_at = NOW(),
         updated_at   = NOW()
  WHERE  id = p_registration_id;

  -- 2. Decrement session enrolled_count only if registration was confirmed
  IF v_reg.status = 'confirmed' THEN
    UPDATE public.sessions
    SET    enrolled_count = GREATEST(0, enrolled_count - 1),
           updated_at     = NOW()
    WHERE  id = v_reg.session_id;
  END IF;

  -- 3. Optionally issue a makeup token
  IF p_issue_token AND v_reg.child_id IS NOT NULL THEN
    SELECT public.issue_makeup_token(
      p_organization_id        => v_org_id,
      p_family_id              => v_reg.family_id,
      p_child_id               => v_reg.child_id,
      p_skill_level            => v_child_skill,
      p_source_registration_id => p_registration_id,
      p_source_session_id      => v_reg.session_id,
      p_expiry_months          => v_expiry_months,
      p_makeup_fee_cents       => 0
    )
    INTO v_token_result;

    v_token_id := (v_token_result->>'token_id')::UUID;
  END IF;

  RETURN json_build_object(
    'success',         true,
    'registration_id', p_registration_id,
    'session_id',      v_reg.session_id,
    'token_id',        v_token_id,
    'token_issued',    (v_token_id IS NOT NULL)
  );
END;
$$;
