/*
  # Create kairo_chat table for conversation history

  1. New Tables
    - `kairo_chat`
      - `id` (uuid, primary key) - Unique message identifier
      - `conversation_id` (uuid, FK) - Links to conversations table
      - `organization_id` (uuid) - Multi-tenant support
      - `family_id` (uuid, nullable) - For authenticated users
      - `temp_family_id` (uuid, nullable) - For anonymous users
      - `temp_child_id` (uuid, nullable) - For anonymous users
      - `role` (text) - Message author: 'user', 'assistant', 'system'
      - `content` (text) - The message content
      - `extracted_data` (jsonb) - Data extracted by AI (child_name, age, preferences)
      - `metadata` (jsonb) - Additional data (quick_replies, recommendations, session_issue)
      - `conversation_state` (text) - State at time of message
      - `created_at` (timestamptz) - When message was created

  2. Indexes
    - Index on conversation_id for fast message retrieval
    - Index on organization_id + created_at for analytics
    - Index on temp_family_id for anonymous user lookups

  3. Security
    - Enable RLS
    - Policies for authenticated users to access their own messages
    - Policies for service role to manage all messages (for N8N)

  4. Purpose
    - Replaces N8N Window Buffer Memory tool
    - Provides reliable, queryable chat history
    - Prevents AI hallucinations from faulty memory tools
    - Enables conversation analytics
*/

CREATE TABLE IF NOT EXISTS kairo_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  temp_family_id uuid,
  temp_child_id uuid,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  conversation_state text DEFAULT 'greeting',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kairo_chat_conversation_id ON kairo_chat(conversation_id);
CREATE INDEX IF NOT EXISTS idx_kairo_chat_org_created ON kairo_chat(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kairo_chat_temp_family ON kairo_chat(temp_family_id) WHERE temp_family_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kairo_chat_family ON kairo_chat(family_id) WHERE family_id IS NOT NULL;

ALTER TABLE kairo_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages"
  ON kairo_chat FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own chat messages"
  ON kairo_chat FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view chat by temp_family_id"
  ON kairo_chat FOR SELECT
  TO anon
  USING (temp_family_id IS NOT NULL);

CREATE POLICY "Anonymous users can insert chat messages"
  ON kairo_chat FOR INSERT
  TO anon
  WITH CHECK (temp_family_id IS NOT NULL);

CREATE POLICY "Service role has full access to kairo_chat"
  ON kairo_chat FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE kairo_chat IS 'Stores individual chat messages for conversation history. Used by N8N agent for context instead of Window Buffer Memory.';
COMMENT ON COLUMN kairo_chat.extracted_data IS 'AI-extracted data: {childName, childAge, preferredDays, preferredTime, preferredProgram}';
COMMENT ON COLUMN kairo_chat.metadata IS 'Message metadata: {quickReplies, recommendations, sessionIssue, requestedSession}';