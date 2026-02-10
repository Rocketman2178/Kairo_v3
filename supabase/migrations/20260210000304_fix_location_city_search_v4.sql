/*
  # Fix Location Search to Include City

  1. Changes
    - Drop all versions of get_matching_sessions and get_alternative_sessions functions
    - Drop and recreate available_sessions_view with city field
    - Drop and recreate session_recommendations_view (depends on available_sessions_view)
    - Recreate get_matching_sessions function to search both location_name and city
    - Recreate get_alternative_sessions function to include location_city

  2. Purpose
    - Allow users to search by city name (e.g., "Irvine") instead of exact location name
    - Fixes bug where "Irvine" wouldn't match "Oakwood Recreation Center" in Irvine

  3. Impact
    - Scenario 1 will now correctly find Mini Soccer sessions in Irvine
    - Location searches become more flexible and user-friendly
*/

-- Drop all function versions
DROP FUNCTION IF EXISTS get_matching_sessions(uuid, integer, integer[], text, text, text, integer);
DROP FUNCTION IF EXISTS get_matching_sessions(uuid, integer, integer[], text, text, text, time, time, integer);
DROP FUNCTION IF EXISTS get_alternative_sessions(uuid, integer, integer, text, text, uuid, integer);
DROP FUNCTION IF EXISTS get_alternative_sessions(uuid, integer, integer, text, text, time, time, uuid, integer);

-- Drop dependent view
DROP VIEW IF EXISTS session_recommendations_view CASCADE;

-- Drop and recreate available_sessions_view to include city
DROP VIEW IF EXISTS available_sessions_view CASCADE;
CREATE VIEW available_sessions_view AS
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
  l.city AS location_city,
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

-- Recreate session_recommendations_view with city field
CREATE VIEW session_recommendations_view AS
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

-- Recreate get_matching_sessions to search both location_name and location_city
CREATE FUNCTION get_matching_sessions(
  p_organization_id UUID,
  p_child_age INTEGER,
  p_preferred_days INTEGER[] DEFAULT NULL,
  p_preferred_time_of_day TEXT DEFAULT NULL,
  p_preferred_program TEXT DEFAULT NULL,
  p_preferred_location TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(sessions_data)
  INTO result
  FROM (
    SELECT 
      session_id,
      program_name,
      program_description,
      age_range::TEXT,
      price_cents,
      duration_weeks,
      location_id,
      location_name,
      location_city,
      location_address,
      COALESCE(location_rating, 0) AS location_rating,
      coach_id,
      coach_name,
      COALESCE(coach_rating, 0) AS coach_rating,
      COALESCE(session_rating, 0) AS session_rating,
      day_name AS day_of_week,
      formatted_start_time AS start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      spots_remaining,
      urgency_level
    FROM session_recommendations_view srv
    WHERE srv.organization_id = p_organization_id
      AND srv.spots_remaining > 0
      AND p_child_age >= lower(srv.age_range)
      AND p_child_age < upper(srv.age_range)
      AND (p_preferred_days IS NULL OR srv.day_of_week = ANY(p_preferred_days))
      AND (p_preferred_program IS NULL OR 
           LOWER(srv.program_name) LIKE '%' || LOWER(p_preferred_program) || '%')
      AND (p_preferred_location IS NULL OR 
           LOWER(srv.location_name) LIKE '%' || LOWER(p_preferred_location) || '%' OR
           LOWER(srv.location_city) LIKE '%' || LOWER(p_preferred_location) || '%')
      AND (p_preferred_time_of_day IS NULL OR p_preferred_time_of_day = 'any' OR
           (p_preferred_time_of_day = 'morning' AND EXTRACT(HOUR FROM srv.start_time) < 12) OR
           (p_preferred_time_of_day = 'afternoon' AND EXTRACT(HOUR FROM srv.start_time) >= 12 AND EXTRACT(HOUR FROM srv.start_time) < 17) OR
           (p_preferred_time_of_day = 'evening' AND EXTRACT(HOUR FROM srv.start_time) >= 17))
    ORDER BY 
      CASE WHEN srv.spots_remaining <= 3 THEN 0 ELSE 1 END,
      srv.session_rating DESC NULLS LAST,
      srv.start_date ASC
    LIMIT p_limit
  ) sessions_data;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_alternative_sessions to include location_city
CREATE FUNCTION get_alternative_sessions(
  p_organization_id UUID,
  p_child_age INTEGER,
  p_requested_day INTEGER,
  p_preferred_program TEXT DEFAULT NULL,
  p_preferred_time_of_day TEXT DEFAULT NULL,
  p_exclude_session_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(alt_data)
  INTO result
  FROM (
    SELECT 
      session_id,
      program_name,
      program_description,
      age_range::TEXT,
      price_cents,
      duration_weeks,
      location_id,
      location_name,
      location_city,
      location_address,
      COALESCE(location_rating, 0) AS location_rating,
      coach_id,
      coach_name,
      COALESCE(coach_rating, 0) AS coach_rating,
      COALESCE(session_rating, 0) AS session_rating,
      day_name AS day_of_week,
      formatted_start_time AS start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      spots_remaining,
      urgency_level,
      CASE 
        WHEN ABS(srv.day_of_week - p_requested_day) = 1 OR ABS(srv.day_of_week - p_requested_day) = 6 
          THEN 'adjacent_day'
        WHEN srv.day_of_week = p_requested_day THEN 'alternative_time'
        ELSE 'similar_program'
      END AS alternative_type,
      CASE 
        WHEN ABS(srv.day_of_week - p_requested_day) = 1 OR ABS(srv.day_of_week - p_requested_day) = 6 
          THEN 90
        WHEN srv.day_of_week = p_requested_day THEN 85
        ELSE 50
      END + COALESCE(srv.session_rating::INTEGER, 0) AS match_score
    FROM session_recommendations_view srv
    WHERE srv.organization_id = p_organization_id
      AND srv.spots_remaining > 0
      AND p_child_age >= lower(srv.age_range)
      AND p_child_age < upper(srv.age_range)
      AND (p_exclude_session_id IS NULL OR srv.session_id != p_exclude_session_id)
      AND (p_preferred_program IS NULL OR 
           LOWER(srv.program_name) LIKE '%' || LOWER(p_preferred_program) || '%')
    ORDER BY 
      match_score DESC,
      srv.session_rating DESC NULLS LAST
    LIMIT p_limit
  ) alt_data;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_matching_sessions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_alternative_sessions TO anon, authenticated, service_role;
