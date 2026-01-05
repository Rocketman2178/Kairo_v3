/*
  # N8N Integration Database Functions
  
  ## Overview
  Creates PostgreSQL functions for n8n workflow to call for complex operations.
  These functions encapsulate business logic that would be cumbersome in n8n nodes.
  
  ## Functions Created
  1. get_matching_sessions() - Find sessions matching criteria
  2. get_alternative_sessions() - Find alternatives when requested session unavailable
  3. get_session_by_id() - Get full session details by ID
  4. add_to_waitlist_with_position() - Add to waitlist and return position
  5. check_session_availability() - Quick availability check
  
  ## Purpose
  Provide efficient, secure database operations for n8n AI agent workflow.
*/

-- Function: get_matching_sessions
-- Finds sessions matching child age, day preferences, program, and location
CREATE OR REPLACE FUNCTION get_matching_sessions(
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
           LOWER(srv.location_name) LIKE '%' || LOWER(p_preferred_location) || '%')
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

-- Function: get_alternative_sessions
-- Finds alternative sessions when the requested one is unavailable
CREATE OR REPLACE FUNCTION get_alternative_sessions(
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

-- Function: get_session_by_id
-- Get complete session details by ID
CREATE OR REPLACE FUNCTION get_session_by_id(p_session_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sessionId', session_id,
    'programName', program_name,
    'programDescription', program_description,
    'ageRange', age_range::TEXT,
    'minAge', min_age,
    'maxAge', max_age,
    'price', price_cents,
    'durationWeeks', duration_weeks,
    'locationId', location_id,
    'locationName', location_name,
    'locationAddress', location_address,
    'locationRating', COALESCE(location_rating, 0),
    'coachId', coach_id,
    'coachName', coach_name,
    'coachRating', COALESCE(coach_rating, 0),
    'sessionRating', COALESCE(session_rating, 0),
    'dayOfWeek', day_name,
    'startTime', formatted_start_time,
    'startDate', start_date,
    'endDate', end_date,
    'capacity', capacity,
    'enrolledCount', enrolled_count,
    'spotsRemaining', spots_remaining,
    'isFull', is_full
  )
  INTO result
  FROM full_session_details_view
  WHERE session_id = p_session_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: add_to_waitlist_with_position
-- Adds a child to the waitlist and returns their position
CREATE OR REPLACE FUNCTION add_to_waitlist_with_position(
  p_session_id UUID,
  p_child_id UUID DEFAULT NULL,
  p_family_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_position INTEGER;
  v_waitlist_id UUID;
  v_session_info RECORD;
BEGIN
  SELECT 
    s.id,
    p.name AS program_name,
    CASE s.day_of_week
      WHEN 0 THEN 'Sunday'
      WHEN 1 THEN 'Monday'
      WHEN 2 THEN 'Tuesday'
      WHEN 3 THEN 'Wednesday'
      WHEN 4 THEN 'Thursday'
      WHEN 5 THEN 'Friday'
      WHEN 6 THEN 'Saturday'
    END AS day_name,
    TO_CHAR(s.start_time, 'HH12:MI AM') AS start_time
  INTO v_session_info
  FROM sessions s
  JOIN programs p ON s.program_id = p.id
  WHERE s.id = p_session_id;
  
  IF v_session_info IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Session not found'
    );
  END IF;

  SELECT COALESCE(MAX(position), 0) + 1
  INTO v_position
  FROM waitlist
  WHERE session_id = p_session_id AND status = 'active';

  INSERT INTO waitlist (session_id, child_id, family_id, position, status)
  VALUES (p_session_id, p_child_id, p_family_id, v_position, 'active')
  RETURNING id INTO v_waitlist_id;

  UPDATE sessions 
  SET waitlist_count = waitlist_count + 1
  WHERE id = p_session_id;

  RETURN json_build_object(
    'success', TRUE,
    'waitlistId', v_waitlist_id,
    'position', v_position,
    'programName', v_session_info.program_name,
    'dayOfWeek', v_session_info.day_name,
    'startTime', v_session_info.start_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: check_session_availability
-- Quick check if a session has available spots
CREATE OR REPLACE FUNCTION check_session_availability(p_session_id UUID)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT 
    s.id,
    s.capacity,
    s.enrolled_count,
    s.status,
    (s.capacity - s.enrolled_count) AS spots_remaining,
    (s.enrolled_count >= s.capacity) AS is_full,
    s.waitlist_count
  INTO v_session
  FROM sessions s
  WHERE s.id = p_session_id;
  
  IF v_session IS NULL THEN
    RETURN json_build_object(
      'available', FALSE,
      'error', 'Session not found'
    );
  END IF;
  
  RETURN json_build_object(
    'available', v_session.spots_remaining > 0 AND v_session.status = 'active',
    'spotsRemaining', v_session.spots_remaining,
    'isFull', v_session.is_full,
    'waitlistCount', v_session.waitlist_count,
    'status', v_session.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_organization_context
-- Get organization details for AI agent configuration
CREATE OR REPLACE FUNCTION get_organization_context(p_organization_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'organizationId', organization_id,
    'organizationName', organization_name,
    'aiAgentName', COALESCE(ai_agent_name, 'Kai'),
    'settings', settings,
    'branding', branding
  )
  INTO result
  FROM organization_settings_view
  WHERE organization_id = p_organization_id;
  
  RETURN COALESCE(result, json_build_object(
    'organizationId', p_organization_id,
    'aiAgentName', 'Kai'
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_matching_sessions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_alternative_sessions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_session_by_id TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION add_to_waitlist_with_position TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_session_availability TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_organization_context TO anon, authenticated, service_role;
