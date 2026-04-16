-- Feature 3.8: Transfer Billing Adjustment — audit column
ALTER TABLE public.class_transfers
  ADD COLUMN IF NOT EXISTS billing_applied_at TIMESTAMPTZ;

COMMENT ON COLUMN public.class_transfers.billing_applied_at IS
  'Timestamp when the billing adjustment (refund/charge) was successfully applied via Stripe. NULL = not yet applied or no adjustment needed.';
