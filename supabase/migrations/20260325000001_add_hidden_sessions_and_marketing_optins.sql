/*
  # Add Hidden Sessions and Marketing Opt-Ins

  ## Rollback
  -- ALTER TABLE public.sessions DROP COLUMN IF EXISTS is_hidden;
  -- ALTER TABLE public.sessions DROP COLUMN IF EXISTS direct_link_token;
  -- ALTER TABLE public.families DROP COLUMN IF EXISTS email_opt_in;
  -- ALTER TABLE public.families DROP COLUMN IF EXISTS sms_opt_in;

  ## Changes

  ### 1. Hidden/Unlisted Sessions (Stage 3.6.1 — NBC Priority 1)
  - `sessions.is_hidden` (boolean, default false) — hides session from public /sessions page
  - `sessions.direct_link_token` (text, unique, nullable) — optional token for sharing a direct
    link to a hidden session; set by admin if they want a shareable private link
  - Index on is_hidden for fast filtering

  ### 2. Marketing Opt-Ins (Stage 3.6.1 — NBC Enhancement)
  - `families.email_opt_in` (boolean, default true) — family consented to marketing emails
  - `families.sms_opt_in` (boolean, default false) — family consented to SMS marketing
*/

-- ─── 1. Hidden sessions ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'direct_link_token'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN direct_link_token TEXT UNIQUE;
  END IF;
END $$;

-- Index: fast lookup for public-facing query (non-hidden sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_is_hidden
  ON public.sessions (is_hidden)
  WHERE is_hidden = false;

-- Index: direct link token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_direct_link_token
  ON public.sessions (direct_link_token)
  WHERE direct_link_token IS NOT NULL;

-- ─── 2. Marketing opt-ins on families ────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'families' AND column_name = 'email_opt_in'
  ) THEN
    ALTER TABLE public.families ADD COLUMN email_opt_in BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'families' AND column_name = 'sms_opt_in'
  ) THEN
    ALTER TABLE public.families ADD COLUMN sms_opt_in BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
