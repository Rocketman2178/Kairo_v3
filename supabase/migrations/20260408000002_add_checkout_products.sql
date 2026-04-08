-- ─── Migration: add_checkout_products ─────────────────────────────────────────
-- Adds org-configurable checkout product upsells (jersey, gear, apparel) and
-- tracks which products a family selected during registration.
-- Also adds payment_link_sent_at to registrations for pay-later email cooldown.
--
-- ROLLBACK:
--   ALTER TABLE public.organizations DROP COLUMN IF EXISTS checkout_products;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS selected_products;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS payment_link_sent_at;
--   -- Restore get_pending_registration() from migration 20260407000001.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add checkout_products column to organizations
--    Each element: { id, name, description, price_cents, image_url? }
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS checkout_products JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.organizations.checkout_products IS
  'Array of org-configured product upsells shown at checkout. '
  'Schema: [{id: string, name: string, description: string, price_cents: integer, image_url?: string}]';

-- 2. Add selected_products column to registrations
--    Stores the product ids the parent selected during checkout
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS selected_products JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.registrations.selected_products IS
  'Array of checkout product IDs selected by the family during registration.';

-- 3. Add payment_link_sent_at to registrations (cooldown for send-payment-link emails)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.registrations.payment_link_sent_at IS
  'Timestamp of the last payment link reminder email sent. Used to enforce a 5-minute cooldown.';

-- 4. Replace get_pending_registration() to include checkout_products
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
      'end_time',            s.end_time,
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
      'checkout_products',       COALESCE(o.checkout_products, '[]'::jsonb)
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
