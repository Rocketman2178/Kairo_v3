/*
  # Add helper functions for kairo_chat

  1. Functions
    - `get_conversation_history(conv_id, message_limit)` - Get recent messages for a conversation
    - `get_conversation_context(conv_id)` - Get full context including extracted preferences

  2. Views
    - `v_conversation_history` - Formatted view of chat messages for N8N

  3. Purpose
    - Provides easy-to-use functions for N8N to retrieve chat history
    - Replaces Window Buffer Memory with reliable database queries
*/

CREATE OR REPLACE FUNCTION get_conversation_history(
  p_conversation_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  message_id uuid,
  role text,
  content text,
  extracted_data jsonb,
  conversation_state text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    id as message_id,
    role,
    content,
    extracted_data,
    conversation_state,
    created_at
  FROM kairo_chat
  WHERE conversation_id = p_conversation_id
  ORDER BY created_at ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION get_conversation_context(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_context jsonb;
  v_messages jsonb;
  v_extracted jsonb := '{}'::jsonb;
  v_last_state text;
  v_temp_family_id uuid;
  v_temp_child_id uuid;
  v_organization_id uuid;
BEGIN
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'role', role,
        'content', content
      ) ORDER BY created_at ASC
    ),
    (
      SELECT extracted_data 
      FROM kairo_chat 
      WHERE conversation_id = p_conversation_id 
        AND extracted_data != '{}'::jsonb
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    (
      SELECT conversation_state 
      FROM kairo_chat 
      WHERE conversation_id = p_conversation_id 
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    (SELECT temp_family_id FROM kairo_chat WHERE conversation_id = p_conversation_id LIMIT 1),
    (SELECT temp_child_id FROM kairo_chat WHERE conversation_id = p_conversation_id LIMIT 1),
    (SELECT organization_id FROM kairo_chat WHERE conversation_id = p_conversation_id LIMIT 1)
  INTO v_messages, v_extracted, v_last_state, v_temp_family_id, v_temp_child_id, v_organization_id
  FROM kairo_chat
  WHERE conversation_id = p_conversation_id;

  v_context := jsonb_build_object(
    'conversationId', p_conversation_id,
    'organizationId', COALESCE(v_organization_id, '00000000-0000-0000-0000-000000000001'::uuid),
    'tempFamilyId', v_temp_family_id,
    'tempChildId', v_temp_child_id,
    'currentState', COALESCE(v_last_state, 'greeting'),
    'messages', COALESCE(v_messages, '[]'::jsonb),
    'extractedData', COALESCE(v_extracted, '{}'::jsonb),
    'childName', v_extracted->>'childName',
    'childAge', (v_extracted->>'childAge')::integer,
    'preferredDays', v_extracted->'preferredDays',
    'preferredTime', v_extracted->>'preferredTime',
    'preferredTimeOfDay', v_extracted->>'preferredTimeOfDay',
    'preferredProgram', v_extracted->>'preferredProgram'
  );

  RETURN v_context;
END;
$$;

CREATE OR REPLACE VIEW v_conversation_history AS
SELECT 
  kc.id,
  kc.conversation_id,
  kc.organization_id,
  kc.role,
  kc.content,
  kc.extracted_data,
  kc.metadata,
  kc.conversation_state,
  kc.created_at,
  c.family_id,
  c.channel
FROM kairo_chat kc
JOIN conversations c ON c.id = kc.conversation_id
ORDER BY kc.created_at ASC;

COMMENT ON FUNCTION get_conversation_history IS 'Retrieves recent chat messages for a conversation. Use p_limit to control how many messages to return (default 20).';
COMMENT ON FUNCTION get_conversation_context IS 'Returns full conversation context including messages and extracted preferences as JSON. Use this in N8N instead of Window Buffer Memory.';
COMMENT ON VIEW v_conversation_history IS 'Formatted view of chat messages joined with conversation data. Use for N8N queries.';