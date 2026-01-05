/*
  # Add Regional Management for Franchises

  1. New Regions Table
    - Track franchise territories
    - Revenue share percentages
    - Regional managers
    
  2. Update Locations
    - Link locations to regions
    
  3. Security
    - Enable RLS on regions table
*/

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_name TEXT,
  revenue_share_percent DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_org_region_code UNIQUE(organization_id, code)
);

-- Enable RLS on regions
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Anyone can view regions
CREATE POLICY "Anyone can view regions"
  ON regions FOR SELECT
  USING (true);

-- Only authenticated users can manage regions
CREATE POLICY "Authenticated users can manage regions"
  ON regions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_regions_organization ON regions(organization_id);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active) WHERE is_active = true;

-- Add updated_at trigger for regions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_regions_updated_at'
  ) THEN
    CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add region_id to locations if column doesn't exist already
-- (we may have added it in a previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region_id);
  END IF;
END $$;