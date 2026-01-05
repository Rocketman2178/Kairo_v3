/*
  # Test Registrations and Waitlist Entries
  
  ## Overview
  Adds realistic registration data connecting children to sessions.
  
  ## Registration Mix
  - Confirmed/Active: 40+ registrations
  - Pending: 8 registrations
  - Waitlist entries: 8 entries
  - Various payment statuses and channels
*/

-- =====================================================
-- REGISTRATIONS
-- =====================================================

DO $$
DECLARE
  v_session_swim_mon_9 UUID;
  v_session_swim_mon_10 UUID;
  v_session_swim_wed_9 UUID;
  v_session_swim_wed_10 UUID;
  v_session_swim_fri UUID;
  v_session_dance_mon_4 UUID;
  v_session_dance_mon_5 UUID;
  v_session_dance_wed UUID;
  v_session_dance_sat UUID;
  v_session_martial_mon UUID;
  v_session_martial_tue UUID;
  v_session_martial_thu UUID;
  v_session_martial_sat UUID;
  v_session_basketball_tue UUID;
  v_session_basketball_thu UUID;
  v_session_basketball_sat_9 UUID;
  v_session_basketball_sat_10 UUID;
  v_session_toddler_tue UUID;
  v_session_toddler_thu UUID;
  v_session_toddler_sat UUID;
  v_session_mini_tue UUID;
  v_session_mini_thu UUID;
  v_session_junior_tue UUID;
  v_session_junior_sat UUID;
  v_session_premier_sat UUID;
BEGIN
  -- Get swim sessions (using s.id to avoid ambiguity)
  SELECT s.id INTO v_session_swim_mon_9 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Swim Lessons' AND s.day_of_week = 1 AND s.start_time = '09:00:00' LIMIT 1;
  SELECT s.id INTO v_session_swim_mon_10 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Swim Lessons' AND s.day_of_week = 1 AND s.start_time = '10:00:00' LIMIT 1;
  SELECT s.id INTO v_session_swim_wed_9 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Swim Lessons' AND s.day_of_week = 3 AND s.start_time = '09:00:00' LIMIT 1;
  SELECT s.id INTO v_session_swim_wed_10 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Swim Lessons' AND s.day_of_week = 3 AND s.start_time = '10:00:00' LIMIT 1;
  SELECT s.id INTO v_session_swim_fri FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Swim Lessons' AND s.day_of_week = 5 LIMIT 1;
    
  -- Get dance sessions
  SELECT s.id INTO v_session_dance_mon_4 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Dance Academy' AND s.day_of_week = 1 AND s.start_time = '16:00:00' LIMIT 1;
  SELECT s.id INTO v_session_dance_mon_5 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Dance Academy' AND s.day_of_week = 1 AND s.start_time = '17:00:00' LIMIT 1;
  SELECT s.id INTO v_session_dance_wed FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Dance Academy' AND s.day_of_week = 3 LIMIT 1;
  SELECT s.id INTO v_session_dance_sat FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Dance Academy' AND s.day_of_week = 6 LIMIT 1;
    
  -- Get martial arts sessions
  SELECT s.id INTO v_session_martial_mon FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Martial Arts' AND s.day_of_week = 1 LIMIT 1;
  SELECT s.id INTO v_session_martial_tue FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Martial Arts' AND s.day_of_week = 2 LIMIT 1;
  SELECT s.id INTO v_session_martial_thu FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Martial Arts' AND s.day_of_week = 4 LIMIT 1;
  SELECT s.id INTO v_session_martial_sat FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Martial Arts' AND s.day_of_week = 6 LIMIT 1;
    
  -- Get basketball sessions
  SELECT s.id INTO v_session_basketball_tue FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Basketball Basics' AND s.day_of_week = 2 LIMIT 1;
  SELECT s.id INTO v_session_basketball_thu FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Basketball Basics' AND s.day_of_week = 4 LIMIT 1;
  SELECT s.id INTO v_session_basketball_sat_9 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Basketball Basics' AND s.day_of_week = 6 AND s.start_time = '09:00:00' LIMIT 1;
  SELECT s.id INTO v_session_basketball_sat_10 FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Basketball Basics' AND s.day_of_week = 6 AND s.start_time = '10:30:00' LIMIT 1;
    
  -- Get toddler sessions
  SELECT s.id INTO v_session_toddler_tue FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Toddler Play' AND s.day_of_week = 2 LIMIT 1;
  SELECT s.id INTO v_session_toddler_thu FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Toddler Play' AND s.day_of_week = 4 LIMIT 1;
  SELECT s.id INTO v_session_toddler_sat FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Toddler Play' AND s.day_of_week = 6 LIMIT 1;
    
  -- Get soccer sessions
  SELECT s.id INTO v_session_mini_tue FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Mini Soccer' AND s.day_of_week = 2 LIMIT 1;
  SELECT s.id INTO v_session_mini_thu FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Mini Soccer' AND s.day_of_week = 4 LIMIT 1;
  SELECT s.id INTO v_session_junior_tue FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Junior Soccer' AND s.day_of_week = 2 LIMIT 1;
  SELECT s.id INTO v_session_junior_sat FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Junior Soccer' AND s.day_of_week = 6 LIMIT 1;
  SELECT s.id INTO v_session_premier_sat FROM sessions s 
    JOIN programs p ON s.program_id = p.id 
    WHERE p.name = 'Premier Soccer' AND s.day_of_week = 6 LIMIT 1;

  -- =====================================================
  -- INSERT REGISTRATIONS
  -- =====================================================
  
  -- Roberts Family (Connor age 4, Emma age 7, Baby age 2)
  IF v_session_mini_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_mini_tue, 'c0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'confirmed', 'paid', 'card', 12900, '2024-12-01 10:30:00', 'web');
  END IF;
  
  IF v_session_junior_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_junior_sat, 'c0000002-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000001', 'confirmed', 'paid', 'card', 14900, '2024-12-01 10:35:00', 'web');
  END IF;
  
  IF v_session_toddler_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_toddler_tue, 'c0000042-0000-0000-0000-000000000042', 'f0000001-0000-0000-0000-000000000001', 'confirmed', 'paid', 'card', 9900, '2024-12-01 10:40:00', 'web');
  END IF;
    
  -- Martinez Family (Sofia 5, Diego 7, Isabella 9, Lucas 12) - Multi-child high value
  IF v_session_swim_wed_9 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_wed_9, 'c0000003-0000-0000-0000-000000000003', 'f0000002-0000-0000-0000-000000000002', 'confirmed', 'paid', 'card', 17900, '2024-11-15 09:00:00', 'voice'),
      (v_session_swim_wed_9, 'c0000004-0000-0000-0000-000000000004', 'f0000002-0000-0000-0000-000000000002', 'confirmed', 'paid', 'card', 16110, '2024-11-15 09:05:00', 'voice');
  END IF;
  
  IF v_session_martial_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_tue, 'c0000005-0000-0000-0000-000000000005', 'f0000002-0000-0000-0000-000000000002', 'confirmed', 'paid', 'card', 24900, '2024-11-20 14:00:00', 'web'),
      (v_session_martial_tue, 'c0000006-0000-0000-0000-000000000006', 'f0000002-0000-0000-0000-000000000002', 'confirmed', 'paid', 'card', 22410, '2024-11-20 14:05:00', 'web');
  END IF;
  
  IF v_session_dance_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_sat, 'c0000003-0000-0000-0000-000000000003', 'f0000002-0000-0000-0000-000000000002', 'confirmed', 'paid', 'card', 19900, '2024-11-25 11:00:00', 'text');
  END IF;
    
  -- Chen Family (Olivia 6, Ethan 8)
  IF v_session_swim_mon_10 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_mon_10, 'c0000007-0000-0000-0000-000000000007', 'f0000003-0000-0000-0000-000000000003', 'confirmed', 'paid', 'card', 17900, '2024-12-02 16:00:00', 'web');
  END IF;
  
  IF v_session_basketball_thu IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_basketball_thu, 'c0000008-0000-0000-0000-000000000008', 'f0000003-0000-0000-0000-000000000003', 'confirmed', 'paid', 'card', 15900, '2024-12-02 16:10:00', 'web');
  END IF;
    
  -- Johnson Family (Tyler 5) - Single parent
  IF v_session_mini_thu IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_mini_thu, 'c0000009-0000-0000-0000-000000000009', 'f0000004-0000-0000-0000-000000000004', 'confirmed', 'paid', 'card', 12900, '2024-12-03 20:00:00', 'text');
  END IF;
    
  -- Wilson Family (Mia 6) - Single parent
  IF v_session_dance_wed IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_wed, 'c0000010-0000-0000-0000-000000000010', 'f0000005-0000-0000-0000-000000000005', 'confirmed', 'paid', 'card', 19900, '2024-12-04 18:30:00', 'voice');
  END IF;
    
  -- Thompson Family (Jacob 3, Ava 6, Liam 9)
  IF v_session_toddler_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_toddler_sat, 'c0000011-0000-0000-0000-000000000011', 'f0000006-0000-0000-0000-000000000006', 'confirmed', 'paid', 'card', 9900, '2024-11-28 09:00:00', 'web'),
      (v_session_toddler_sat, 'c0000043-0000-0000-0000-000000000043', 'f0000006-0000-0000-0000-000000000006', 'confirmed', 'paid', 'card', 8910, '2024-11-28 09:05:00', 'web');
  END IF;
  
  IF v_session_dance_mon_4 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_mon_4, 'c0000012-0000-0000-0000-000000000012', 'f0000006-0000-0000-0000-000000000006', 'confirmed', 'paid', 'card', 19900, '2024-11-28 09:10:00', 'web');
  END IF;
  
  IF v_session_martial_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_sat, 'c0000013-0000-0000-0000-000000000013', 'f0000006-0000-0000-0000-000000000006', 'confirmed', 'paid', 'card', 24900, '2024-11-28 09:15:00', 'web');
  END IF;
    
  -- Garcia Family - Returning
  IF v_session_junior_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_junior_sat, 'c0000014-0000-0000-0000-000000000014', 'f0000007-0000-0000-0000-000000000007', 'confirmed', 'paid', 'card', 14900, '2024-11-10 10:00:00', 'web');
  END IF;
  
  IF v_session_premier_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_premier_sat, 'c0000015-0000-0000-0000-000000000015', 'f0000007-0000-0000-0000-000000000007', 'confirmed', 'paid', 'card', 16900, '2024-11-10 10:05:00', 'web');
  END IF;
  
  IF v_session_mini_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_mini_tue, 'c0000016-0000-0000-0000-000000000016', 'f0000007-0000-0000-0000-000000000007', 'confirmed', 'paid', 'card', 12900, '2024-11-10 10:10:00', 'web');
  END IF;
  
  IF v_session_toddler_thu IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_toddler_thu, 'c0000044-0000-0000-0000-000000000044', 'f0000007-0000-0000-0000-000000000007', 'confirmed', 'paid', 'card', 9900, '2024-11-10 10:15:00', 'web');
  END IF;
    
  -- Anderson Family - Payment Issues
  IF v_session_basketball_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_basketball_tue, 'c0000019-0000-0000-0000-000000000019', 'f0000010-0000-0000-0000-000000000010', 'confirmed', 'failed', 'card', 15900, '2024-12-01 15:00:00', 'web');
  END IF;
  
  IF v_session_dance_mon_4 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_mon_4, 'c0000020-0000-0000-0000-000000000020', 'f0000010-0000-0000-0000-000000000010', 'pending', 'pending', NULL, 19900, '2024-12-05 19:00:00', 'web');
  END IF;
    
  -- Taylor Family - New, pending payment
  IF v_session_mini_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_mini_tue, 'c0000021-0000-0000-0000-000000000021', 'f0000011-0000-0000-0000-000000000011', 'pending', 'pending', NULL, 12900, NULL, 'web');
  END IF;
    
  -- Brown Family - New
  IF v_session_swim_fri IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_fri, 'c0000022-0000-0000-0000-000000000022', 'f0000012-0000-0000-0000-000000000012', 'confirmed', 'paid', 'card', 17900, '2024-12-06 14:00:00', 'voice');
  END IF;
    
  -- Williams Family - High value returning
  IF v_session_martial_mon IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_mon, 'c0000023-0000-0000-0000-000000000023', 'f0000013-0000-0000-0000-000000000013', 'confirmed', 'paid', 'card', 24900, '2024-11-05 11:00:00', 'web');
  END IF;
  
  IF v_session_swim_wed_10 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_wed_10, 'c0000024-0000-0000-0000-000000000024', 'f0000013-0000-0000-0000-000000000013', 'confirmed', 'paid', 'card', 17900, '2024-11-05 11:05:00', 'web');
  END IF;
  
  IF v_session_martial_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_sat, 'c0000045-0000-0000-0000-000000000045', 'f0000013-0000-0000-0000-000000000013', 'confirmed', 'paid', 'card', 24900, '2024-11-05 11:10:00', 'web');
  END IF;
  
  IF v_session_basketball_sat_10 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_basketball_sat_10, 'c0000023-0000-0000-0000-000000000023', 'f0000013-0000-0000-0000-000000000013', 'confirmed', 'paid', 'card', 15900, '2024-11-05 11:15:00', 'web');
  END IF;
    
  -- More families with registrations
  IF v_session_swim_mon_10 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_mon_10, 'c0000025-0000-0000-0000-000000000025', 'f0000014-0000-0000-0000-000000000014', 'confirmed', 'paid', 'card', 17900, '2024-12-01 09:00:00', 'text');
  END IF;
  
  IF v_session_toddler_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_toddler_tue, 'c0000026-0000-0000-0000-000000000026', 'f0000014-0000-0000-0000-000000000014', 'confirmed', 'paid', 'card', 9900, '2024-12-01 09:05:00', 'text');
  END IF;
  
  IF v_session_martial_thu IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_thu, 'c0000027-0000-0000-0000-000000000027', 'f0000015-0000-0000-0000-000000000015', 'confirmed', 'paid', 'card', 24900, '2024-11-25 17:00:00', 'web');
  END IF;
  
  IF v_session_dance_wed IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_wed, 'c0000028-0000-0000-0000-000000000028', 'f0000015-0000-0000-0000-000000000015', 'confirmed', 'paid', 'card', 19900, '2024-11-25 17:05:00', 'web');
  END IF;
  
  IF v_session_premier_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_premier_sat, 'c0000029-0000-0000-0000-000000000029', 'f0000016-0000-0000-0000-000000000016', 'confirmed', 'paid', 'card', 16900, '2024-11-30 19:00:00', 'web');
  END IF;
  
  IF v_session_basketball_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_basketball_tue, 'c0000030-0000-0000-0000-000000000030', 'f0000017-0000-0000-0000-000000000017', 'confirmed', 'paid', 'card', 15900, '2024-12-02 18:00:00', 'web');
  END IF;
  
  IF v_session_dance_mon_4 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_mon_4, 'c0000031-0000-0000-0000-000000000031', 'f0000017-0000-0000-0000-000000000017', 'confirmed', 'paid', 'card', 19900, '2024-12-02 18:05:00', 'web');
  END IF;
  
  IF v_session_junior_tue IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_junior_tue, 'c0000032-0000-0000-0000-000000000032', 'f0000018-0000-0000-0000-000000000018', 'confirmed', 'paid', 'card', 14900, '2024-11-22 10:00:00', 'voice');
  END IF;
  
  IF v_session_swim_wed_9 IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_wed_9, 'c0000033-0000-0000-0000-000000000033', 'f0000018-0000-0000-0000-000000000018', 'confirmed', 'paid', 'card', 17900, '2024-11-22 10:05:00', 'voice');
  END IF;
  
  IF v_session_martial_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_martial_sat, 'c0000034-0000-0000-0000-000000000034', 'f0000019-0000-0000-0000-000000000019', 'confirmed', 'paid', 'card', 24900, '2024-12-04 08:00:00', 'web');
  END IF;
  
  IF v_session_dance_sat IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_dance_sat, 'c0000035-0000-0000-0000-000000000035', 'f0000020-0000-0000-0000-000000000020', 'confirmed', 'paid', 'card', 19900, '2024-11-29 07:30:00', 'web');
  END IF;
  
  IF v_session_mini_thu IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_mini_thu, 'c0000036-0000-0000-0000-000000000036', 'f0000020-0000-0000-0000-000000000020', 'confirmed', 'paid', 'card', 12900, '2024-11-29 07:35:00', 'web');
  END IF;
  
  IF v_session_swim_fri IS NOT NULL THEN
    INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
    VALUES
      (v_session_swim_fri, 'c0000041-0000-0000-0000-000000000041', 'f0000025-0000-0000-0000-000000000025', 'confirmed', 'paid', 'card', 17900, '2024-12-05 13:00:00', 'web');
  END IF;

  -- =====================================================
  -- WAITLIST ENTRIES
  -- =====================================================
  
  -- Waitlist for full swim Monday 9am
  IF v_session_swim_mon_9 IS NOT NULL AND v_session_swim_mon_10 IS NOT NULL THEN
    INSERT INTO waitlist (session_id, child_id, family_id, position, alternatives_shown, status)
    VALUES
      (v_session_swim_mon_9, 'c0000010-0000-0000-0000-000000000010', 'f0000005-0000-0000-0000-000000000005', 1, 
       '[]'::jsonb, 'active'),
      (v_session_swim_mon_9, 'c0000022-0000-0000-0000-000000000022', 'f0000012-0000-0000-0000-000000000012', 2,
       '[]'::jsonb, 'active');
  END IF;
     
  -- Waitlist for full dance Monday 5pm
  IF v_session_dance_mon_5 IS NOT NULL THEN
    INSERT INTO waitlist (session_id, child_id, family_id, position, alternatives_shown, status)
    VALUES
      (v_session_dance_mon_5, 'c0000007-0000-0000-0000-000000000007', 'f0000003-0000-0000-0000-000000000003', 1,
       '[]'::jsonb, 'active'),
      (v_session_dance_mon_5, 'c0000028-0000-0000-0000-000000000028', 'f0000015-0000-0000-0000-000000000015', 2,
       '[]'::jsonb, 'active');
  END IF;
     
  -- Waitlist for full martial arts Tuesday
  IF v_session_martial_tue IS NOT NULL THEN
    INSERT INTO waitlist (session_id, child_id, family_id, position, alternatives_shown, status)
    VALUES
      (v_session_martial_tue, 'c0000034-0000-0000-0000-000000000034', 'f0000019-0000-0000-0000-000000000019', 1,
       '[]'::jsonb, 'active'),
      (v_session_martial_tue, 'c0000008-0000-0000-0000-000000000008', 'f0000003-0000-0000-0000-000000000003', 2,
       '[]'::jsonb, 'active');
  END IF;
     
  -- Waitlist for full basketball Saturday 9am
  IF v_session_basketball_sat_9 IS NOT NULL THEN
    INSERT INTO waitlist (session_id, child_id, family_id, position, alternatives_shown, status)
    VALUES
      (v_session_basketball_sat_9, 'c0000030-0000-0000-0000-000000000030', 'f0000017-0000-0000-0000-000000000017', 1,
       '[]'::jsonb, 'active'),
      (v_session_basketball_sat_9, 'c0000032-0000-0000-0000-000000000032', 'f0000018-0000-0000-0000-000000000018', 2,
       '[]'::jsonb, 'active');
  END IF;

END $$;
