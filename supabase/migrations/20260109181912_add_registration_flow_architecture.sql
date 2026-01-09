/*
  # Add Registration Flow Architecture

  ## Summary
  This migration enables the anonymous-to-registered user conversion flow,
  allowing users to chat with Kai and reserve sessions before creating an account.

  ## 1. Schema Changes to `registrations` Table
    - `temp_child_id` (uuid) - Temporary ID for anonymous child
    - `temp_family_id` (uuid) - Temporary ID for anonymous family
    - `registration_token` (text, unique) - Token for linking anonymous → registered
    - `child_name` (text) - Pre-collected from chat
    - `child_age` (integer) - Pre-collected from chat
    - `expires_at` (timestamptz) - Auto-expire pending registrations
    - `confirmed_at` (timestamptz) - When registration was confirmed
    - `payment_intent_id` (text) - Stripe payment intent ID
    - Make `child_id` and `family_id` nullable for anonymous users

  ## 2. New Status Values
    - `pending_registration` - Created by AI, awaiting user to complete form
    - `awaiting_payment` - User submitted form, payment processing

  ## 3. Database Functions Created
    - `create_pending_registration()` - Create pending registration from chat
    - `get_pending_registration()` - Retrieve by token for registration form
    - `confirm_registration()` - Finalize after payment
    - `cleanup_expired_registrations()` - Clean up expired pending registrations

  ## 4. Security
    - New indexes for token lookups and expired cleanup
    - Rate limiting logic in create_pending_registration

  ## Important Notes
    - This enables the full anonymous → registered user flow
    - Pending registrations expire after 24 hours by default
    - Rate limited to 5 pending registrations per temp_family_id per hour
*/

-- Step 1: Add new columns to registrations table
DO $$
BEGIN
  -- Add temp_child_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'temp_child_id'
  ) THEN
    ALTER TABLE registrations ADD COLUMN temp_child_id UUID;
  END IF;

  -- Add temp_family_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'temp_family_id'
  ) THEN
    ALTER TABLE registrations ADD COLUMN temp_family_id UUID;
  END IF;

  -- Add registration_token
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'registration_token'
  ) THEN
    ALTER TABLE registrations ADD COLUMN registration_token TEXT UNIQUE;
  END IF;

  -- Add child_name (pre-collected from chat)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'child_name'
  ) THEN
    ALTER TABLE registrations ADD COLUMN child_name TEXT;
  END IF;

  -- Add child_age (pre-collected from chat)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'child_age'
  ) THEN
    ALTER TABLE registrations ADD COLUMN child_age INTEGER;
  END IF;

  -- Add expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE registrations ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- Add confirmed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE registrations ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;

  -- Add payment_intent_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE registrations ADD COLUMN payment_intent_id TEXT;
  END IF;
END $$;

-- Step 2: Make child_id and family_id nullable (for anonymous users)
ALTER TABLE registrations ALTER COLUMN child_id DROP NOT NULL;
ALTER TABLE registrations ALTER COLUMN family_id DROP NOT NULL;

-- Step 3: Update status constraint to include new statuses
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE registrations ADD CONSTRAINT valid_status 
  CHECK (status IN ('pending', 'pending_registration', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'));

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_token 
  ON registrations(registration_token) 
  WHERE registration_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_expires 
  ON registrations(expires_at) 
  WHERE status = 'pending_registration';

CREATE INDEX IF NOT EXISTS idx_registrations_temp_family 
  ON registrations(temp_family_id) 
  WHERE temp_family_id IS NOT NULL;

-- Step 5: Create database functions

-- Function: create_pending_registration
-- Creates a pending registration when user requests to sign up via chat
CREATE OR REPLACE FUNCTION create_pending_registration(
  p_session_id UUID,
  p_temp_child_id UUID,
  p_temp_family_id UUID,
  p_child_name TEXT,
  p_child_age INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_registration_token TEXT;
  v_registration_id UUID;
  v_session RECORD;
  v_pending_count INTEGER;
BEGIN
  -- Rate limiting: Check for too many pending registrations
  SELECT COUNT(*) INTO v_pending_count
  FROM registrations
  WHERE temp_family_id = p_temp_family_id
    AND status = 'pending_registration'
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_pending_count >= 5 THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Too many pending registrations. Please complete existing registrations first.'
    );
  END IF;

  -- Generate unique token (32 hex characters)
  v_registration_token := encode(gen_random_bytes(16), 'hex');

  -- Get session details for price
  SELECT s.*, p.price_cents as program_price
  INTO v_session 
  FROM sessions s
  JOIN programs p ON s.program_id = p.id
  WHERE s.id = p_session_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Session not found'
    );
  END IF;

  -- Check if session has available spots
  IF v_session.enrolled_count >= v_session.capacity THEN
    RETURN json_build_object(
      'error', true,
      'message', 'This session is full. Please choose an alternative or join the waitlist.'
    );
  END IF;

  -- Create pending registration
  INSERT INTO registrations (
    session_id,
    temp_child_id,
    temp_family_id,
    child_name,
    child_age,
    status,
    payment_status,
    registration_token,
    expires_at,
    amount_cents,
    registration_channel
  ) VALUES (
    p_session_id,
    p_temp_child_id,
    p_temp_family_id,
    p_child_name,
    p_child_age,
    'pending_registration',
    'pending',
    v_registration_token,
    NOW() + INTERVAL '24 hours',
    v_session.program_price,
    'web'
  )
  RETURNING id INTO v_registration_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'registration_token', v_registration_token,
    'expires_at', NOW() + INTERVAL '24 hours',
    'amount_cents', v_session.program_price,
    'redirect_url', '/register?token=' || v_registration_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_pending_registration
-- Retrieves pending registration details for the registration form
CREATE OR REPLACE FUNCTION get_pending_registration(
  p_registration_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_registration RECORD;
  v_session RECORD;
BEGIN
  -- Get registration
  SELECT * INTO v_registration
  FROM registrations
  WHERE registration_token = p_registration_token
    AND status = 'pending_registration'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Registration not found or expired'
    );
  END IF;

  -- Get session details
  SELECT 
    s.id,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.start_date,
    s.capacity,
    s.enrolled_count,
    p.name as program_name,
    p.description as program_description,
    l.name as location_name,
    l.address as location_address
  INTO v_session
  FROM sessions s
  JOIN programs p ON s.program_id = p.id
  LEFT JOIN locations l ON s.location_id = l.id
  WHERE s.id = v_registration.session_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration.id,
    'child_name', v_registration.child_name,
    'child_age', v_registration.child_age,
    'session', json_build_object(
      'id', v_session.id,
      'program_name', v_session.program_name,
      'program_description', v_session.program_description,
      'day_of_week', v_session.day_of_week,
      'start_time', v_session.start_time,
      'end_time', v_session.end_time,
      'start_date', v_session.start_date,
      'location_name', v_session.location_name,
      'location_address', v_session.location_address,
      'capacity', v_session.capacity,
      'enrolled_count', v_session.enrolled_count
    ),
    'amount_cents', v_registration.amount_cents,
    'expires_at', v_registration.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: confirm_registration
-- Called after successful payment to finalize registration
CREATE OR REPLACE FUNCTION confirm_registration(
  p_registration_token TEXT,
  p_family_id UUID,
  p_child_id UUID,
  p_payment_intent_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_registration RECORD;
  v_session RECORD;
BEGIN
  -- Get and lock registration
  SELECT * INTO v_registration
  FROM registrations
  WHERE registration_token = p_registration_token
    AND status IN ('pending_registration', 'awaiting_payment')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', true,
      'message', 'Registration not found or already confirmed'
    );
  END IF;

  -- Get session and verify it's not full
  SELECT * INTO v_session
  FROM sessions
  WHERE id = v_registration.session_id
  FOR UPDATE;

  IF v_session.enrolled_count >= v_session.capacity THEN
    -- Session became full while user was registering
    RETURN json_build_object(
      'error', true,
      'message', 'Sorry, this session is now full. Your payment will be refunded.'
    );
  END IF;

  -- Update registration with real IDs and confirm
  UPDATE registrations SET
    family_id = p_family_id,
    child_id = p_child_id,
    payment_intent_id = p_payment_intent_id,
    status = 'confirmed',
    payment_status = 'paid',
    confirmed_at = NOW(),
    enrolled_at = NOW()
  WHERE id = v_registration.id;

  -- Increment session enrolled count
  UPDATE sessions SET
    enrolled_count = enrolled_count + 1
  WHERE id = v_registration.session_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration.id,
    'status', 'confirmed',
    'message', 'Registration confirmed! Welcome to the program.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: cleanup_expired_registrations
-- Cron job function to expire old pending registrations
CREATE OR REPLACE FUNCTION cleanup_expired_registrations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE registrations
  SET status = 'cancelled'
  WHERE status = 'pending_registration'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_pending_registration(UUID, UUID, UUID, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pending_registration(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_registration(TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_registrations() TO service_role;