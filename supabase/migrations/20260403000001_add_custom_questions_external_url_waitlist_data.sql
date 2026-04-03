-- Migration: add_custom_questions_external_url_waitlist_data
-- Adds:
--   sessions.custom_questions       JSONB  – org-defined intake questions per session
--   registrations.custom_answers    JSONB  – parent answers to custom intake questions
--   sessions.external_registration_url TEXT – link-out to an external registration site
--   waitlist.registration_data      JSONB  – preserved form data for waitlist→registration continuity
--
-- Rollback:
--   ALTER TABLE public.sessions DROP COLUMN IF EXISTS custom_questions;
--   ALTER TABLE public.sessions DROP COLUMN IF EXISTS external_registration_url;
--   ALTER TABLE public.registrations DROP COLUMN IF EXISTS custom_answers;
--   ALTER TABLE public.waitlist DROP COLUMN IF EXISTS registration_data;

-- ─── sessions.custom_questions ────────────────────────────────────────────────
-- Array of question objects:
--   { "id": "shirt_size", "label": "Shirt Size", "type": "select",
--     "options": ["YXS","YS","YM","YL","YXL"], "required": true }
-- Supported types: "text" | "select" | "checkbox" | "textarea"
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS custom_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sessions.custom_questions IS
  'Array of org-defined intake question objects shown during checkout step 1. '
  'Each object: {id, label, type, required, options?}';

-- ─── sessions.external_registration_url ──────────────────────────────────────
-- When set, the public Sessions page links out to this URL instead of the
-- internal /register flow. Useful for programs hosted on another platform.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS external_registration_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.sessions.external_registration_url IS
  'If set, the Register button links out to this external URL instead of the '
  'internal checkout flow. Must be a valid https:// URL.';

-- ─── registrations.custom_answers ────────────────────────────────────────────
-- Key/value map matching the question IDs from sessions.custom_questions:
--   { "shirt_size": "YS", "allergy_notes": "None" }
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.registrations.custom_answers IS
  'Parent-submitted answers to the session''s custom_questions, keyed by question id.';

-- ─── waitlist.registration_data ──────────────────────────────────────────────
-- Stores parent form data captured during the waitlist join flow so that
-- when a spot opens, the registration form can be pre-populated without
-- requiring the family to re-enter their information.
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS registration_data JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.waitlist.registration_data IS
  'Preserved family/child form data from waitlist join. Used to pre-populate '
  'the registration form when a spot opens (waitlist-to-registration continuity).';

-- ─── Demo seed: add custom questions to a couple of Soccer Shots sessions ─────
-- Shirt size question for all active sessions of the Soccer Shots Demo org
-- (org id 00000000-0000-0000-0000-000000000001)
UPDATE public.sessions
SET custom_questions = '[
  {
    "id": "shirt_size",
    "label": "Youth Shirt Size",
    "type": "select",
    "required": true,
    "options": ["YXS (2-3)", "YS (4-5)", "YM (6-8)", "YL (10-12)", "YXL (14-16)"]
  },
  {
    "id": "allergy_notes",
    "label": "Allergies or Medical Notes",
    "type": "textarea",
    "required": false,
    "placeholder": "e.g. bee sting allergy, asthma inhaler on hand"
  }
]'::jsonb
WHERE program_id IN (
  SELECT id FROM public.programs
  WHERE organization_id = '00000000-0000-0000-0000-000000000001'
    AND name ILIKE '%Soccer%'
  LIMIT 6
);
