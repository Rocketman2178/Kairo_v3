/*
  # N8N Integration Database Views
  
  ## Overview
  Creates materialized views and helper views optimized for n8n workflow queries.
  These views pre-join related tables and calculate common fields to reduce
  n8n workflow complexity and improve query performance.
  
  ## Views Created
  1. available_sessions_view - Pre-joined session data with availability
  2. session_recommendations_view - Enriched session data with ratings
  3. organization_settings_view - Organization config for AI agent
  
  ## Purpose
  Support the n8n webhook workflow architecture where n8n needs efficient
  access to session, program, location, and rating data.
*/

-- View: available_sessions_view
-- Pre-joins sessions with programs, locations, and coaches
-- Filters to only active sessions with available spots
CREATE OR REPLACE VIEW available_sessions_view AS
SELECT 
  s.id AS session_id,
  s.program_id,
  s.location_id,
  s.coach_id,
  s.day_of_week,
  s.start_time,
  s.start_date,
  s.end_date,
  s.capacity,
  s.enrolled_count,
  s.waitlist_count,
  s.status,
  (s.capacity - s.enrolled_count) AS spots_remaining,
  p.organization_id,
  p.name AS program_name,
  p.description AS program_description,
  p.age_range,
  p.duration_weeks,
  p.price_cents,
  p.payment_plan_options,
  l.name AS location_name,
  l.address AS location_address,
  st.name AS coach_name,
  st.rating AS coach_rating,
  CASE s.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END AS day_name,
  TO_CHAR(s.start_time, 'HH12:MI AM') AS formatted_start_time,
  CONCAT('$', (p.price_cents / 100)::TEXT) AS formatted_price
FROM sessions s
JOIN programs p ON s.program_id = p.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN staff st ON s.coach_id = st.id
WHERE s.status = 'active'
  AND s.start_date >= CURRENT_DATE
  AND s.enrolled_count < s.capacity;

-- View: session_recommendations_view
-- Includes all session data plus aggregated ratings from reviews
CREATE OR REPLACE VIEW session_recommendations_view AS
SELECT 
  asv.*,
  COALESCE(sr.avg_overall_rating, 0) AS session_rating,
  COALESCE(sr.avg_location_rating, 0) AS location_rating,
  COALESCE(sr.review_count, 0) AS review_count,
  CASE 
    WHEN asv.spots_remaining <= 2 THEN 'high'
    WHEN asv.spots_remaining <= 5 THEN 'medium'
    ELSE 'low'
  END AS urgency_level,
  CASE 
    WHEN asv.spots_remaining = 1 THEN 'Only 1 spot left!'
    WHEN asv.spots_remaining <= 3 THEN asv.spots_remaining || ' spots left'
    ELSE asv.spots_remaining || ' spots available'
  END AS availability_text
FROM available_sessions_view asv
LEFT JOIN (
  SELECT 
    session_id,
    AVG(overall_rating) AS avg_overall_rating,
    AVG(location_rating) AS avg_location_rating,
    COUNT(*) AS review_count
  FROM session_reviews
  GROUP BY session_id
) sr ON asv.session_id = sr.session_id;

-- View: organization_settings_view
-- Quick access to organization config for n8n
CREATE OR REPLACE VIEW organization_settings_view AS
SELECT 
  id AS organization_id,
  name AS organization_name,
  slug,
  ai_agent_name,
  settings,
  branding,
  settings->>'defaultTimeZone' AS default_timezone,
  settings->>'supportEmail' AS support_email,
  settings->>'supportPhone' AS support_phone,
  branding->>'primaryColor' AS primary_color,
  branding->>'logoUrl' AS logo_url
FROM organizations;

-- View: full_session_details_view
-- Complete session information for displaying to users
CREATE OR REPLACE VIEW full_session_details_view AS
SELECT 
  s.id AS session_id,
  s.program_id,
  s.location_id,
  s.coach_id,
  s.day_of_week,
  s.start_time,
  s.start_date,
  s.end_date,
  s.capacity,
  s.enrolled_count,
  s.waitlist_count,
  s.status,
  (s.capacity - s.enrolled_count) AS spots_remaining,
  (s.enrolled_count >= s.capacity) AS is_full,
  p.organization_id,
  p.name AS program_name,
  p.description AS program_description,
  p.age_range,
  lower(p.age_range) AS min_age,
  upper(p.age_range) - 1 AS max_age,
  p.duration_weeks,
  p.price_cents,
  p.payment_plan_options,
  l.name AS location_name,
  l.address AS location_address,
  st.name AS coach_name,
  st.rating AS coach_rating,
  CASE s.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END AS day_name,
  TO_CHAR(s.start_time, 'HH12:MI AM') AS formatted_start_time,
  CONCAT('$', (p.price_cents / 100)::TEXT) AS formatted_price,
  COALESCE(sr.avg_overall_rating, 0) AS session_rating,
  COALESCE(sr.avg_location_rating, 0) AS location_rating,
  COALESCE(sr.review_count, 0) AS review_count
FROM sessions s
JOIN programs p ON s.program_id = p.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN staff st ON s.coach_id = st.id
LEFT JOIN (
  SELECT 
    session_id,
    AVG(overall_rating) AS avg_overall_rating,
    AVG(location_rating) AS avg_location_rating,
    COUNT(*) AS review_count
  FROM session_reviews
  GROUP BY session_id
) sr ON s.id = sr.session_id
WHERE s.start_date >= CURRENT_DATE;

-- Grant permissions on views
GRANT SELECT ON available_sessions_view TO anon, authenticated;
GRANT SELECT ON session_recommendations_view TO anon, authenticated;
GRANT SELECT ON organization_settings_view TO anon, authenticated;
GRANT SELECT ON full_session_details_view TO anon, authenticated;
