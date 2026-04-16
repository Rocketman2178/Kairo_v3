-- ============================================================
-- Feature 2.2.1: Skill-Level-Based Registration
-- Adds required_skill_level to sessions and skill_level_names
-- to organizations, then refreshes dependent views and the
-- get_matching_sessions RPC to honour skill-level filtering.
-- ============================================================

-- 1. Schema additions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS required_skill_level TEXT;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS skill_level_names JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sessions.required_skill_level IS
  'Prerequisite skill level (e.g. "Goldfish", "Level 2"). NULL = no prerequisite.';

COMMENT ON COLUMN public.organizations.skill_level_names IS
  'Ordered list of org-configured skill level names, e.g. ["Goldfish","Starfish","Level 1"].';

-- 2. Drop dependent views so we can redefine column order
DROP VIEW IF EXISTS public.session_recommendations_view;
DROP VIEW IF EXISTS public.available_sessions_view;

-- 3. Recreate available_sessions_view with required_skill_level
CREATE VIEW public.available_sessions_view AS
SELECT
  s.id                                                AS session_id,
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
  (s.capacity - s.enrolled_count)                    AS spots_remaining,
  p.organization_id,
  p.name                                             AS program_name,
  p.description                                      AS program_description,
  p.age_range,
  p.duration_weeks,
  p.price_cents,
  p.payment_plan_options,
  l.name                                             AS location_name,
  l.city                                             AS location_city,
  l.address                                          AS location_address,
  st.name                                            AS coach_name,
  st.rating                                          AS coach_rating,
  CASE s.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    ELSE NULL
  END                                                AS day_name,
  to_char(s.start_time::interval, 'HH12:MI AM')     AS formatted_start_time,
  concat('$', (p.price_cents / 100)::text)           AS formatted_price,
  s.required_skill_level
FROM sessions s
JOIN programs p ON s.program_id = p.id
LEFT JOIN locations l ON s.location_id = l.id
LEFT JOIN staff st ON s.coach_id = st.id
WHERE s.status = 'active'
  AND s.start_date >= CURRENT_DATE
  AND s.enrolled_count < s.capacity;

-- 4. Recreate session_recommendations_view carrying required_skill_level through
CREATE VIEW public.session_recommendations_view AS
SELECT
  asv.session_id,
  asv.program_id,
  asv.location_id,
  asv.coach_id,
  asv.day_of_week,
  asv.start_time,
  asv.start_date,
  asv.end_date,
  asv.capacity,
  asv.enrolled_count,
  asv.waitlist_count,
  asv.status,
  asv.spots_remaining,
  asv.organization_id,
  asv.program_name,
  asv.program_description,
  asv.age_range,
  asv.duration_weeks,
  asv.price_cents,
  asv.payment_plan_options,
  asv.location_name,
  asv.location_city,
  asv.location_address,
  asv.coach_name,
  asv.coach_rating,
  asv.day_name,
  asv.formatted_start_time,
  asv.formatted_price,
  COALESCE(sr.avg_overall_rating,  0) AS session_rating,
  COALESCE(sr.avg_location_rating, 0) AS location_rating,
  COALESCE(sr.review_count,        0) AS review_count,
  CASE
    WHEN asv.spots_remaining <= 2 THEN 'high'
    WHEN asv.spots_remaining <= 5 THEN 'medium'
    ELSE 'low'
  END AS urgency_level,
  CASE
    WHEN asv.spots_remaining = 1 THEN 'Only 1 spot left!'
    WHEN asv.spots_remaining <= 3 THEN asv.spots_remaining || ' spots left'
    ELSE asv.spots_remaining || ' spots available'
  END AS availability_text,
  asv.required_skill_level
FROM available_sessions_view asv
LEFT JOIN (
  SELECT session_id,
         avg(overall_rating)  AS avg_overall_rating,
         avg(location_rating) AS avg_location_rating,
         count(*)             AS review_count
  FROM session_reviews
  GROUP BY session_id
) sr ON asv.session_id = sr.session_id;

-- 5. Update get_matching_sessions: add p_child_skill_level param + skill gate
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
    FROM session_recommendations_view srv
    WHERE srv.organization_id = p_organization_id
      AND srv.spots_remaining > 0
      AND p_child_age >= lower(srv.age_range)
      AND p_child_age <  upper(srv.age_range)
      -- Skill-level gate:
      --   session has no requirement  → always eligible
      --   session has requirement + child has level → must match (case-insensitive)
      --   session has requirement + child has no level → exclude
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
