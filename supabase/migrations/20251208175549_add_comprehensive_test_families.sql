/*
  # Comprehensive Test Families, Children, and Registrations
  
  ## Overview
  Adds production-realistic test data based on iClassPro analysis.
  
  ## Test Scenarios Covered
  1. Happy path registration (Roberts family)
  2. Multi-child sibling enrollment (Martinez, Thompson families)
  3. Single parent workflow (Johnson, Wilson families)
  4. Payment failure recovery (Anderson family)
  5. Incomplete data validation (Smith, Davis families)
  6. Returning high-value customer (Williams, Garcia families)
  7. Trial enrollment (Trial families)
  8. Cart abandonment (Cart Abandoner families)
  9. Special characters in names (O'Brien-Smith family)
  10. Waitlist scenarios
*/

-- Add comprehensive test families
INSERT INTO families (primary_contact_name, email, phone, address, preferences, engagement_score)
VALUES
  ('Sandra Roberts', 'sandra.roberts@email.com', '714-625-1589',
   '{"street": "123 Oak Street", "city": "Anaheim", "state": "CA", "zip": "92805"}'::jsonb,
   '{"preferred_days": ["wednesday", "saturday"], "preferred_times": ["afternoon"], "notifications": {"email": true, "sms": true}}'::jsonb, 85),
   
  ('Maria Martinez', 'maria.martinez@email.com', '714-555-2345',
   '{"street": "456 Elm Avenue", "city": "Anaheim Hills", "state": "CA", "zip": "92807"}'::jsonb,
   '{"preferred_days": ["tuesday", "thursday", "saturday"], "sibling_discount_applied": true}'::jsonb, 95),
   
  ('Ashley Johnson', 'ashley.j@yahoo.com', '714-555-0123',
   '{"street": "321 Maple Lane", "city": "Orange", "state": "CA", "zip": "92866"}'::jsonb,
   '{"preferred_days": ["saturday"], "single_parent": true}'::jsonb, 72),
   
  ('Jennifer Wilson', 'jwilson@outlook.com', '562-987-6543',
   '{"street": "555 Cedar Road", "city": "Fullerton", "state": "CA", "zip": "92831"}'::jsonb,
   '{"preferred_days": ["tuesday", "thursday"]}'::jsonb, 68),
   
  ('David Thompson', 'dthompson@email.com', '714-888-9999',
   '{"street": "777 Birch Street", "city": "Anaheim", "state": "CA", "zip": "92801"}'::jsonb,
   '{"preferred_days": ["saturday", "sunday"], "sibling_discount_applied": true}'::jsonb, 92),
   
  ('Carmen Garcia', 'cgarcia@email.com', '949-456-7890',
   '{"street": "888 Spruce Avenue", "city": "Santa Ana", "state": "CA", "zip": "92701"}'::jsonb,
   '{"returning_customer": true, "seasons_enrolled": 3}'::jsonb, 88),
   
  ('Smith Family', 'incomplete@placeholder.com', NULL,
   '{}'::jsonb,
   '{"data_complete": false, "needs_phone": true}'::jsonb, 20),
   
  ('Davis Family', 'davis@email.com', '714-111-2222',
   '{"street": "Unknown"}'::jsonb,
   '{"data_complete": false}'::jsonb, 15),
   
  ('Mark Anderson', 'manderson@email.com', '562-333-4444',
   '{"street": "999 Walnut Drive", "city": "Placentia", "state": "CA", "zip": "92870"}'::jsonb,
   '{"payment_issues": true}'::jsonb, 35),
   
  ('Michael Taylor', 'mtaylor@email.com', '714-222-3333',
   '{"street": "100 New Street", "city": "Brea", "state": "CA", "zip": "92821"}'::jsonb,
   '{"is_new": true}'::jsonb, 50),
   
  ('Sarah Brown', 'sbrown@email.com', '949-777-8888',
   '{"street": "200 Fresh Avenue", "city": "Tustin", "state": "CA", "zip": "92780"}'::jsonb,
   '{"is_new": true}'::jsonb, 55),
   
  ('Robert Williams', 'rwilliams@email.com', '714-444-5555',
   '{"street": "300 Loyal Lane", "city": "Anaheim", "state": "CA", "zip": "92806"}'::jsonb,
   '{"returning_customer": true, "seasons_enrolled": 4, "vip": true}'::jsonb, 98),
   
  ('Lisa Nguyen', 'lnguyen@email.com', '562-666-7777',
   '{"street": "400 Premium Place", "city": "Garden Grove", "state": "CA", "zip": "92840"}'::jsonb,
   '{"vip": true, "early_bird_discount": true}'::jsonb, 90),
   
  ('Ahmed Hassan', 'ahassan@email.com', '714-999-0000',
   '{"street": "500 Diverse Drive", "city": "Anaheim", "state": "CA", "zip": "92802"}'::jsonb,
   '{"language": "ar"}'::jsonb, 75),
   
  ('Priya Patel', 'ppatel@email.com', '949-888-9999',
   '{"street": "600 Global Way", "city": "Irvine", "state": "CA", "zip": "92620"}'::jsonb,
   '{"preferred_times": ["evening"]}'::jsonb, 70),
   
  ('Elena Rodriguez', 'erodriguez@email.com', '714-222-1111',
   '{"street": "800 Heritage Road", "city": "Santa Ana", "state": "CA", "zip": "92703"}'::jsonb,
   '{"language": "es"}'::jsonb, 80),
   
  ('Trial Family One', 'trial1@email.com', '714-555-1111',
   '{"street": "Trial Street 1", "city": "Anaheim", "state": "CA", "zip": "92805"}'::jsonb,
   '{"is_trial": true}'::jsonb, 30),
   
  ('Trial Family Two', 'trial2@email.com', '714-555-2222',
   '{"street": "Trial Street 2", "city": "Orange", "state": "CA", "zip": "92866"}'::jsonb,
   '{"is_trial": true}'::jsonb, 25),
   
  ('Cart Abandoner One', 'abandon1@email.com', '714-555-3333',
   '{"street": "123 Almost Done", "city": "Fullerton", "state": "CA", "zip": "92831"}'::jsonb,
   '{"cart_abandoned": true}'::jsonb, 40),
   
  ('O''Brien-Smith Family', 'obrien.smith@email.com', '949-555-5555',
   '{"street": "789 Hyphen-Test Way", "city": "Irvine", "state": "CA", "zip": "92618"}'::jsonb,
   '{"special_characters_test": true}'::jsonb, 70)
   
ON CONFLICT DO NOTHING;
