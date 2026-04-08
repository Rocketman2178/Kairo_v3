-- ─── Migration: add_class_transfers ──────────────────────────────────────────
-- Adds the class_transfers table to track parent-initiated session transfer
-- requests. Includes billing adjustment computation (charge vs. credit) and
-- full transfer history per family.
--
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.request_class_transfer(UUID, UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.get_available_transfer_sessions(UUID);
--   DROP TABLE IF EXISTS public.class_transfers;
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create class_transfers table
CREATE TABLE IF NOT EXISTS public.class_transfers (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                 UUID        NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id                  UUID        REFERENCES public.children(id) ON DELETE SET NULL,
  from_registration_id      UUID        NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  to_session_id             UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reason                    TEXT,
  status                    TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  billing_adjustment_cents  INTEGER     NOT NULL DEFAULT 0,
  billing_direction         TEXT        NOT NULL DEFAULT 'none'
                            CHECK (billing_direction IN ('credit', 'charge', 'none')),
  requested_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at              TIMESTAMPTZ,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.class_transfers IS
  'Tracks parent-initiated class transfer requests between sessions. '
  'billing_adjustment_cents = ABS(new_price - old_price); '
  'billing_direction indicates whether the family owes more (charge) or gets a credit.';

ALTER TABLE public.class_transfers ENABLE ROW LEVEL SECURITY;

-- Families can view their own transfer history
CREATE POLICY "Families view own transfers" ON public.class_transfers
  FOR SELECT TO authenticated
  USING (family_id IN (
    SELECT id FROM public.families WHERE user_id = auth.uid()
  ));

-- Anonymous and authenticated users can submit transfer requests
CREATE POLICY "Anyone can request a transfer" ON public.class_transfers
  FOR INSERT TO public
  WITH CHECK (true);

-- Service role manages all operations
CREATE POLICY "Service role manages all transfers" ON public.class_transfers
  FOR ALL TO service_role
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: get_available_transfer_sessions(p_registration_id)
-- Returns open sessions in the same organisation as the given confirmed
-- registration, excluding the current session. Ordered by date/time.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_available_transfer_sessions(
  p_registration_id UUID
)
RETURNS TABLE (
  id               UUID,
  day_of_week      INTEGER,
  start_time       TIME,
  start_date       DATE,
  end_date         DATE,
  capacity         INTEGER,
  enrolled_count   INTEGER,
  spots_remaining  INTEGER,
  program_id       UUID,
  program_name     TEXT,
  price_cents      INTEGER,
  location_name    TEXT,
  location_address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_session_id UUID;
  v_org_id             UUID;
BEGIN
  -- sessions has no organization_id column; get it via programs
  SELECT s.id, p.organization_id
  INTO   v_current_session_id, v_org_id
  FROM   public.registrations r
  JOIN   public.sessions      s ON s.id  = r.session_id
  JOIN   public.programs      p ON p.id  = s.program_id
  WHERE  r.id     = p_registration_id
    AND  r.status = 'confirmed';

  IF v_current_session_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.day_of_week,
    s.start_time,
    s.start_date,
    s.end_date,
    s.capacity,
    s.enrolled_count,
    GREATEST(0, s.capacity - s.enrolled_count)::INTEGER AS spots_remaining,
    p.id                                                 AS program_id,
    p.name                                               AS program_name,
    p.price_cents,
    l.name                                               AS location_name,
    l.address                                            AS location_address
  FROM   public.sessions   s
  JOIN   public.programs   p ON p.id = s.program_id
  LEFT JOIN public.locations l ON l.id = s.location_id
  WHERE  p.organization_id = v_org_id
    AND  s.id              != v_current_session_id
    AND  s.status           = 'active'
    AND  s.is_hidden        = false
    AND  s.enrolled_count   < s.capacity
    AND  (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
  ORDER  BY s.start_date, s.day_of_week, s.start_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_transfer_sessions(UUID)
  TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: request_class_transfer(p_registration_id, p_to_session_id, p_reason)
-- Creates a pending transfer request and computes the billing adjustment.
-- Returns JSON: { transfer_id, billing_adjustment_cents, billing_direction }
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_class_transfer(
  p_registration_id UUID,
  p_to_session_id   UUID,
  p_reason          TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_transfer_id         UUID;
  v_family_id           UUID;
  v_child_id            UUID;
  v_current_price_cents INTEGER;
  v_new_price_cents     INTEGER;
  v_adjustment          INTEGER;
  v_direction           TEXT;
BEGIN
  -- Validate and load the confirmed registration
  SELECT r.family_id, r.child_id, r.amount_cents
  INTO   v_family_id, v_child_id, v_current_price_cents
  FROM   public.registrations r
  WHERE  r.id     = p_registration_id
    AND  r.status = 'confirmed';

  IF v_family_id IS NULL THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Registration not found or not confirmed'
    );
  END IF;

  -- Validate target session and load its price
  SELECT p.price_cents
  INTO   v_new_price_cents
  FROM   public.sessions  s
  JOIN   public.programs  p ON p.id = s.program_id
  WHERE  s.id            = p_to_session_id
    AND  s.status        = 'active'
    AND  s.enrolled_count < s.capacity;

  IF v_new_price_cents IS NULL THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Target session is not available for transfer'
    );
  END IF;

  -- Compute billing adjustment (positive = family owes more; negative = credit)
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
    family_id,
    child_id,
    from_registration_id,
    to_session_id,
    reason,
    status,
    billing_adjustment_cents,
    billing_direction
  ) VALUES (
    v_family_id,
    v_child_id,
    p_registration_id,
    p_to_session_id,
    p_reason,
    'pending',
    v_adjustment,
    v_direction
  )
  RETURNING id INTO v_transfer_id;

  RETURN json_build_object(
    'transfer_id',              v_transfer_id,
    'billing_adjustment_cents', v_adjustment,
    'billing_direction',        v_direction
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_class_transfer(UUID, UUID, TEXT)
  TO anon, authenticated, service_role;
