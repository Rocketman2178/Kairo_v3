-- Add expiration warning tracking columns to makeup_tokens
-- Tracks when 30-day and 7-day warning emails were sent to prevent duplicate sends

ALTER TABLE public.makeup_tokens
  ADD COLUMN IF NOT EXISTS warning_30d_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warning_7d_sent_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.makeup_tokens.warning_30d_sent_at IS 'Timestamp when the 30-day expiration warning was sent to the parent';
COMMENT ON COLUMN public.makeup_tokens.warning_7d_sent_at  IS 'Timestamp when the 7-day expiration warning was sent to the parent';
