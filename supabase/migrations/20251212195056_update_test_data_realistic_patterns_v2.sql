/*
  # Update Test Data with Realistic Patterns

  Based on Soccer Shots Orange County real-world data analysis:
  
  1. Update Existing Data
    - Add seasons to sessions (winter, spring, summer, fall)
    - Add regions to locations (Central, South, North, West)
    - Add venue_types to locations
    - Add city data to locations
    - Update programs with age_min, age_max, typical_capacity, pricing_tier
    - Update session capacities based on program level (Mini=8, Classic/Premier=12)
  
  2. Realistic Fill Rates
    - Average 65%, 15% at capacity
    - Based on real Soccer Shots data
    
  3. Add Sample Merchandise
    - Jerseys (free and paid)
    - Apparel items
    - Equipment
    - Parent gear
*/

-- Update locations with regions and venue types
UPDATE locations 
SET 
  region = CASE 
    WHEN name ILIKE '%Irvine%' OR name ILIKE '%Tustin%' THEN 'Central'
    WHEN name ILIKE '%San Clemente%' OR name ILIKE '%Rancho%' THEN 'South'
    WHEN name ILIKE '%Fullerton%' OR name ILIKE '%Yorba Linda%' THEN 'North'
    WHEN name ILIKE '%Newport%' OR name ILIKE '%Huntington%' THEN 'West'
    ELSE 'Central'
  END,
  venue_type = CASE 
    WHEN name ILIKE '%Park%' THEN 'Public Park'
    WHEN name ILIKE '%School%' THEN 'School'
    WHEN name ILIKE '%Church%' OR name ILIKE '%Lutheran%' THEN 'Church'
    ELSE 'Public Park'
  END,
  city = CASE 
    WHEN name ILIKE '%Irvine%' THEN 'Irvine'
    WHEN name ILIKE '%Tustin%' THEN 'Tustin'
    WHEN name ILIKE '%San Clemente%' THEN 'San Clemente'
    WHEN name ILIKE '%Rancho%' THEN 'Rancho Santa Margarita'
    WHEN name ILIKE '%Fullerton%' THEN 'Fullerton'
    WHEN name ILIKE '%Yorba Linda%' THEN 'Yorba Linda'
    WHEN name ILIKE '%Newport%' THEN 'Newport Beach'
    WHEN name ILIKE '%Huntington%' THEN 'Huntington Beach'
    WHEN name ILIKE '%Orange%' THEN 'Orange'
    ELSE 'Irvine'
  END
WHERE region IS NULL;

-- Add sample coordinates for locations (Orange County area)
UPDATE locations 
SET 
  latitude = CASE 
    WHEN city = 'Irvine' THEN 33.6846 + (random() * 0.1 - 0.05)
    WHEN city = 'Tustin' THEN 33.7459 + (random() * 0.1 - 0.05)
    WHEN city = 'San Clemente' THEN 33.4270 + (random() * 0.1 - 0.05)
    WHEN city = 'Rancho Santa Margarita' THEN 33.6408 + (random() * 0.1 - 0.05)
    WHEN city = 'Fullerton' THEN 33.8704 + (random() * 0.1 - 0.05)
    WHEN city = 'Yorba Linda' THEN 33.8886 + (random() * 0.1 - 0.05)
    WHEN city = 'Newport Beach' THEN 33.6189 + (random() * 0.1 - 0.05)
    WHEN city = 'Huntington Beach' THEN 33.6603 + (random() * 0.1 - 0.05)
    ELSE 33.6846 + (random() * 0.1 - 0.05)
  END,
  longitude = CASE 
    WHEN city = 'Irvine' THEN -117.8265 + (random() * 0.1 - 0.05)
    WHEN city = 'Tustin' THEN -117.8231 + (random() * 0.1 - 0.05)
    WHEN city = 'San Clemente' THEN -117.6120 + (random() * 0.1 - 0.05)
    WHEN city = 'Rancho Santa Margarita' THEN -117.6031 + (random() * 0.1 - 0.05)
    WHEN city = 'Fullerton' THEN -117.9242 + (random() * 0.1 - 0.05)
    WHEN city = 'Yorba Linda' THEN -117.8131 + (random() * 0.1 - 0.05)
    WHEN city = 'Newport Beach' THEN -117.9289 + (random() * 0.1 - 0.05)
    WHEN city = 'Huntington Beach' THEN -117.9992 + (random() * 0.1 - 0.05)
    ELSE -117.8265 + (random() * 0.1 - 0.05)
  END
WHERE latitude IS NULL;

-- Update programs with detailed age ranges and capacities
UPDATE programs 
SET 
  age_min = CASE 
    WHEN name ILIKE '%Mini%' THEN 2
    WHEN name ILIKE '%Classic%' THEN 4
    WHEN name ILIKE '%Premier%' THEN 8
    ELSE 4
  END,
  age_max = CASE 
    WHEN name ILIKE '%Mini%' THEN 3
    WHEN name ILIKE '%Classic%' THEN 7
    WHEN name ILIKE '%Premier%' THEN 12
    ELSE 7
  END,
  typical_capacity = CASE 
    WHEN name ILIKE '%Mini%' THEN 8
    ELSE 12
  END,
  typical_duration_weeks = 9,
  pricing_tier = CASE 
    WHEN price_cents < 20000 THEN 'Budget'
    WHEN price_cents > 27500 THEN 'Premium'
    ELSE 'Standard'
  END
WHERE age_min IS NULL;

-- Update prices to be in the $200-300 range if too low
UPDATE programs 
SET price_cents = CASE 
  WHEN name ILIKE '%Mini%' THEN 22000 + (random() * 8000)::int
  WHEN name ILIKE '%Premier%' THEN 21000 + (random() * 8000)::int
  ELSE 20000 + (random() * 8000)::int
END
WHERE price_cents < 18000;

-- Assign seasons to existing sessions (using lowercase to match enum)
UPDATE sessions 
SET season = (CASE 
  WHEN EXTRACT(MONTH FROM start_date) IN (1, 2, 3) THEN 'winter'
  WHEN EXTRACT(MONTH FROM start_date) IN (4, 5, 6) THEN 'spring'
  WHEN EXTRACT(MONTH FROM start_date) IN (7, 8, 9) THEN 'summer'
  ELSE 'fall'
END)::program_season
WHERE season IS NULL;

-- Update session capacities based on program type
UPDATE sessions s
SET capacity = CASE 
  WHEN p.name ILIKE '%Mini%' THEN 8
  ELSE 12
END
FROM programs p
WHERE s.program_id = p.id AND s.capacity NOT IN (8, 12);

-- Update enrolled counts to create realistic fill rates
-- Target: 65% average, with 15% at capacity
UPDATE sessions 
SET enrolled_count = CASE 
  WHEN random() < 0.15 THEN capacity -- 15% at capacity
  WHEN random() < 0.35 THEN FLOOR(capacity * (0.75 + random() * 0.25))::int -- 20% filling fast (75-100%)
  WHEN random() < 0.65 THEN FLOOR(capacity * (0.5 + random() * 0.25))::int -- 30% moderate (50-75%)
  ELSE FLOOR(capacity * random() * 0.5)::int -- 35% available (<50%)
END
WHERE enrolled_count = 0 OR enrolled_count IS NULL;

-- Add sample merchandise items (using existing organization)
DO $$
DECLARE
  org_id UUID;
BEGIN
  -- Get the first organization ID
  SELECT id INTO org_id FROM organizations LIMIT 1;
  
  IF org_id IS NOT NULL THEN
    -- Add jerseys (free and paid options)
    INSERT INTO merchandise (organization_id, name, description, category, price_cents, is_free_with_registration, is_upsell, available_at_registration, inventory_count, is_active)
    VALUES 
      (org_id, 'Free Program Jersey', 'Standard short-sleeve jersey included with registration', 'Jersey', 0, true, false, true, 9999, true),
      (org_id, 'Long Sleeve Jersey Upgrade', 'Premium long-sleeve jersey with moisture-wicking fabric', 'Jersey', 2499, false, true, true, 500, true),
      (org_id, 'Youth Joggers', 'Comfortable athletic joggers for practice', 'Apparel', 3499, false, true, true, 300, true),
      (org_id, 'Crew Socks (3-Pack)', 'Performance soccer socks in team colors', 'Apparel', 1399, false, true, true, 800, true),
      (org_id, 'Parent Tank Top', 'Stylish parent support tank', 'Parent Gear', 2299, false, true, true, 200, true),
      (org_id, 'Training Cone Set', 'Set of 10 practice cones for home training', 'Equipment', 1999, false, true, true, 150, true),
      (org_id, 'Mini Soccer Goal', 'Pop-up goal for backyard practice', 'Equipment', 8599, false, true, true, 50, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;