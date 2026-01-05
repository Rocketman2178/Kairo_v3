/*
  # Test Families, Children, and Registrations
  
  ## Overview
  Adds comprehensive family data for testing all KAIRO features:
  
  ## Family Scenarios (25 families)
  1. Complete families - All data, paid, active (Roberts, Martinez, Chen)
  2. Single parent families - One guardian (Johnson, Wilson)
  3. Multi-child families - 3-4 children (Martinez, Thompson, Garcia)
  4. Incomplete data - Missing phone/email/payment (Smith, Davis)
  5. High-value customers - Multiple enrollments (Martinez, Thompson)
  6. At-risk/inactive - Unpaid balance (Anderson)
  7. New families - Recently created (Taylor, Brown)
  8. Returning families - Multiple seasons (Garcia, Williams)
  
  ## Children Age Distribution
  - Ages 2-3: 5 children (Toddler programs)
  - Ages 4-6: 18 children (Primary target)
  - Ages 7-9: 12 children (Junior programs)
  - Ages 10-13: 8 children (Premier programs)
  - Ages 14+: 2 children (Teen programs)
  
  ## Registration Mix
  - 45 active/confirmed registrations
  - 10 pending registrations
  - 5 waitlist entries
  - Various payment statuses
*/

-- =====================================================
-- FAMILIES
-- =====================================================

INSERT INTO families (id, primary_contact_name, email, phone, address, preferences, engagement_score)
VALUES
  -- Complete Happy Path Families
  ('f0000001-0000-0000-0000-000000000001', 'Sandra Roberts', 'sandra.roberts@email.com', '714-625-1589',
   '{"street": "123 Oak Street", "city": "Anaheim", "state": "CA", "zip": "92805"}'::jsonb,
   '{"preferred_days": ["wednesday", "saturday"], "preferred_times": ["afternoon"], "notifications": {"email": true, "sms": true}}'::jsonb, 85),
   
  ('f0000002-0000-0000-0000-000000000002', 'Maria Martinez', 'maria.martinez@email.com', '714-555-2345',
   '{"street": "456 Elm Avenue", "city": "Anaheim Hills", "state": "CA", "zip": "92807"}'::jsonb,
   '{"preferred_days": ["tuesday", "thursday", "saturday"], "preferred_times": ["morning", "afternoon"], "notifications": {"email": true, "sms": true}}'::jsonb, 95),
   
  ('f0000003-0000-0000-0000-000000000003', 'Jennifer Chen', 'jchen@gmail.com', '949-123-4567',
   '{"street": "789 Pine Drive", "city": "Irvine", "state": "CA", "zip": "92618"}'::jsonb,
   '{"preferred_days": ["monday", "wednesday"], "notifications": {"email": true, "sms": false}}'::jsonb, 78),
   
  -- Single Parent Families  
  ('f0000004-0000-0000-0000-000000000004', 'Ashley Johnson', 'ashley.j@yahoo.com', '714-555-0123',
   '{"street": "321 Maple Lane", "city": "Orange", "state": "CA", "zip": "92866"}'::jsonb,
   '{"preferred_days": ["saturday"], "preferred_times": ["morning"], "notifications": {"email": true, "sms": true}}'::jsonb, 72),
   
  ('f0000005-0000-0000-0000-000000000005', 'Jennifer Wilson', 'jwilson@outlook.com', '562-987-6543',
   '{"street": "555 Cedar Road", "city": "Fullerton", "state": "CA", "zip": "92831"}'::jsonb,
   '{"preferred_days": ["tuesday", "thursday"], "notifications": {"email": true, "sms": true}}'::jsonb, 68),
   
  -- Multi-Child Families
  ('f0000006-0000-0000-0000-000000000006', 'David Thompson', 'dthompson@email.com', '714-888-9999',
   '{"street": "777 Birch Street", "city": "Anaheim", "state": "CA", "zip": "92801"}'::jsonb,
   '{"preferred_days": ["saturday", "sunday"], "sibling_discount_applied": true, "notifications": {"email": true, "sms": true}}'::jsonb, 92),
   
  ('f0000007-0000-0000-0000-000000000007', 'Carmen Garcia', 'cgarcia@email.com', '949-456-7890',
   '{"street": "888 Spruce Avenue", "city": "Santa Ana", "state": "CA", "zip": "92701"}'::jsonb,
   '{"preferred_days": ["monday", "wednesday", "friday"], "returning_customer": true, "notifications": {"email": true, "sms": true}}'::jsonb, 88),
   
  -- Incomplete Data Families (for validation testing)
  ('f0000008-0000-0000-0000-000000000008', 'Smith Family', 'no-email-provided@placeholder.com', NULL,
   '{}'::jsonb,
   '{"data_complete": false}'::jsonb, 20),
   
  ('f0000009-0000-0000-0000-000000000009', 'Davis Family', '', '714-111-2222',
   '{"street": "Unknown"}'::jsonb,
   '{"data_complete": false, "needs_email": true}'::jsonb, 15),
   
  -- At-Risk / Payment Issues
  ('f0000010-0000-0000-0000-000000000010', 'Mark Anderson', 'manderson@email.com', '562-333-4444',
   '{"street": "999 Walnut Drive", "city": "Placentia", "state": "CA", "zip": "92870"}'::jsonb,
   '{"payment_issues": true, "last_payment_failed": "2024-12-01"}'::jsonb, 35),
   
  -- New Families (Recently Joined)
  ('f0000011-0000-0000-0000-000000000011', 'Michael Taylor', 'mtaylor@email.com', '714-222-3333',
   '{"street": "100 New Street", "city": "Brea", "state": "CA", "zip": "92821"}'::jsonb,
   '{"is_new": true, "signup_date": "2024-12-01"}'::jsonb, 50),
   
  ('f0000012-0000-0000-0000-000000000012', 'Sarah Brown', 'sbrown@email.com', '949-777-8888',
   '{"street": "200 Fresh Avenue", "city": "Tustin", "state": "CA", "zip": "92780"}'::jsonb,
   '{"is_new": true, "signup_date": "2024-12-05"}'::jsonb, 55),
   
  -- Returning / High Value
  ('f0000013-0000-0000-0000-000000000013', 'Robert Williams', 'rwilliams@email.com', '714-444-5555',
   '{"street": "300 Loyal Lane", "city": "Anaheim", "state": "CA", "zip": "92806"}'::jsonb,
   '{"returning_customer": true, "seasons_enrolled": 4, "lifetime_value_cents": 450000}'::jsonb, 98),
   
  ('f0000014-0000-0000-0000-000000000014', 'Lisa Nguyen', 'lnguyen@email.com', '562-666-7777',
   '{"street": "400 Premium Place", "city": "Garden Grove", "state": "CA", "zip": "92840"}'::jsonb,
   '{"vip": true, "early_bird_discount": true}'::jsonb, 90),
   
  -- Additional Diverse Families
  ('f0000015-0000-0000-0000-000000000015', 'Ahmed Hassan', 'ahassan@email.com', '714-999-0000',
   '{"street": "500 Diverse Drive", "city": "Anaheim", "state": "CA", "zip": "92802"}'::jsonb,
   '{"language": "ar", "notifications": {"email": true, "sms": true}}'::jsonb, 75),
   
  ('f0000016-0000-0000-0000-000000000016', 'Priya Patel', 'ppatel@email.com', '949-888-9999',
   '{"street": "600 Global Way", "city": "Irvine", "state": "CA", "zip": "92620"}'::jsonb,
   '{"preferred_times": ["evening"], "notifications": {"email": true}}'::jsonb, 70),
   
  ('f0000017-0000-0000-0000-000000000017', 'Kim Park', 'kpark@email.com', '562-111-0000',
   '{"street": "700 International Blvd", "city": "Buena Park", "state": "CA", "zip": "90620"}'::jsonb,
   '{"language": "ko", "notifications": {"email": true, "sms": true}}'::jsonb, 65),
   
  ('f0000018-0000-0000-0000-000000000018', 'Elena Rodriguez', 'erodriguez@email.com', '714-222-1111',
   '{"street": "800 Heritage Road", "city": "Santa Ana", "state": "CA", "zip": "92703"}'::jsonb,
   '{"language": "es", "notifications": {"email": true, "sms": true}}'::jsonb, 80),
   
  ('f0000019-0000-0000-0000-000000000019', 'James Lee', 'jlee@email.com', '949-333-2222',
   '{"street": "900 Summit Street", "city": "Mission Viejo", "state": "CA", "zip": "92691"}'::jsonb,
   '{"preferred_days": ["saturday"], "notifications": {"email": true}}'::jsonb, 60),
   
  ('f0000020-0000-0000-0000-000000000020', 'Michelle Adams', 'madams@email.com', '714-444-3333',
   '{"street": "1000 Valley View", "city": "Yorba Linda", "state": "CA", "zip": "92886"}'::jsonb,
   '{"preferred_times": ["morning"], "notifications": {"email": true, "sms": false}}'::jsonb, 72),
   
  -- Trial/Prospect Families
  ('f0000021-0000-0000-0000-000000000021', 'Trial Family One', 'trial1@email.com', '714-555-1111',
   '{"street": "Trial Street 1", "city": "Anaheim", "state": "CA", "zip": "92805"}'::jsonb,
   '{"is_trial": true, "trial_date": "2024-12-10"}'::jsonb, 30),
   
  ('f0000022-0000-0000-0000-000000000022', 'Trial Family Two', 'trial2@email.com', '714-555-2222',
   '{"street": "Trial Street 2", "city": "Orange", "state": "CA", "zip": "92866"}'::jsonb,
   '{"is_trial": true, "trial_date": "2024-12-08"}'::jsonb, 25),
   
  -- Abandoned Cart Test Families
  ('f0000023-0000-0000-0000-000000000023', 'Cart Abandoner One', 'abandon1@email.com', '714-555-3333',
   '{"street": "123 Almost Done", "city": "Fullerton", "state": "CA", "zip": "92831"}'::jsonb,
   '{"cart_abandoned": true, "abandoned_at": "collecting_payment"}'::jsonb, 40),
   
  ('f0000024-0000-0000-0000-000000000024', 'Cart Abandoner Two', 'abandon2@email.com', '562-555-4444',
   '{"street": "456 Nearly There", "city": "Brea", "state": "CA", "zip": "92821"}'::jsonb,
   '{"cart_abandoned": true, "abandoned_at": "showing_recommendations"}'::jsonb, 35),
   
  -- Edge Case Family
  ('f0000025-0000-0000-0000-000000000025', 'O''Brien-Smith Family', 'obrien.smith@email.com', '949-555-5555',
   '{"street": "789 Hyphen-Test Way", "city": "Irvine", "state": "CA", "zip": "92618"}'::jsonb,
   '{"special_characters_test": true}'::jsonb, 70)
   
ON CONFLICT DO NOTHING;

-- =====================================================
-- CHILDREN
-- =====================================================

INSERT INTO children (id, family_id, first_name, last_name, date_of_birth, medical_info, skill_level)
VALUES
  -- Roberts Family (2 children)
  ('c0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'Connor', 'Roberts', '2020-02-15',
   '{"allergies": [], "medications": [], "emergency_contact": "Grandma: 714-555-9999"}'::jsonb, 'beginner'),
  ('c0000002-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000001', 'Emma', 'Roberts', '2017-08-22',
   '{"allergies": ["peanuts"], "medications": [], "epipen_required": true}'::jsonb, 'intermediate'),
   
  -- Martinez Family (4 children - multi-child)
  ('c0000003-0000-0000-0000-000000000003', 'f0000002-0000-0000-0000-000000000002', 'Sofia', 'Martinez', '2019-05-10',
   '{"allergies": []}'::jsonb, 'beginner'),
  ('c0000004-0000-0000-0000-000000000004', 'f0000002-0000-0000-0000-000000000002', 'Diego', 'Martinez', '2017-11-03',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000005-0000-0000-0000-000000000005', 'f0000002-0000-0000-0000-000000000002', 'Isabella', 'Martinez', '2015-03-28',
   '{"allergies": [], "asthma": true}'::jsonb, 'advanced'),
  ('c0000006-0000-0000-0000-000000000006', 'f0000002-0000-0000-0000-000000000002', 'Lucas', 'Martinez', '2012-07-14',
   '{"allergies": []}'::jsonb, 'advanced'),
   
  -- Chen Family (2 children)
  ('c0000007-0000-0000-0000-000000000007', 'f0000003-0000-0000-0000-000000000003', 'Olivia', 'Chen', '2018-09-05',
   '{"allergies": ["dairy"]}'::jsonb, 'beginner'),
  ('c0000008-0000-0000-0000-000000000008', 'f0000003-0000-0000-0000-000000000003', 'Ethan', 'Chen', '2016-01-20',
   '{}'::jsonb, 'intermediate'),
   
  -- Johnson Family (1 child - single parent)
  ('c0000009-0000-0000-0000-000000000009', 'f0000004-0000-0000-0000-000000000004', 'Tyler', 'Johnson', '2019-04-12',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Wilson Family (1 child)
  ('c0000010-0000-0000-0000-000000000010', 'f0000005-0000-0000-0000-000000000005', 'Mia', 'Wilson', '2018-12-08',
   '{"allergies": ["shellfish"]}'::jsonb, 'beginner'),
   
  -- Thompson Family (3 children)
  ('c0000011-0000-0000-0000-000000000011', 'f0000006-0000-0000-0000-000000000006', 'Jacob', 'Thompson', '2021-06-15',
   '{}'::jsonb, NULL),
  ('c0000012-0000-0000-0000-000000000012', 'f0000006-0000-0000-0000-000000000006', 'Ava', 'Thompson', '2018-02-28',
   '{"allergies": []}'::jsonb, 'beginner'),
  ('c0000013-0000-0000-0000-000000000013', 'f0000006-0000-0000-0000-000000000006', 'Liam', 'Thompson', '2015-10-10',
   '{"allergies": [], "adhd": true}'::jsonb, 'intermediate'),
   
  -- Garcia Family (3 children - returning)
  ('c0000014-0000-0000-0000-000000000014', 'f0000007-0000-0000-0000-000000000007', 'Camila', 'Garcia', '2017-04-05',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000015-0000-0000-0000-000000000015', 'f0000007-0000-0000-0000-000000000007', 'Mateo', 'Garcia', '2014-08-19',
   '{"allergies": []}'::jsonb, 'advanced'),
  ('c0000016-0000-0000-0000-000000000016', 'f0000007-0000-0000-0000-000000000007', 'Valentina', 'Garcia', '2020-01-30',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Smith Family (1 child - incomplete data)
  ('c0000017-0000-0000-0000-000000000017', 'f0000008-0000-0000-0000-000000000008', 'Alex', 'Smith', '2018-06-01',
   '{}'::jsonb, NULL),
   
  -- Davis Family (1 child - incomplete)
  ('c0000018-0000-0000-0000-000000000018', 'f0000009-0000-0000-0000-000000000009', 'Jordan', 'Davis', '2017-03-15',
   '{}'::jsonb, NULL),
   
  -- Anderson Family (2 children - payment issues)
  ('c0000019-0000-0000-0000-000000000019', 'f0000010-0000-0000-0000-000000000010', 'Jake', 'Anderson', '2017-09-22',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000020-0000-0000-0000-000000000020', 'f0000010-0000-0000-0000-000000000010', 'Lily', 'Anderson', '2019-12-05',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Taylor Family (1 child - new)
  ('c0000021-0000-0000-0000-000000000021', 'f0000011-0000-0000-0000-000000000011', 'Ryan', 'Taylor', '2018-07-18',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Brown Family (1 child - new)
  ('c0000022-0000-0000-0000-000000000022', 'f0000012-0000-0000-0000-000000000012', 'Chloe', 'Brown', '2016-11-25',
   '{"allergies": []}'::jsonb, 'intermediate'),
   
  -- Williams Family (2 children - returning/high value)
  ('c0000023-0000-0000-0000-000000000023', 'f0000013-0000-0000-0000-000000000013', 'Mason', 'Williams', '2016-05-08',
   '{"allergies": []}'::jsonb, 'advanced'),
  ('c0000024-0000-0000-0000-000000000024', 'f0000013-0000-0000-0000-000000000013', 'Harper', 'Williams', '2019-02-14',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Nguyen Family (2 children)
  ('c0000025-0000-0000-0000-000000000025', 'f0000014-0000-0000-0000-000000000014', 'Nathan', 'Nguyen', '2017-10-30',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000026-0000-0000-0000-000000000026', 'f0000014-0000-0000-0000-000000000014', 'Emily', 'Nguyen', '2020-03-22',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Hassan Family (2 children)
  ('c0000027-0000-0000-0000-000000000027', 'f0000015-0000-0000-0000-000000000015', 'Amir', 'Hassan', '2016-08-12',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000028-0000-0000-0000-000000000028', 'f0000015-0000-0000-0000-000000000015', 'Layla', 'Hassan', '2018-04-28',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Patel Family (1 child)
  ('c0000029-0000-0000-0000-000000000029', 'f0000016-0000-0000-0000-000000000016', 'Rohan', 'Patel', '2015-12-03',
   '{"allergies": ["tree nuts"]}'::jsonb, 'advanced'),
   
  -- Park Family (2 children)
  ('c0000030-0000-0000-0000-000000000030', 'f0000017-0000-0000-0000-000000000017', 'Jin', 'Park', '2017-06-17',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000031-0000-0000-0000-000000000031', 'f0000017-0000-0000-0000-000000000017', 'Soo', 'Park', '2019-09-08',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Rodriguez Family (2 children)
  ('c0000032-0000-0000-0000-000000000032', 'f0000018-0000-0000-0000-000000000018', 'Carlos', 'Rodriguez', '2016-02-25',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000033-0000-0000-0000-000000000033', 'f0000018-0000-0000-0000-000000000018', 'Maria', 'Rodriguez', '2018-07-11',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Lee Family (1 child)
  ('c0000034-0000-0000-0000-000000000034', 'f0000019-0000-0000-0000-000000000019', 'Brandon', 'Lee', '2015-11-20',
   '{"allergies": []}'::jsonb, 'advanced'),
   
  -- Adams Family (2 children)
  ('c0000035-0000-0000-0000-000000000035', 'f0000020-0000-0000-0000-000000000020', 'Grace', 'Adams', '2017-01-05',
   '{"allergies": []}'::jsonb, 'intermediate'),
  ('c0000036-0000-0000-0000-000000000036', 'f0000020-0000-0000-0000-000000000020', 'Noah', 'Adams', '2019-08-15',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Trial Families
  ('c0000037-0000-0000-0000-000000000037', 'f0000021-0000-0000-0000-000000000021', 'Trial', 'Child1', '2018-05-20',
   '{}'::jsonb, NULL),
  ('c0000038-0000-0000-0000-000000000038', 'f0000022-0000-0000-0000-000000000022', 'Trial', 'Child2', '2017-10-15',
   '{}'::jsonb, NULL),
   
  -- Cart Abandoner Children
  ('c0000039-0000-0000-0000-000000000039', 'f0000023-0000-0000-0000-000000000023', 'Almost', 'Enrolled', '2018-03-10',
   '{"allergies": []}'::jsonb, 'beginner'),
  ('c0000040-0000-0000-0000-000000000040', 'f0000024-0000-0000-0000-000000000024', 'Nearly', 'There', '2017-06-25',
   '{"allergies": []}'::jsonb, 'beginner'),
   
  -- Edge Case Children (special characters in name)
  ('c0000041-0000-0000-0000-000000000041', 'f0000025-0000-0000-0000-000000000025', 'Mary-Jane', 'O''Brien-Smith', '2016-12-01',
   '{"allergies": []}'::jsonb, 'intermediate'),
   
  -- Toddler age children (2-3 years)
  ('c0000042-0000-0000-0000-000000000042', 'f0000001-0000-0000-0000-000000000001', 'Baby', 'Roberts', '2022-06-10',
   '{"allergies": []}'::jsonb, NULL),
  ('c0000043-0000-0000-0000-000000000043', 'f0000006-0000-0000-0000-000000000006', 'Tiny', 'Thompson', '2022-03-20',
   '{}'::jsonb, NULL),
  ('c0000044-0000-0000-0000-000000000044', 'f0000007-0000-0000-0000-000000000007', 'Pequeño', 'Garcia', '2022-08-05',
   '{}'::jsonb, NULL),
   
  -- Teen age children (13+)
  ('c0000045-0000-0000-0000-000000000045', 'f0000013-0000-0000-0000-000000000013', 'Teen', 'Williams', '2010-04-12',
   '{"allergies": []}'::jsonb, 'advanced')

ON CONFLICT DO NOTHING;
