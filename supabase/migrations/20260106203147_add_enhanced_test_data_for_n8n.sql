/*
  # Enhanced Test Data for N8N Workflow Testing

  1. New Test Families (5 families)
  2. New Test Children (9 children across age groups 3-14)
  3. Waitlist Entries (13 entries across 6 full sessions)
  4. Edge Case Sessions (4 evening/late afternoon sessions)
  5. Session Reviews for edge case sessions
*/

-- ============================================================================
-- SECTION 1: Test Families
-- ============================================================================

INSERT INTO families (id, primary_contact_name, email, phone, is_returning, created_at)
VALUES 
  ('a1111111-1111-1111-1111-111111111101', 
   'Jennifer Martinez', 'jennifer.martinez@testmail.com', '555-0201', false, NOW()),
  ('a1111111-1111-1111-1111-111111111102', 
   'Michael Thompson', 'michael.thompson@testmail.com', '555-0202', true, NOW()),
  ('a1111111-1111-1111-1111-111111111103', 
   'Sarah Williams', 'sarah.williams@testmail.com', '555-0203', false, NOW()),
  ('a1111111-1111-1111-1111-111111111104', 
   'David Chen', 'david.chen@testmail.com', '555-0204', true, NOW()),
  ('a1111111-1111-1111-1111-111111111105', 
   'Amanda Johnson', 'amanda.johnson@testmail.com', '555-0205', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 2: Test Children
-- ============================================================================

INSERT INTO children (id, family_id, first_name, last_name, date_of_birth, created_at)
VALUES 
  -- Martinez Family: 2 kids
  ('b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111101',
   'Tommy', 'Martinez', '2021-03-15', NOW()),  -- Age 4 (Mini Soccer)
  ('b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111101',
   'Sophia', 'Martinez', '2018-06-20', NOW()), -- Age 7 (Classic Soccer)
  
  -- Thompson Family: 2 kids
  ('b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111102',
   'Jake', 'Thompson', '2016-09-10', NOW()),   -- Age 9 (Premier Soccer)
  ('b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111102',
   'Lily', 'Thompson', '2019-01-25', NOW()),   -- Age 6 (Junior Soccer)
  
  -- Williams Family: 1 kid
  ('b2222222-2222-2222-2222-222222222205', 'a1111111-1111-1111-1111-111111111103',
   'Emma', 'Williams', '2020-01-05', NOW()),   -- Age 6 (Junior Soccer)
  
  -- Chen Family: 2 kids
  ('b2222222-2222-2222-2222-222222222206', 'a1111111-1111-1111-1111-111111111104',
   'Ryan', 'Chen', '2014-07-12', NOW()),       -- Age 11 (Teen Soccer)
  ('b2222222-2222-2222-2222-222222222207', 'a1111111-1111-1111-1111-111111111104',
   'Mia', 'Chen', '2017-11-30', NOW()),        -- Age 8 (Classic Soccer)
  
  -- Johnson Family: 2 kids
  ('b2222222-2222-2222-2222-222222222208', 'a1111111-1111-1111-1111-111111111105',
   'Ethan', 'Johnson', '2011-04-18', NOW()),   -- Age 14 (High School Soccer)
  ('b2222222-2222-2222-2222-222222222209', 'a1111111-1111-1111-1111-111111111105',
   'Olivia', 'Johnson', '2022-08-10', NOW())   -- Age 3 (Mini Soccer)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 3: Waitlist Entries for Full Sessions
-- ============================================================================

-- Junior Soccer Sunday 10am (10000000-0000-0000-0000-000000000004)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333301', '10000000-0000-0000-0000-000000000004',
   'b2222222-2222-2222-2222-222222222204', 'a1111111-1111-1111-1111-111111111102', 1, 'active', NOW() - INTERVAL '3 days'),
  ('c3333333-3333-3333-3333-333333333302', '10000000-0000-0000-0000-000000000004',
   'b2222222-2222-2222-2222-222222222205', 'a1111111-1111-1111-1111-111111111103', 2, 'active', NOW() - INTERVAL '2 days'),
  ('c3333333-3333-3333-3333-333333333303', '10000000-0000-0000-0000-000000000004',
   'b2222222-2222-2222-2222-222222222207', 'a1111111-1111-1111-1111-111111111104', 3, 'active', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Mini Soccer Saturday 9:45am (6b8e03e7-4ec1-4a6d-ae47-9f9655472a55)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333304', '6b8e03e7-4ec1-4a6d-ae47-9f9655472a55',
   'b2222222-2222-2222-2222-222222222201', 'a1111111-1111-1111-1111-111111111101', 1, 'active', NOW() - INTERVAL '5 days'),
  ('c3333333-3333-3333-3333-333333333305', '6b8e03e7-4ec1-4a6d-ae47-9f9655472a55',
   'b2222222-2222-2222-2222-222222222209', 'a1111111-1111-1111-1111-111111111105', 2, 'active', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Classic Soccer Saturday 9am (8e976748-1eee-46b4-9b22-099f287d783f)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333306', '8e976748-1eee-46b4-9b22-099f287d783f',
   'b2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111101', 1, 'active', NOW() - INTERVAL '6 days'),
  ('c3333333-3333-3333-3333-333333333307', '8e976748-1eee-46b4-9b22-099f287d783f',
   'b2222222-2222-2222-2222-222222222207', 'a1111111-1111-1111-1111-111111111104', 2, 'active', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Premier Soccer Saturday 10:30am (727536d0-c219-48c6-b1c7-962f6942b7f5)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333308', '727536d0-c219-48c6-b1c7-962f6942b7f5',
   'b2222222-2222-2222-2222-222222222203', 'a1111111-1111-1111-1111-111111111102', 1, 'active', NOW() - INTERVAL '7 days'),
  ('c3333333-3333-3333-3333-333333333309', '727536d0-c219-48c6-b1c7-962f6942b7f5',
   'b2222222-2222-2222-2222-222222222206', 'a1111111-1111-1111-1111-111111111104', 2, 'active', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Teen Soccer Saturday 10am (00000000-0000-0000-0000-000000000806)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333311', '00000000-0000-0000-0000-000000000806',
   'b2222222-2222-2222-2222-222222222206', 'a1111111-1111-1111-1111-111111111104', 1, 'active', NOW() - INTERVAL '4 days'),
  ('c3333333-3333-3333-3333-333333333312', '00000000-0000-0000-0000-000000000806',
   'b2222222-2222-2222-2222-222222222208', 'a1111111-1111-1111-1111-111111111105', 2, 'active', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- High School Soccer Monday 3pm (47fe9665-f070-45ae-8233-aa637be33f6c)
INSERT INTO waitlist (id, session_id, child_id, family_id, position, status, created_at)
VALUES
  ('c3333333-3333-3333-3333-333333333313', '47fe9665-f070-45ae-8233-aa637be33f6c',
   'b2222222-2222-2222-2222-222222222208', 'a1111111-1111-1111-1111-111111111105', 1, 'active', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 4: Edge Case Sessions
-- ============================================================================

DO $$
DECLARE
  v_mini_soccer_id UUID;
  v_junior_soccer_id UUID;
  v_classic_soccer_id UUID;
  v_location_id UUID;
  v_coach_id UUID;
BEGIN
  SELECT id INTO v_mini_soccer_id FROM programs WHERE name = 'Mini Soccer' LIMIT 1;
  SELECT id INTO v_junior_soccer_id FROM programs WHERE name = 'Junior Soccer' LIMIT 1;
  SELECT id INTO v_classic_soccer_id FROM programs WHERE name = 'Classic Soccer' LIMIT 1;
  SELECT id INTO v_location_id FROM locations WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  SELECT coach_id INTO v_coach_id FROM sessions WHERE coach_id IS NOT NULL LIMIT 1;
  
  -- Edge Case 1: Friday 6:00 PM Evening Session (Mini Soccer) - 4 spots
  INSERT INTO sessions (id, program_id, location_id, coach_id, day_of_week, start_time, 
                        start_date, end_date, capacity, enrolled_count, status, season)
  VALUES (
    'd4444444-4444-4444-4444-444444444401',
    v_mini_soccer_id,
    v_location_id,
    v_coach_id,
    5,  -- Friday
    '18:00:00',  -- 6:00 PM
    '2025-01-17',
    '2025-03-07',
    8,
    4,
    'active',
    'winter'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Edge Case 2: Monday 6:30 PM Evening Session (Junior Soccer) - 1 spot left
  INSERT INTO sessions (id, program_id, location_id, coach_id, day_of_week, start_time,
                        start_date, end_date, capacity, enrolled_count, status, season)
  VALUES (
    'd4444444-4444-4444-4444-444444444402',
    v_junior_soccer_id,
    v_location_id,
    v_coach_id,
    1,  -- Monday
    '18:30:00',  -- 6:30 PM
    '2025-01-13',
    '2025-03-03',
    12,
    11,  -- Only 1 spot!
    'active',
    'winter'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Edge Case 3: Wednesday 7:00 PM Evening Session (Classic Soccer) - 1 spot left
  INSERT INTO sessions (id, program_id, location_id, coach_id, day_of_week, start_time,
                        start_date, end_date, capacity, enrolled_count, status, season)
  VALUES (
    'd4444444-4444-4444-4444-444444444403',
    v_classic_soccer_id,
    v_location_id,
    v_coach_id,
    3,  -- Wednesday
    '19:00:00',  -- 7:00 PM
    '2025-01-15',
    '2025-03-05',
    12,
    11,  -- Only 1 spot!
    'active',
    'winter'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Edge Case 4: Sunday 5:00 PM Late Afternoon Session (Mini Soccer) - 2 spots
  INSERT INTO sessions (id, program_id, location_id, coach_id, day_of_week, start_time,
                        start_date, end_date, capacity, enrolled_count, status, season)
  VALUES (
    'd4444444-4444-4444-4444-444444444404',
    v_mini_soccer_id,
    v_location_id,
    v_coach_id,
    0,  -- Sunday
    '17:00:00',  -- 5:00 PM
    '2025-01-12',
    '2025-03-02',
    8,
    6,  -- Only 2 spots
    'active',
    'winter'
  ) ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================================
-- SECTION 5: Add reviews for edge case sessions
-- ============================================================================

INSERT INTO session_reviews (id, session_id, family_id, child_id, overall_rating, coach_rating, location_rating, comment, created_at)
VALUES
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444401', 
   'a1111111-1111-1111-1111-111111111101', 'b2222222-2222-2222-2222-222222222201',
   4.7, 4.8, 4.5, 'Evening sessions are perfect for working parents!', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444401', 
   'a1111111-1111-1111-1111-111111111102', 'b2222222-2222-2222-2222-222222222204',
   4.9, 5.0, 4.8, 'Great time slot - kids love it after a full day.', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444402', 
   'a1111111-1111-1111-1111-111111111103', 'b2222222-2222-2222-2222-222222222205',
   4.8, 4.9, 4.7, 'Coach is amazing and the evening timing works great.', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444402', 
   'a1111111-1111-1111-1111-111111111104', 'b2222222-2222-2222-2222-222222222207',
   4.6, 4.5, 4.6, 'Perfect for our schedule. Highly recommend!', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444403', 
   'a1111111-1111-1111-1111-111111111105', 'b2222222-2222-2222-2222-222222222208',
   4.5, 4.6, 4.4, 'Wednesday evenings work great for us.', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444404', 
   'a1111111-1111-1111-1111-111111111101', 'b2222222-2222-2222-2222-222222222201',
   4.8, 4.9, 4.7, 'Sunday afternoon is ideal - not too early!', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;
