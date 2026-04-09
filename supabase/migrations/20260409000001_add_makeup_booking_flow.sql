/*
  # Add Makeup Token Booking Flow (Stage 3.7 Phase 2)

  ## Summary
  Adds the server-side function that powers the makeup class booking flow.
  Parents can now browse sessions that match their token's skill level and
  capacity requirements, and redeem tokens directly from the Parent Portal.

  ## New Functions
  - `get_makeup_sessions_for_token(p_token_id, p_family_id)` — returns open
    sessions in the same org filtered by token's skill_level (if set) and capacity

  ## Security
  - Family ownership of token validated inside the function (SECURITY DEFINER)
  - No session data returned if token is expired, used, or belongs to another family

  ## Rollback
  -- DROP FUNCTION IF EXISTS public.get_makeup_sessions_for_token(UUID, UUID);
*/

-- ─── Function: get_makeup_sessions_for_token ─────────────────────────────────
-- Returns open sessions eligible for makeup booking with a given token.
-- Validates that the token belongs to the family and is still active.

CREATE OR REPLACE FUNCTION public.get_makeup_sessions_for_token(
  p_token_id  UUID,
  p_family_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token       RECORD;
  v_sessions    JSON;
BEGIN
  -- Fetch and validate the token
  SELECT mt.*, o.id AS org_id
  INTO v_token
  FROM public.makeup_tokens mt
  JOIN public.sessions      src_s ON src_s.id = mt.source_session_id
  JOIN public.programs      src_p ON src_p.id = src_s.program_id
  JOIN public.organizations o     ON o.id     = src_p.organization_id
  WHERE mt.id        = p_token_id
    AND mt.family_id = p_family_id
    AND mt.status    = 'active'
    AND mt.expires_at > NOW()
  LIMIT 1;

  -- If no token (expired / wrong family / already used)
  IF NOT FOUND THEN
    -- Try without org join in case source_session_id is NULL
    SELECT mt.*
    INTO v_token
    FROM public.makeup_tokens mt
    WHERE mt.id        = p_token_id
      AND mt.family_id = p_family_id
      AND mt.status    = 'active'
      AND mt.expires_at > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN json_build_object(
        'error',   true,
        'message', 'Token not found, expired, or already used'
      );
    END IF;

    -- Token exists but source_session_id is NULL — use organization from token
    v_token.org_id := v_token.organization_id;
  END IF;

  -- Fetch available sessions in same org
  -- If skill_level is set on the token, filter by required_skill_level (NULL = open to all)
  SELECT json_agg(row ORDER BY row.start_date, row.start_time)
  INTO v_sessions
  FROM (
    SELECT
      s.id,
      s.day_of_week,
      s.start_time,
      s.start_date,
      s.end_date,
      s.capacity,
      s.enrolled_count,
      (s.capacity - s.enrolled_count) AS spots_remaining,
      p.name           AS program_name,
      p.price_cents,
      p.duration_weeks,
      p.required_skill_level,
      l.name           AS location_name,
      l.address        AS location_address
    FROM public.sessions     s
    JOIN public.programs     p ON p.id = s.program_id
    JOIN public.locations    l ON l.id = s.location_id
    WHERE p.organization_id = v_token.org_id
      AND s.status          = 'active'
      AND s.is_hidden        = false
      AND s.enrolled_count   < s.capacity
      -- Skill level filter: if token is level-locked, only show matching sessions
      AND (
        v_token.skill_level IS NULL
        OR p.required_skill_level IS NULL
        OR p.required_skill_level = v_token.skill_level
      )
    ORDER BY s.start_date, s.start_time
    LIMIT 20
  ) row;

  RETURN json_build_object(
    'token_id',    p_token_id,
    'skill_level', v_token.skill_level,
    'fee_cents',   v_token.makeup_fee_cents,
    'sessions',    COALESCE(v_sessions, '[]'::JSON)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_makeup_sessions_for_token(UUID, UUID)
  TO authenticated, service_role;
