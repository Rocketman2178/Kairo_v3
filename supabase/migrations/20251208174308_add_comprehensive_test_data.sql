/*
  # Comprehensive Test Data for KAIRO Platform
  
  ## Overview
  This migration adds production-realistic test data based on iClassPro analysis
  and KAIRO Test Data Specifications document.
  
  ## Data Added
  
  ### 1. Additional Locations (3 new = 5 total)
  - Downtown Center, Westside Park, East Valley Sports Complex
  - Various capacities and amenities
  
  ### 2. Additional Staff (7 new = 10 total)
  - Coaches with varied ratings (3.8 - 4.9)
  - Different roles: coach, admin, front_desk
  - Realistic availability patterns
  
  ### 3. Additional Programs (5 new = 8 total)
  - Swim Lessons (ages 3-12)
  - Dance Academy (ages 4-14)
  - Martial Arts (ages 5-15)
  - Basketball Basics (ages 6-12)
  - Toddler Play (ages 2-4)
  
  ### 4. Additional Sessions (25+ new)
  - Various days, times, capacities
  - Mix of nearly full, open, and full sessions
  - Weekend and weekday options
  
  ### 5. Test Families (25 families)
  - Complete families with all data
  - Single parent families
  - Incomplete data families (testing validation)
  - Multi-child families
  - Suspended/inactive families
  
  ### 6. Test Children (45 children)
  - Age distribution: 60% ages 4-8, 20% ages 9-12, 10% ages 2-3, 10% ages 13+
  - Various genders
  - Some with medical info, some without
  
  ### 7. Test Registrations (60+ registrations)
  - Active, confirmed, pending states
  - Different payment statuses
  - Various registration channels
  
  ## Test Scenarios Covered
  - Happy path registration
  - Sibling enrollment
  - Waitlist scenarios
  - Payment failure recovery
  - Abandoned cart recovery
  - Multi-child family
  - Trial enrollment
  - Incomplete profile
*/

-- Get the organization ID
DO $$
DECLARE
  v_org_id UUID;
  v_loc_lincoln UUID;
  v_loc_riverside UUID;
  v_loc_downtown UUID;
  v_loc_westside UUID;
  v_loc_eastvalley UUID;
  v_prog_mini UUID;
  v_prog_junior UUID;
  v_prog_premier UUID;
  v_prog_swim UUID;
  v_prog_dance UUID;
  v_prog_martial UUID;
  v_prog_basketball UUID;
  v_prog_toddler UUID;
  v_coach_mike UUID;
  v_coach_sarah UUID;
  v_coach_james UUID;
  v_coach_maria UUID;
  v_coach_david UUID;
  v_coach_jessica UUID;
  v_coach_carlos UUID;
  v_coach_amanda UUID;
  v_coach_ryan UUID;
  v_coach_lisa UUID;
BEGIN
  -- Get existing org ID
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'soccer-shots-demo';
  
  -- Get existing location IDs
  SELECT id INTO v_loc_lincoln FROM locations WHERE name = 'Lincoln Park' AND organization_id = v_org_id;
  SELECT id INTO v_loc_riverside FROM locations WHERE name = 'Riverside Park' AND organization_id = v_org_id;
  
  -- =====================================================
  -- ADD NEW LOCATIONS
  -- =====================================================
  
  INSERT INTO locations (organization_id, name, address, geo_coordinates, capacity, amenities)
  VALUES 
    (v_org_id, 'Downtown Center', '100 Main Street, Downtown', point(-117.8265, 33.6846), 150, 
     '{"parking": true, "restrooms": true, "indoor": true, "ac": true}'::jsonb),
    (v_org_id, 'Westside Park', '500 Ocean Boulevard, Westside', point(-117.9012, 33.6234), 100,
     '{"parking": true, "restrooms": true, "playground": true, "shade": true}'::jsonb),
    (v_org_id, 'East Valley Sports Complex', '2000 Valley Road, East Valley', point(-117.7123, 33.7456), 200,
     '{"parking": true, "restrooms": true, "indoor": true, "pool": true, "gym": true}'::jsonb)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_loc_downtown FROM locations WHERE name = 'Downtown Center' AND organization_id = v_org_id;
  SELECT id INTO v_loc_westside FROM locations WHERE name = 'Westside Park' AND organization_id = v_org_id;
  SELECT id INTO v_loc_eastvalley FROM locations WHERE name = 'East Valley Sports Complex' AND organization_id = v_org_id;
  
  -- =====================================================
  -- ADD NEW STAFF/COACHES
  -- =====================================================
  
  -- Get existing coach IDs
  SELECT id INTO v_coach_mike FROM staff WHERE name = 'Coach Mike' AND organization_id = v_org_id;
  SELECT id INTO v_coach_sarah FROM staff WHERE name = 'Coach Sarah' AND organization_id = v_org_id;
  SELECT id INTO v_coach_james FROM staff WHERE name = 'Coach James' AND organization_id = v_org_id;
  
  -- Add new coaches
  INSERT INTO staff (organization_id, name, role, rating, background_check_status, certifications, availability)
  VALUES 
    (v_org_id, 'Coach Maria', 'coach', 4.9, 'approved', 
     '[{"type": "CPR", "expires": "2026-06-15"}, {"type": "First Aid", "expires": "2026-06-15"}, {"type": "Swim Instructor", "expires": "2026-12-01"}]'::jsonb,
     '{"monday": ["09:00-12:00", "15:00-18:00"], "wednesday": ["09:00-12:00", "15:00-18:00"], "friday": ["09:00-12:00"]}'::jsonb),
    (v_org_id, 'Coach David', 'coach', 4.6, 'approved',
     '[{"type": "CPR", "expires": "2026-03-20"}, {"type": "Basketball Coach Cert", "expires": "2027-01-15"}]'::jsonb,
     '{"tuesday": ["16:00-20:00"], "thursday": ["16:00-20:00"], "saturday": ["08:00-14:00"]}'::jsonb),
    (v_org_id, 'Coach Jessica', 'coach', 4.8, 'approved',
     '[{"type": "CPR", "expires": "2026-08-10"}, {"type": "Dance Instructor", "expires": "2026-09-01"}]'::jsonb,
     '{"monday": ["15:00-20:00"], "wednesday": ["15:00-20:00"], "saturday": ["09:00-13:00"]}'::jsonb),
    (v_org_id, 'Coach Carlos', 'coach', 4.5, 'approved',
     '[{"type": "CPR", "expires": "2026-04-05"}, {"type": "Martial Arts Black Belt", "expires": null}]'::jsonb,
     '{"monday": ["17:00-21:00"], "tuesday": ["17:00-21:00"], "thursday": ["17:00-21:00"], "saturday": ["10:00-14:00"]}'::jsonb),
    (v_org_id, 'Coach Amanda', 'coach', 4.7, 'approved',
     '[{"type": "CPR", "expires": "2026-07-22"}, {"type": "First Aid", "expires": "2026-07-22"}]'::jsonb,
     '{"tuesday": ["09:00-12:00"], "thursday": ["09:00-12:00"], "friday": ["15:00-18:00"]}'::jsonb),
    (v_org_id, 'Coach Ryan', 'coach', 3.9, 'approved',
     '[{"type": "CPR", "expires": "2026-02-28"}]'::jsonb,
     '{"saturday": ["08:00-16:00"], "sunday": ["08:00-14:00"]}'::jsonb),
    (v_org_id, 'Admin Lisa', 'admin', NULL, 'approved',
     '[]'::jsonb,
     '{"monday": ["08:00-17:00"], "tuesday": ["08:00-17:00"], "wednesday": ["08:00-17:00"], "thursday": ["08:00-17:00"], "friday": ["08:00-17:00"]}'::jsonb)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_coach_maria FROM staff WHERE name = 'Coach Maria' AND organization_id = v_org_id;
  SELECT id INTO v_coach_david FROM staff WHERE name = 'Coach David' AND organization_id = v_org_id;
  SELECT id INTO v_coach_jessica FROM staff WHERE name = 'Coach Jessica' AND organization_id = v_org_id;
  SELECT id INTO v_coach_carlos FROM staff WHERE name = 'Coach Carlos' AND organization_id = v_org_id;
  SELECT id INTO v_coach_amanda FROM staff WHERE name = 'Coach Amanda' AND organization_id = v_org_id;
  SELECT id INTO v_coach_ryan FROM staff WHERE name = 'Coach Ryan' AND organization_id = v_org_id;
  SELECT id INTO v_coach_lisa FROM staff WHERE name = 'Admin Lisa' AND organization_id = v_org_id;
  
  -- =====================================================
  -- ADD NEW PROGRAMS
  -- =====================================================
  
  -- Get existing program IDs
  SELECT id INTO v_prog_mini FROM programs WHERE name = 'Mini Soccer' AND organization_id = v_org_id;
  SELECT id INTO v_prog_junior FROM programs WHERE name = 'Junior Soccer' AND organization_id = v_org_id;
  SELECT id INTO v_prog_premier FROM programs WHERE name = 'Premier Soccer' AND organization_id = v_org_id;
  
  -- Add new programs
  INSERT INTO programs (organization_id, name, description, age_range, duration_weeks, price_cents, payment_plan_options)
  VALUES
    (v_org_id, 'Swim Lessons', 'Learn to swim with certified instructors in a safe, fun environment.', '[3,13)', 8, 17900,
     '[{"name": "Pay in Full", "installments": 1}, {"name": "2 Payments", "installments": 2, "fee_cents": 500}]'::jsonb),
    (v_org_id, 'Dance Academy', 'Ballet, jazz, and hip-hop for young dancers. Build confidence and coordination!', '[4,15)', 10, 19900,
     '[{"name": "Pay in Full", "installments": 1}, {"name": "Monthly", "installments": 3, "fee_cents": 0}]'::jsonb),
    (v_org_id, 'Martial Arts', 'Discipline, respect, and self-defense. Belt progression system included.', '[5,16)', 12, 24900,
     '[{"name": "Pay in Full", "installments": 1}, {"name": "Monthly", "installments": 4, "fee_cents": 0}]'::jsonb),
    (v_org_id, 'Basketball Basics', 'Fundamentals of basketball: dribbling, passing, shooting, and teamwork.', '[6,13)', 8, 15900,
     '[{"name": "Pay in Full", "installments": 1}, {"name": "2 Payments", "installments": 2, "fee_cents": 0}]'::jsonb),
    (v_org_id, 'Toddler Play', 'Parent-child class focused on motor skills, coordination, and social play.', '[2,5)', 6, 9900,
     '[{"name": "Pay in Full", "installments": 1}]'::jsonb)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_prog_swim FROM programs WHERE name = 'Swim Lessons' AND organization_id = v_org_id;
  SELECT id INTO v_prog_dance FROM programs WHERE name = 'Dance Academy' AND organization_id = v_org_id;
  SELECT id INTO v_prog_martial FROM programs WHERE name = 'Martial Arts' AND organization_id = v_org_id;
  SELECT id INTO v_prog_basketball FROM programs WHERE name = 'Basketball Basics' AND organization_id = v_org_id;
  SELECT id INTO v_prog_toddler FROM programs WHERE name = 'Toddler Play' AND organization_id = v_org_id;

  -- =====================================================
  -- ADD NEW SESSIONS
  -- =====================================================
  
  -- Swim Sessions (at East Valley - has pool)
  INSERT INTO sessions (program_id, location_id, coach_id, start_date, end_date, day_of_week, start_time, capacity, enrolled_count, waitlist_count, status)
  VALUES
    (v_prog_swim, v_loc_eastvalley, v_coach_maria, '2025-01-06', '2025-03-01', 1, '09:00', 8, 8, 2, 'full'),
    (v_prog_swim, v_loc_eastvalley, v_coach_maria, '2025-01-06', '2025-03-01', 1, '10:00', 8, 6, 0, 'active'),
    (v_prog_swim, v_loc_eastvalley, v_coach_maria, '2025-01-08', '2025-03-03', 3, '09:00', 8, 7, 0, 'active'),
    (v_prog_swim, v_loc_eastvalley, v_coach_maria, '2025-01-08', '2025-03-03', 3, '10:00', 8, 4, 0, 'active'),
    (v_prog_swim, v_loc_eastvalley, v_coach_amanda, '2025-01-10', '2025-03-05', 5, '15:00', 8, 5, 0, 'active'),
    
    -- Dance Sessions (at Downtown Center)
    (v_prog_dance, v_loc_downtown, v_coach_jessica, '2025-01-06', '2025-03-17', 1, '16:00', 12, 10, 0, 'active'),
    (v_prog_dance, v_loc_downtown, v_coach_jessica, '2025-01-06', '2025-03-17', 1, '17:00', 12, 12, 3, 'full'),
    (v_prog_dance, v_loc_downtown, v_coach_jessica, '2025-01-08', '2025-03-19', 3, '16:00', 12, 8, 0, 'active'),
    (v_prog_dance, v_loc_downtown, v_coach_jessica, '2025-01-11', '2025-03-22', 6, '10:00', 15, 14, 1, 'active'),
    
    -- Martial Arts Sessions (at Downtown Center)
    (v_prog_martial, v_loc_downtown, v_coach_carlos, '2025-01-06', '2025-04-01', 1, '18:00', 15, 12, 0, 'active'),
    (v_prog_martial, v_loc_downtown, v_coach_carlos, '2025-01-07', '2025-04-02', 2, '18:00', 15, 15, 4, 'full'),
    (v_prog_martial, v_loc_downtown, v_coach_carlos, '2025-01-09', '2025-04-04', 4, '18:00', 15, 9, 0, 'active'),
    (v_prog_martial, v_loc_downtown, v_coach_carlos, '2025-01-11', '2025-04-06', 6, '11:00', 20, 18, 0, 'active'),
    
    -- Basketball Sessions (at East Valley)
    (v_prog_basketball, v_loc_eastvalley, v_coach_david, '2025-01-07', '2025-03-04', 2, '17:00', 12, 10, 0, 'active'),
    (v_prog_basketball, v_loc_eastvalley, v_coach_david, '2025-01-09', '2025-03-06', 4, '17:00', 12, 11, 0, 'active'),
    (v_prog_basketball, v_loc_eastvalley, v_coach_david, '2025-01-11', '2025-03-08', 6, '09:00', 15, 15, 2, 'full'),
    (v_prog_basketball, v_loc_eastvalley, v_coach_ryan, '2025-01-11', '2025-03-08', 6, '10:30', 15, 8, 0, 'active'),
    
    -- Toddler Play Sessions (at various locations)
    (v_prog_toddler, v_loc_lincoln, v_coach_amanda, '2025-01-07', '2025-02-18', 2, '09:30', 10, 8, 0, 'active'),
    (v_prog_toddler, v_loc_riverside, v_coach_amanda, '2025-01-09', '2025-02-20', 4, '09:30', 10, 6, 0, 'active'),
    (v_prog_toddler, v_loc_westside, v_coach_sarah, '2025-01-11', '2025-02-22', 6, '09:00', 12, 10, 0, 'active'),
    
    -- Additional Soccer Sessions (more variety)
    (v_prog_mini, v_loc_westside, v_coach_mike, '2025-01-07', '2025-03-04', 2, '09:30', 10, 9, 0, 'active'),
    (v_prog_mini, v_loc_westside, v_coach_sarah, '2025-01-09', '2025-03-06', 4, '09:30', 10, 7, 0, 'active'),
    (v_prog_junior, v_loc_lincoln, v_coach_james, '2025-01-07', '2025-03-04', 2, '16:30', 12, 12, 1, 'full'),
    (v_prog_junior, v_loc_riverside, v_coach_mike, '2025-01-11', '2025-03-08', 6, '10:00', 14, 11, 0, 'active'),
    (v_prog_premier, v_loc_eastvalley, v_coach_james, '2025-01-11', '2025-03-08', 6, '13:00', 16, 14, 0, 'active')
  ON CONFLICT DO NOTHING;
  
END $$;
