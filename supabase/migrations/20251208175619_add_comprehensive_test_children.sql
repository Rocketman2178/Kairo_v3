/*
  # Comprehensive Test Children
  
  ## Age Distribution
  - Ages 2-3: ~10% (Toddler programs)
  - Ages 4-6: ~40% (Primary target - Mini/Junior programs)
  - Ages 7-9: ~30% (Junior/Premier programs)
  - Ages 10-13: ~15% (Premier programs)
  - Ages 14+: ~5% (Teen programs)
*/

-- Add children linked to families
INSERT INTO children (family_id, first_name, last_name, date_of_birth, medical_info, skill_level)
SELECT 
  f.id,
  c.first_name,
  c.last_name,
  c.dob::date,
  c.medical_info::jsonb,
  c.skill_level
FROM families f
CROSS JOIN (VALUES
  ('Sandra Roberts', 'Connor', 'Roberts', '2020-02-15', '{"allergies": [], "emergency_contact": "Grandma: 714-555-9999"}', 'beginner'),
  ('Sandra Roberts', 'Emma', 'Roberts', '2017-08-22', '{"allergies": ["peanuts"], "epipen_required": true}', 'intermediate'),
  ('Sandra Roberts', 'Baby', 'Roberts', '2022-06-10', '{"allergies": []}', NULL),
  ('Maria Martinez', 'Sofia', 'Martinez', '2019-05-10', '{"allergies": []}', 'beginner'),
  ('Maria Martinez', 'Diego', 'Martinez', '2017-11-03', '{"allergies": []}', 'intermediate'),
  ('Maria Martinez', 'Isabella', 'Martinez', '2015-03-28', '{"asthma": true}', 'advanced'),
  ('Maria Martinez', 'Lucas', 'Martinez', '2012-07-14', '{"allergies": []}', 'advanced'),
  ('Ashley Johnson', 'Tyler', 'Johnson', '2019-04-12', '{"allergies": []}', 'beginner'),
  ('Jennifer Wilson', 'Mia', 'Wilson', '2018-12-08', '{"allergies": ["shellfish"]}', 'beginner'),
  ('David Thompson', 'Jacob', 'Thompson', '2021-06-15', '{}', NULL),
  ('David Thompson', 'Ava', 'Thompson', '2018-02-28', '{"allergies": []}', 'beginner'),
  ('David Thompson', 'Liam', 'Thompson', '2015-10-10', '{"adhd": true}', 'intermediate'),
  ('Carmen Garcia', 'Camila', 'Garcia', '2017-04-05', '{"allergies": []}', 'intermediate'),
  ('Carmen Garcia', 'Mateo', 'Garcia', '2014-08-19', '{"allergies": []}', 'advanced'),
  ('Carmen Garcia', 'Valentina', 'Garcia', '2020-01-30', '{"allergies": []}', 'beginner'),
  ('Smith Family', 'Alex', 'Smith', '2018-06-01', '{}', NULL),
  ('Davis Family', 'Jordan', 'Davis', '2017-03-15', '{}', NULL),
  ('Mark Anderson', 'Jake', 'Anderson', '2017-09-22', '{"allergies": []}', 'intermediate'),
  ('Mark Anderson', 'Lily', 'Anderson', '2019-12-05', '{"allergies": []}', 'beginner'),
  ('Michael Taylor', 'Ryan', 'Taylor', '2018-07-18', '{"allergies": []}', 'beginner'),
  ('Sarah Brown', 'Chloe', 'Brown', '2016-11-25', '{"allergies": []}', 'intermediate'),
  ('Robert Williams', 'Mason', 'Williams', '2016-05-08', '{"allergies": []}', 'advanced'),
  ('Robert Williams', 'Harper', 'Williams', '2019-02-14', '{"allergies": []}', 'beginner'),
  ('Robert Williams', 'Teen', 'Williams', '2010-04-12', '{"allergies": []}', 'advanced'),
  ('Lisa Nguyen', 'Nathan', 'Nguyen', '2017-10-30', '{"allergies": []}', 'intermediate'),
  ('Lisa Nguyen', 'Emily', 'Nguyen', '2020-03-22', '{"allergies": []}', 'beginner'),
  ('Ahmed Hassan', 'Amir', 'Hassan', '2016-08-12', '{"allergies": []}', 'intermediate'),
  ('Ahmed Hassan', 'Layla', 'Hassan', '2018-04-28', '{"allergies": []}', 'beginner'),
  ('Priya Patel', 'Rohan', 'Patel', '2015-12-03', '{"allergies": ["tree nuts"]}', 'advanced'),
  ('Elena Rodriguez', 'Carlos', 'Rodriguez', '2016-02-25', '{"allergies": []}', 'intermediate'),
  ('Elena Rodriguez', 'Maria', 'Rodriguez', '2018-07-11', '{"allergies": []}', 'beginner'),
  ('Trial Family One', 'Trial', 'ChildOne', '2018-05-20', '{}', NULL),
  ('Trial Family Two', 'Trial', 'ChildTwo', '2017-10-15', '{}', NULL),
  ('Cart Abandoner One', 'Almost', 'Enrolled', '2018-03-10', '{"allergies": []}', 'beginner'),
  ('O''Brien-Smith Family', 'Mary-Jane', 'O''Brien-Smith', '2016-12-01', '{"allergies": []}', 'intermediate')
) AS c(family_name, first_name, last_name, dob, medical_info, skill_level)
WHERE f.primary_contact_name = c.family_name
ON CONFLICT DO NOTHING;
