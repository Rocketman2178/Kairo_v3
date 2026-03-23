-- =====================================================
-- MIGRATION: add_stripe_customer_id_and_reenrollment
-- =====================================================
-- Adds:
--   1. families.stripe_customer_id     — Stripe Customer ID for saved payment methods
--   2. registrations.reenrollment_reminder_sent_at — tracks when reenrollment reminder was sent
--
-- ROLLBACK:
--   ALTER TABLE public.families DROP COLUMN IF EXISTS stripe_customer_id;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS reenrollment_reminder_sent_at;
--   DROP INDEX IF EXISTS idx_families_stripe_customer_id;
-- =====================================================

-- 1. Add stripe_customer_id to families
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_families_stripe_customer_id
  ON public.families(stripe_customer_id);

COMMENT ON COLUMN public.families.stripe_customer_id IS
  'Stripe Customer ID for this family. Used to store saved payment methods. Populated after first successful payment.';

-- 2. Add reenrollment_reminder_sent_at to registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS reenrollment_reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_registrations_reenrollment_reminder
  ON public.registrations(reenrollment_reminder_sent_at)
  WHERE reenrollment_reminder_sent_at IS NULL;

COMMENT ON COLUMN public.registrations.reenrollment_reminder_sent_at IS
  'Timestamp when a reenrollment reminder was triggered for this registration. NULL means no reminder sent yet.';
