-- Fix: add SET search_path = '' to get_matching_sessions (new overload with p_child_skill_level)
-- Required by CLAUDE.md security standards for all SECURITY DEFINER functions.
-- The original overload also lacks it but predates today's work; fixed separately if needed.

CREATE OR REPLACE FUNCTION public.get_matching_sessions(
  p_organization_id       UUID,
  p_child_age             INTEGER,
  p_preferred_days        INTEGER[]  DEFAULT NULL,
  p_preferred_time_of_day TEXT       DEFAULT NULL,
  p_preferred_program     TEXT       DEFAULT NULL,
  p_preferred_location    TEXT       DEFAULT NULL,
  p_limit                 INTEGER    DEFAULT 5,
  p_child_skill_level     TEXT       DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(sessions_data)
  INTO   result
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
      COALESCE(location_rating, 0)  AS location_rating,
      coach_id,
      coach_name,
      COALESCE(coach_rating, 0)     AS coach_rating,
      COALESCE(session_rating, 0)   AS session_rating,
      day_name                      AS day_of_week,
      formatted_start_time          AS start_time,
      start_date,
      end_date,
      capacity,
      enrolled_count,
      spots_remaining,
      urgency_level,
      required_skill_level
    FROM public.session_recommendations_view srv
    WHERE srv.organization_id = p_organization_id
      AND srv.spots_remaining > 0
      AND p_child_age >= lower(srv.age_range)
      AND p_child_age <  upper(srv.age_range)
      AND (
        srv.required_skill_level IS NULL
        OR (
          p_child_skill_level IS NOT NULL
          AND LOWER(srv.required_skill_level) = LOWER(p_child_skill_level)
        )
      )
      AND (p_preferred_days IS NULL OR srv.day_of_week = ANY(p_preferred_days))
      AND (p_preferred_program IS NULL OR
           LOWER(srv.program_name) LIKE '%' || LOWER(p_preferred_program) || '%')
      AND (p_preferred_location IS NULL OR
           LOWER(srv.location_name) LIKE '%' || LOWER(p_preferred_location) || '%' OR
           LOWER(srv.location_city) LIKE '%' || LOWER(p_preferred_location) || '%')
      AND (p_preferred_time_of_day IS NULL OR p_preferred_time_of_day = 'any' OR
           (p_preferred_time_of_day = 'morning'   AND EXTRACT(HOUR FROM srv.start_time) < 12) OR
           (p_preferred_time_of_day = 'afternoon' AND EXTRACT(HOUR FROM srv.start_time) >= 12
                                                   AND EXTRACT(HOUR FROM srv.start_time) < 18) OR
           (p_preferred_time_of_day = 'evening'   AND EXTRACT(HOUR FROM srv.start_time) >= 18))
    ORDER BY
      CASE WHEN srv.spots_remaining <= 3 THEN 0 ELSE 1 END,
      srv.session_rating DESC NULLS LAST,
      srv.start_date ASC
    LIMIT p_limit
  ) sessions_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;
