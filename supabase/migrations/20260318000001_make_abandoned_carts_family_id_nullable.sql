-- Migration: make_abandoned_carts_family_id_nullable
--
-- Rollback:
--   ALTER TABLE public.abandoned_carts ALTER COLUMN family_id SET NOT NULL;
--
-- Reason:
--   Cart abandonment is recorded during the ANONYMOUS registration flow, before a
--   family record has been created. The family_id is only known after the user
--   completes registration. The NOT NULL constraint caused every anonymous cart
--   abandonment DB insert to fail silently, breaking the entire cart recovery system.

ALTER TABLE public.abandoned_carts
  ALTER COLUMN family_id DROP NOT NULL;

COMMENT ON COLUMN public.abandoned_carts.family_id IS
  'NULL for anonymous/pre-auth carts. Populated after family record is created upon registration completion.';
