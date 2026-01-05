/*
  # NBC Sports Engine Data Pattern Updates
  
  Based on analysis of 661 registrations from Soccer Shots OC:
  
  1. Location Updates
    - Add `location_type` column to distinguish preschool vs community (74.8% vs 25.2% revenue split)
    - Add preschool partner locations (Montessori schools, private preschools)
    - Add realistic OC addresses (Irvine = 19.4% of registrations)
  
  2. Pricing Updates
    - Update program pricing to $200-250 sweet spot range
    - Average price in NBC data: $206
  
  3. Children Updates
    - Add `shirt_size` column with age-based defaults
    - XXS (2T-3T) for age < 4
    - XS (4T-5T) for age 4-5
    - S (Youth 6-8) for age 6-8
  
  4. Security
    - Existing RLS policies apply to new columns
*/

-- Add location_type to locations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'location_type'
  ) THEN
    ALTER TABLE locations ADD COLUMN location_type TEXT DEFAULT 'community';
  END IF;
END $$;

-- Add shirt_size to children table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'shirt_size'
  ) THEN
    ALTER TABLE children ADD COLUMN shirt_size TEXT;
  END IF;
END $$;

-- Update existing locations to preschool type where applicable
UPDATE locations 
SET location_type = 'preschool'
WHERE name ILIKE '%montessori%' 
   OR name ILIKE '%preschool%' 
   OR name ILIKE '%school%'
   OR name ILIKE '%academy%';

-- Add preschool partner locations (from NBC top venues)
-- Using the correct organization ID: 00000000-0000-0000-0000-000000000001
INSERT INTO locations (organization_id, name, address, location_type)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  loc.name,
  loc.address,
  'preschool'
FROM (VALUES
  ('Milestones Montessori Irvine', '100 Education Way, Irvine, CA 92618'),
  ('Piper Preschool', '200 Learning Lane, Tustin, CA 92780'),
  ('Bella Montessori', '300 Child Care Blvd, Lake Forest, CA 92630'),
  ('LiMai Montessori Buena Park', '400 Early Ed Dr, Buena Park, CA 90620'),
  ('Montessori Academy Ranch', '500 Ranch Rd, Rancho Mission Viejo, CA 92694'),
  ('Dongshin Christian Preschool', '600 Faith Ave, Irvine, CA 92604')
) AS loc(name, address)
WHERE NOT EXISTS (
  SELECT 1 FROM locations WHERE name = loc.name
);

-- Update program pricing to NBC sweet spot ($200-250 range)
UPDATE programs SET price_cents = 20800 WHERE name = 'Mini Soccer';      -- $208
UPDATE programs SET price_cents = 22400 WHERE name = 'Junior Soccer';    -- $224
UPDATE programs SET price_cents = 24000 WHERE name = 'Premier Soccer';   -- $240
UPDATE programs SET price_cents = 19900 WHERE name = 'Swim Lessons';     -- $199
UPDATE programs SET price_cents = 21500 WHERE name = 'Dance Academy';    -- $215
UPDATE programs SET price_cents = 23500 WHERE name = 'Martial Arts';     -- $235
UPDATE programs SET price_cents = 18900 WHERE name = 'Basketball Basics';-- $189
UPDATE programs SET price_cents = 14900 WHERE name = 'Toddler Play';     -- $149

-- Update shirt sizes based on age
UPDATE children 
SET shirt_size = CASE 
  WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 4 THEN 'XXS (2T-3T)'
  WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 4 AND 5 THEN 'XS (4T-5T)'
  WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 6 AND 8 THEN 'S (Youth 6-8)'
  WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 9 AND 11 THEN 'M (Youth 10-12)'
  ELSE 'L (Youth 14)'
END
WHERE shirt_size IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN locations.location_type IS 'Type of location: preschool (74.8% of revenue) or community (25.2%)';
COMMENT ON COLUMN children.shirt_size IS 'Jersey/shirt size, auto-suggested based on age per NBC data patterns';
