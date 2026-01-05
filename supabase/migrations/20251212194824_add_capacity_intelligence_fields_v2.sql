/*
  # Add Capacity Intelligence Fields

  1. Sessions Table Enhancements
    - Add `season` column (Winter, Spring, Summer, Fall)
    - Add computed `fill_rate_percent` column
    - Add `urgency_level` computed column

  2. Locations Table Enhancements
    - Add `region` column for franchise territories
    - Add `venue_type` column (Public Park, Preschool, School, Church, Other)
    - Add `city` column for location searching
    - Add individual latitude/longitude columns

  3. Programs Table Enhancements
    - Add `age_min` and `age_max` for easier querying
    - Add `typical_capacity` with default of 12
    - Add `pricing_tier` (Budget, Standard, Premium)
    - Add `typical_duration_weeks` with default of 9

  4. Security
    - Maintain existing RLS policies
    - All new columns accessible with existing policies
*/

-- Add season to sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'season'
  ) THEN
    ALTER TABLE sessions ADD COLUMN season text 
      CHECK (season IN ('Winter', 'Spring', 'Summer', 'Fall'));
  END IF;
END $$;

-- Add computed fill_rate_percent to sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'fill_rate_percent'
  ) THEN
    ALTER TABLE sessions ADD COLUMN fill_rate_percent decimal 
      GENERATED ALWAYS AS (
        CASE 
          WHEN capacity > 0 
          THEN ROUND((enrolled_count::decimal / capacity * 100)::numeric, 1)
          ELSE 0 
        END
      ) STORED;
  END IF;
END $$;

-- Add urgency_level computed column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'urgency_level'
  ) THEN
    ALTER TABLE sessions ADD COLUMN urgency_level text 
      GENERATED ALWAYS AS (
        CASE 
          WHEN enrolled_count >= capacity THEN 'full'
          WHEN capacity > 0 AND enrolled_count::decimal / capacity > 0.75 THEN 'filling_fast'
          WHEN capacity > 0 AND enrolled_count::decimal / capacity > 0.5 THEN 'moderate'
          ELSE 'available'
        END
      ) STORED;
  END IF;
END $$;

-- Add region to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'region'
  ) THEN
    ALTER TABLE locations ADD COLUMN region text;
  END IF;
END $$;

-- Add venue_type to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'venue_type'
  ) THEN
    ALTER TABLE locations ADD COLUMN venue_type text 
      CHECK (venue_type IN ('Public Park', 'Preschool', 'School', 'Church', 'Other'))
      DEFAULT 'Public Park';
  END IF;
END $$;

-- Add city to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'city'
  ) THEN
    ALTER TABLE locations ADD COLUMN city text;
  END IF;
END $$;

-- Add latitude/longitude to locations for distance calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE locations ADD COLUMN latitude decimal(10, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE locations ADD COLUMN longitude decimal(11, 8);
  END IF;
END $$;

-- Add city_normalized for better searching
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'city_normalized'
  ) THEN
    ALTER TABLE locations ADD COLUMN city_normalized text 
      GENERATED ALWAYS AS (LOWER(TRIM(city))) STORED;
  END IF;
END $$;

-- Add age_min and age_max to programs for easier querying
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'age_min'
  ) THEN
    ALTER TABLE programs ADD COLUMN age_min int;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'age_max'
  ) THEN
    ALTER TABLE programs ADD COLUMN age_max int;
  END IF;
END $$;

-- Add typical_capacity to programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'typical_capacity'
  ) THEN
    ALTER TABLE programs ADD COLUMN typical_capacity int DEFAULT 12;
  END IF;
END $$;

-- Add pricing_tier to programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'pricing_tier'
  ) THEN
    ALTER TABLE programs ADD COLUMN pricing_tier text 
      CHECK (pricing_tier IN ('Budget', 'Standard', 'Premium'))
      DEFAULT 'Standard';
  END IF;
END $$;

-- Add typical_duration_weeks to programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'typical_duration_weeks'
  ) THEN
    ALTER TABLE programs ADD COLUMN typical_duration_weeks int DEFAULT 9;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_fill_rate ON sessions(fill_rate_percent) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_urgency ON sessions(urgency_level) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_season ON sessions(season) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_locations_venue_type ON locations(venue_type);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city_normalized);

CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);

-- Update existing programs to extract age_min and age_max from age_range if possible
UPDATE programs 
SET age_min = lower(age_range),
    age_max = upper(age_range)
WHERE age_range IS NOT NULL AND age_min IS NULL;

-- Set typical_capacity based on age for existing programs
UPDATE programs 
SET typical_capacity = 8 
WHERE age_min IS NOT NULL AND age_min <= 3 AND typical_capacity = 12;

UPDATE programs 
SET typical_capacity = 12 
WHERE age_min IS NOT NULL AND age_min > 3 AND typical_capacity IS NULL;