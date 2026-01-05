/*
  # Comprehensive Test Registrations
  
  ## Registration Mix
  - Confirmed/Active: 35+ registrations
  - Pending: 5 registrations
  - Various payment statuses and channels
  - Waitlist entries for full sessions
*/

-- Add registrations by matching children to age-appropriate sessions
INSERT INTO registrations (session_id, child_id, family_id, status, payment_status, payment_method, amount_cents, enrolled_at, registration_channel)
SELECT 
  s.id as session_id,
  c.id as child_id,
  c.family_id,
  CASE 
    WHEN f.preferences->>'payment_issues' = 'true' THEN 'confirmed'
    WHEN f.preferences->>'is_trial' = 'true' THEN 'pending'
    WHEN f.preferences->>'cart_abandoned' = 'true' THEN 'pending'
    WHEN f.preferences->>'is_new' = 'true' THEN 'pending'
    ELSE 'confirmed'
  END as status,
  CASE 
    WHEN f.preferences->>'payment_issues' = 'true' THEN 'failed'
    WHEN f.preferences->>'is_trial' = 'true' THEN 'pending'
    WHEN f.preferences->>'cart_abandoned' = 'true' THEN 'pending'
    WHEN f.preferences->>'is_new' = 'true' THEN 'pending'
    ELSE 'paid'
  END as payment_status,
  CASE 
    WHEN f.preferences->>'payment_issues' = 'true' THEN 'card'
    WHEN f.preferences->>'is_trial' = 'true' THEN NULL
    WHEN f.preferences->>'cart_abandoned' = 'true' THEN NULL
    WHEN f.preferences->>'is_new' = 'true' THEN NULL
    ELSE 'card'
  END as payment_method,
  p.price_cents,
  CASE 
    WHEN f.preferences->>'is_trial' = 'true' THEN NULL
    WHEN f.preferences->>'cart_abandoned' = 'true' THEN NULL
    WHEN f.preferences->>'is_new' = 'true' THEN NULL
    ELSE NOW() - INTERVAL '1 day' * (RANDOM() * 30)::int
  END as enrolled_at,
  (ARRAY['web', 'voice', 'text', 'sms'])[1 + (RANDOM() * 3)::int] as registration_channel
FROM children c
JOIN families f ON c.family_id = f.id
CROSS JOIN LATERAL (
  SELECT s.id, s.program_id
  FROM sessions s
  JOIN programs p ON s.program_id = p.id
  WHERE s.status = 'active'
    AND s.enrolled_count < s.capacity
    AND EXTRACT(YEAR FROM AGE(c.date_of_birth)) >= lower(p.age_range)
    AND EXTRACT(YEAR FROM AGE(c.date_of_birth)) < upper(p.age_range)
  ORDER BY RANDOM()
  LIMIT 1
) s
JOIN programs p ON s.program_id = p.id
WHERE f.preferences->>'data_complete' IS NULL OR f.preferences->>'data_complete' != 'false'
ON CONFLICT DO NOTHING;

-- Update enrolled_count for sessions
UPDATE sessions s
SET enrolled_count = (
  SELECT COUNT(*) 
  FROM registrations r 
  WHERE r.session_id = s.id 
    AND r.status = 'confirmed'
);

-- Add some waitlist entries for popular sessions
INSERT INTO waitlist (session_id, child_id, family_id, position, alternatives_shown, status)
SELECT 
  s.id,
  c.id,
  c.family_id,
  ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY RANDOM()),
  '[]'::jsonb,
  'active'
FROM children c
JOIN families f ON c.family_id = f.id
CROSS JOIN LATERAL (
  SELECT s.id, s.program_id
  FROM sessions s
  JOIN programs p ON s.program_id = p.id
  WHERE s.enrolled_count >= s.capacity - 1
    AND EXTRACT(YEAR FROM AGE(c.date_of_birth)) >= lower(p.age_range)
    AND EXTRACT(YEAR FROM AGE(c.date_of_birth)) < upper(p.age_range)
  ORDER BY RANDOM()
  LIMIT 1
) s
WHERE f.primary_contact_name IN ('Jennifer Wilson', 'David Thompson', 'Carmen Garcia')
  AND NOT EXISTS (
    SELECT 1 FROM registrations r WHERE r.child_id = c.id AND r.session_id = s.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM waitlist w WHERE w.child_id = c.id AND w.session_id = s.id
  )
LIMIT 8
ON CONFLICT DO NOTHING;

-- Update waitlist_count for sessions
UPDATE sessions s
SET waitlist_count = (
  SELECT COUNT(*) 
  FROM waitlist w 
  WHERE w.session_id = s.id 
    AND w.status = 'active'
);
