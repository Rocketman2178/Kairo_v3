/*
  # Add Discount System and Season Management

  1. Organization Enhancements
    - Add discount percentages and settings
    
  2. New Seasons Table
    - Track registration windows
    
  3. Families Table Enhancements
    - Returning family tracking
    
  4. Registrations Table Enhancements
    - Discount tracking
    
  5. Locations Table Enhancements
    - Partner locations and capacity
*/

-- Add discount settings to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'sibling_discount_percent'
  ) THEN
    ALTER TABLE organizations 
    ADD COLUMN sibling_discount_percent INT DEFAULT 10,
    ADD COLUMN early_bird_discount_percent INT DEFAULT 5,
    ADD COLUMN returning_family_discount_percent INT DEFAULT 5,
    ADD COLUMN early_bird_days_before_start INT DEFAULT 30;
  END IF;
END $$;

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  season_type TEXT CHECK (season_type IN ('winter', 'spring', 'summer', 'fall')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_opens DATE NOT NULL,
  registration_closes DATE NOT NULL,
  weeks INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on seasons
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view seasons" ON seasons;
DROP POLICY IF EXISTS "Authenticated users can manage seasons" ON seasons;

-- Create policies
CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage seasons"
  ON seasons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for seasons
CREATE INDEX IF NOT EXISTS idx_seasons_organization ON seasons(organization_id);
CREATE INDEX IF NOT EXISTS idx_seasons_current ON seasons(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- Add season_id to sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_season ON sessions(season_id);

-- Add returning family tracking to families
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'families' AND column_name = 'is_returning'
  ) THEN
    ALTER TABLE families 
    ADD COLUMN is_returning BOOLEAN DEFAULT false,
    ADD COLUMN preferred_location_id UUID REFERENCES locations(id),
    ADD COLUMN preferred_day_of_week INTEGER CHECK (preferred_day_of_week >= 0 AND preferred_day_of_week <= 6),
    ADD COLUMN total_registrations INTEGER DEFAULT 0,
    ADD COLUMN last_registration_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add discount tracking to registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'discount_applied_percent'
  ) THEN
    ALTER TABLE registrations 
    ADD COLUMN discount_applied_percent INTEGER DEFAULT 0,
    ADD COLUMN discount_reason TEXT,
    ADD COLUMN discount_amount_cents INTEGER DEFAULT 0,
    ADD COLUMN original_price_cents INTEGER;
  END IF;
END $$;

-- Add partner location and capacity fields to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'is_partner_location'
  ) THEN
    ALTER TABLE locations 
    ADD COLUMN is_partner_location BOOLEAN DEFAULT false,
    ADD COLUMN capacity_indoor INTEGER,
    ADD COLUMN capacity_outdoor INTEGER,
    ADD COLUMN has_restrooms BOOLEAN DEFAULT true,
    ADD COLUMN has_parking BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add updated_at trigger for seasons if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_seasons_updated_at'
  ) THEN
    CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to calculate discount for a registration
CREATE OR REPLACE FUNCTION calculate_registration_discount(
  p_family_id UUID,
  p_session_id UUID,
  p_registration_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  discount_percent INTEGER,
  discount_reason TEXT,
  discount_amount_cents INTEGER
) AS $$
DECLARE
  v_organization_id UUID;
  v_sibling_discount INT;
  v_early_bird_discount INT;
  v_returning_discount INT;
  v_early_bird_days INT;
  v_is_returning BOOLEAN;
  v_existing_registrations INT;
  v_session_start_date DATE;
  v_session_price_cents INT;
  v_final_discount INT := 0;
  v_final_reason TEXT := '';
  v_days_before_start INT;
BEGIN
  -- Get organization settings
  SELECT 
    o.id,
    o.sibling_discount_percent,
    o.early_bird_discount_percent,
    o.returning_family_discount_percent,
    o.early_bird_days_before_start
  INTO 
    v_organization_id,
    v_sibling_discount,
    v_early_bird_discount,
    v_returning_discount,
    v_early_bird_days
  FROM organizations o
  JOIN programs p ON p.organization_id = o.id
  JOIN sessions s ON s.program_id = p.id
  WHERE s.id = p_session_id;

  -- Get family info
  SELECT is_returning INTO v_is_returning
  FROM families
  WHERE id = p_family_id;

  -- Get session details
  SELECT s.start_date, pr.price_cents
  INTO v_session_start_date, v_session_price_cents
  FROM sessions s
  JOIN programs pr ON s.program_id = pr.id
  WHERE s.id = p_session_id;

  -- Count existing registrations for this family in the same season
  SELECT COUNT(*)
  INTO v_existing_registrations
  FROM registrations r
  JOIN sessions s ON r.session_id = s.id
  WHERE r.family_id = p_family_id
    AND r.status IN ('pending', 'confirmed')
    AND s.season_id = (SELECT season_id FROM sessions WHERE id = p_session_id);

  -- Check for sibling discount
  IF v_existing_registrations > 0 THEN
    v_final_discount := v_sibling_discount;
    v_final_reason := 'Sibling discount';
  END IF;

  -- Check for early bird discount
  IF v_session_start_date IS NOT NULL THEN
    v_days_before_start := v_session_start_date - p_registration_date;
    IF v_days_before_start >= v_early_bird_days THEN
      IF v_early_bird_discount > v_final_discount THEN
        v_final_discount := v_early_bird_discount;
        v_final_reason := 'Early bird discount';
      ELSIF v_final_discount > 0 THEN
        v_final_reason := v_final_reason || ' + Early bird';
      END IF;
    END IF;
  END IF;

  -- Check for returning family discount
  IF v_is_returning AND v_returning_discount > 0 THEN
    IF v_final_discount = 0 THEN
      v_final_discount := v_returning_discount;
      v_final_reason := 'Returning family discount';
    ELSIF v_final_discount < 15 THEN
      v_final_discount := LEAST(v_final_discount + v_returning_discount, 15);
      v_final_reason := v_final_reason || ' + Returning family';
    END IF;
  END IF;

  -- Calculate discount amount
  RETURN QUERY SELECT 
    v_final_discount,
    v_final_reason,
    (v_session_price_cents * v_final_discount / 100)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Create function to update family stats after registration
CREATE OR REPLACE FUNCTION update_family_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE families
    SET 
      total_registrations = total_registrations + 1,
      last_registration_date = NEW.created_at,
      is_returning = CASE 
        WHEN total_registrations >= 1 THEN true 
        ELSE false 
      END
    WHERE id = NEW.family_id;
    
    -- Update preferred location and day
    UPDATE families f
    SET 
      preferred_location_id = s.location_id,
      preferred_day_of_week = s.day_of_week
    FROM sessions s
    WHERE s.id = NEW.session_id 
      AND f.id = NEW.family_id
      AND f.preferred_location_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update family stats
DROP TRIGGER IF EXISTS update_family_stats_on_registration ON registrations;
CREATE TRIGGER update_family_stats_on_registration
  AFTER INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_family_stats();