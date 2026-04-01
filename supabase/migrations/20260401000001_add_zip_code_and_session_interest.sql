/*
  # Add Zip Code to Locations + Session Interest Table

  ## Rollback
  -- ALTER TABLE public.locations DROP COLUMN IF EXISTS zip_code;
  -- DROP TABLE IF EXISTS public.session_interest;

  ## Changes

  ### 1. locations.zip_code
  - Adds `zip_code` text column to locations table
  - Supports both US zip codes (5-digit) and Canadian postal codes (A1A 1A1 format)
  - Populates demo location zip codes from existing address data
  - Adds index for fast zip code lookups

  ### 2. session_interest
  - Captures pre-registration interest for full or upcoming classes
  - Anonymous email capture — no auth required
  - Enables "Notify Me when a spot opens" feature
  - RLS: public INSERT, service_role SELECT/UPDATE/DELETE
*/

-- ─── 1. Add zip_code to locations ─────────────────────────────────────────────

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS zip_code text;

-- Populate zip codes for existing demo locations from their addresses
UPDATE public.locations SET zip_code = '92618' WHERE id = '00000000-0000-0000-0000-000000000103'; -- Oakwood Recreation Center, Irvine CA
UPDATE public.locations SET zip_code = '92866' WHERE id = '00000000-0000-0000-0000-000000000101'; -- Main Sports Complex, Orange CA
UPDATE public.locations SET zip_code = '92832' WHERE id = '00000000-0000-0000-0000-000000000102'; -- North Field Location, Fullerton CA
UPDATE public.locations SET zip_code = '92868' WHERE id = '00000000-0000-0000-0000-000000000105'; -- Westside Sports Complex, Orange CA
UPDATE public.locations SET zip_code = '92867' WHERE id = '00000000-0000-0000-0000-000000000106'; -- East Park Athletic Fields, Orange CA
UPDATE public.locations SET zip_code = '92688' WHERE id = '00000000-0000-0000-0000-000000000104'; -- RSM Community Center, Rancho Santa Margarita CA

-- Index for zip code filter queries
CREATE INDEX IF NOT EXISTS idx_locations_zip_code
  ON public.locations (zip_code)
  WHERE zip_code IS NOT NULL;

-- ─── 2. session_interest table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.session_interest (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  organization_id uuid      NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  name          text,
  notify_on     text        NOT NULL DEFAULT 'spot_opens' CHECK (notify_on IN ('spot_opens', 'registration_opens', 'any')),
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Prevent duplicate interest entries per email + session
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_interest_unique
  ON public.session_interest (session_id, lower(email));

-- Fast lookups for admin dashboard
CREATE INDEX IF NOT EXISTS idx_session_interest_session_id
  ON public.session_interest (session_id);

CREATE INDEX IF NOT EXISTS idx_session_interest_org_id
  ON public.session_interest (organization_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.session_interest ENABLE ROW LEVEL SECURITY;

-- Anyone can register interest (anonymous registration flow)
CREATE POLICY "Anyone can register session interest"
  ON public.session_interest
  FOR INSERT TO public
  WITH CHECK (true);

-- Only service role can read, update, delete (for notification dispatch)
CREATE POLICY "Service role manages session interest"
  ON public.session_interest
  FOR ALL TO service_role
  USING (true);
