-- Add from_session_id to class_transfers for full audit trail
-- Stores which session a child transferred OUT OF, preserving this info even
-- after the registration's session_id is moved to the destination.

ALTER TABLE public.class_transfers
  ADD COLUMN IF NOT EXISTS from_session_id UUID REFERENCES public.sessions(id);

-- Backfill: for pending transfers, the registration still points to the from_session
UPDATE public.class_transfers ct
SET from_session_id = r.session_id
FROM public.registrations r
WHERE ct.from_registration_id = r.id
  AND ct.from_session_id IS NULL
  AND ct.status = 'pending';

-- Update request_class_transfer to capture from_session_id at request time
CREATE OR REPLACE FUNCTION public.request_class_transfer(p_registration_id uuid, p_to_session_id uuid, p_reason text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_transfer_id         UUID;
  v_family_id           UUID;
  v_child_id            UUID;
  v_current_price_cents INTEGER;
  v_new_price_cents     INTEGER;
  v_adjustment          INTEGER;
  v_direction           TEXT;
BEGIN
  SELECT r.family_id, r.child_id, r.amount_cents
  INTO   v_family_id, v_child_id, v_current_price_cents
  FROM   public.registrations r
  WHERE  r.id     = p_registration_id
    AND  r.status = 'confirmed';

  IF v_family_id IS NULL THEN
    RETURN json_build_object('error', true, 'message', 'Registration not found or not confirmed');
  END IF;

  SELECT p.price_cents
  INTO   v_new_price_cents
  FROM   public.sessions  s
  JOIN   public.programs  p ON p.id = s.program_id
  WHERE  s.id            = p_to_session_id
    AND  s.status        = 'active'
    AND  s.enrolled_count < s.capacity;

  IF v_new_price_cents IS NULL THEN
    RETURN json_build_object('error', true, 'message', 'Target session is not available for transfer');
  END IF;

  v_adjustment := v_new_price_cents - COALESCE(v_current_price_cents, 0);
  IF v_adjustment > 0 THEN
    v_direction  := 'charge';
  ELSIF v_adjustment < 0 THEN
    v_direction  := 'credit';
    v_adjustment := ABS(v_adjustment);
  ELSE
    v_direction  := 'none';
    v_adjustment := 0;
  END IF;

  INSERT INTO public.class_transfers (
    family_id, child_id, from_registration_id, from_session_id, to_session_id,
    reason, status, billing_adjustment_cents, billing_direction
  )
  SELECT
    v_family_id, v_child_id, p_registration_id, r.session_id, p_to_session_id,
    p_reason, 'pending', v_adjustment, v_direction
  FROM public.registrations r
  WHERE r.id = p_registration_id
  RETURNING id INTO v_transfer_id;

  RETURN json_build_object(
    'transfer_id',              v_transfer_id,
    'billing_adjustment_cents', v_adjustment,
    'billing_direction',        v_direction
  );
END;
$function$;

-- Update approve_class_transfer to also persist from_session_id
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

  v_from_reg_id   := v_transfer.from_registration_id;
  v_to_session_id := v_transfer.to_session_id;

  IF v_transfer.from_session_id IS NOT NULL THEN
    v_from_session_id := v_transfer.from_session_id;
  ELSE
    SELECT session_id INTO v_from_session_id
    FROM   public.registrations
    WHERE  id = v_from_reg_id;
  END IF;

  IF v_from_session_id IS NULL THEN
    RETURN json_build_object('error', true, 'message', 'Source registration not found');
  END IF;

  PERFORM 1
  FROM   public.sessions
  WHERE  id            = v_to_session_id
    AND  status        = 'active'
    AND  enrolled_count < capacity;

  IF NOT FOUND THEN
    RETURN json_build_object('error', true, 'message', 'Target session is full or inactive');
  END IF;

  UPDATE public.registrations
  SET    session_id = v_to_session_id,
         updated_at = NOW()
  WHERE  id = v_from_reg_id;

  UPDATE public.sessions
  SET    enrolled_count = GREATEST(0, enrolled_count - 1),
         updated_at     = NOW()
  WHERE  id = v_from_session_id;

  UPDATE public.sessions
  SET    enrolled_count = enrolled_count + 1,
         updated_at     = NOW()
  WHERE  id = v_to_session_id;

  UPDATE public.class_transfers
  SET    status           = 'approved',
         from_session_id  = v_from_session_id,
         processed_at     = NOW(),
         updated_at       = NOW()
  WHERE  id = p_transfer_id;

  RETURN json_build_object(
    'transfer_id',      p_transfer_id,
    'from_session_id',  v_from_session_id,
    'to_session_id',    v_to_session_id
  );
END;
$$;
