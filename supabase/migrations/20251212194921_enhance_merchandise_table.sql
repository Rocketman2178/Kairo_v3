/*
  # Enhance Merchandise Table

  1. Add Missing Columns
    - `category` (text) - Jersey, Apparel, Equipment, Parent Gear
    - `is_upsell` (boolean) - Show during registration flow
    - `available_at_registration` (boolean) - Can be added to cart
    - `inventory_count` (integer) - Stock tracking

  2. Note
    - Existing columns: id, organization_id, name, description, sku, price_cents, 
      is_free_with_registration, sizes, image_url, is_active, created_at, updated_at
*/

-- Add category column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchandise' AND column_name = 'category'
  ) THEN
    ALTER TABLE merchandise ADD COLUMN category text 
      CHECK (category IN ('Jersey', 'Apparel', 'Equipment', 'Parent Gear', 'Other')) 
      DEFAULT 'Other';
  END IF;
END $$;

-- Add is_upsell column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchandise' AND column_name = 'is_upsell'
  ) THEN
    ALTER TABLE merchandise ADD COLUMN is_upsell BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add available_at_registration column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchandise' AND column_name = 'available_at_registration'
  ) THEN
    ALTER TABLE merchandise ADD COLUMN available_at_registration BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add inventory_count column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchandise' AND column_name = 'inventory_count'
  ) THEN
    ALTER TABLE merchandise ADD COLUMN inventory_count INTEGER DEFAULT 999;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_merchandise_category ON merchandise(category);
CREATE INDEX IF NOT EXISTS idx_merchandise_upsell ON merchandise(is_upsell) WHERE is_upsell = true;
CREATE INDEX IF NOT EXISTS idx_merchandise_active ON merchandise(is_active) WHERE is_active = true;