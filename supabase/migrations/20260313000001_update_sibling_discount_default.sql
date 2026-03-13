/*
  # Update Sibling Discount Default to 25%

  ## Summary
  NBC Sports Engine data analysis shows $50-60 sibling savings on $200-250 programs
  equates to approximately 25% off the second child's registration. This migration
  updates the organization-level default from 10% to 25% to match industry benchmarks.

  ## Changes
  - `organizations.sibling_discount_percent` default: 10 → 25
  - Updates all existing organizations using the old default (10) to the new default (25)

  ## Rollback
  -- ALTER TABLE public.organizations ALTER COLUMN sibling_discount_percent SET DEFAULT 10;
  -- UPDATE public.organizations SET sibling_discount_percent = 10 WHERE sibling_discount_percent = 25;
*/

-- Update the column default
ALTER TABLE public.organizations
  ALTER COLUMN sibling_discount_percent SET DEFAULT 25;

-- Update existing organizations that still use the old default (10)
-- so they get the new standard benchmark rate
UPDATE public.organizations
  SET sibling_discount_percent = 25
  WHERE sibling_discount_percent = 10;
