-- Migration: add_custom_fields_to_sessions_and_orgs
-- Adds org-defined custom fields to sessions for internal reporting/filtering.
-- Separate from custom_questions (parent-facing checkout questions).
-- Examples: Region, County, Preschool Partner, Pre-scheduled Makeup slot.
--
-- custom_field_definitions (on organizations): JSON array defining the schema
--   [{ "key": "region", "label": "Region", "type": "text|select", "options": [...] }]
-- custom_fields (on sessions): JSON object storing values per field key
--   { "region": "South OC", "county": "Orange County" }

-- 1. Add custom_fields column to sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.sessions.custom_fields IS
  'Org-defined metadata fields for internal reporting and filtering. '
  'Key/value map where keys match the key property of entries in '
  'organizations.custom_field_definitions. '
  'Example: {"region": "South OC", "county": "Orange County", "preschool_partner": "Bright Horizons"}';

-- 2. Add custom_field_definitions column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS custom_field_definitions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.organizations.custom_field_definitions IS
  'Schema definition for org-specific session metadata fields. '
  'JSON array of field descriptors: '
  '[{ "key": "region", "label": "Region", "type": "text" }, '
  ' { "key": "county", "label": "County", "type": "select", "options": ["OC","LA","SD"] }]. '
  'Supported types: text, select. Values are stored in sessions.custom_fields.';
