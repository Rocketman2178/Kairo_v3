/*
  # Create n8n_chat_histories table for N8N Postgres Chat Memory node

  1. New Tables
    - `n8n_chat_histories`
      - `id` (serial, primary key) - Auto-incrementing message ID
      - `session_id` (text, not null) - Conversation session identifier (maps to conversation_id)
      - `message` (jsonb, not null) - Message content in n8n format: {"type": "human"/"ai", "data": {"content": "..."}}
      - `created_at` (timestamptz) - When message was stored

  2. Indexes
    - Index on session_id for fast message retrieval by conversation
    - Index on session_id + id for ordered retrieval

  3. Security
    - Enable RLS
    - Service role gets full access (n8n connects via service role key)
    - Anonymous users can insert (for frontend conversation saving)
    - Anonymous users can read by session_id

  4. Purpose
    - This is the table n8n's built-in "Postgres Chat Memory" node expects
    - Enables n8n to store and retrieve conversation history automatically
    - Solves the "chat memory not found" error when n8n tries to locate previous messages
*/

CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id serial PRIMARY KEY,
  session_id text NOT NULL,
  message jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session
  ON n8n_chat_histories(session_id);

CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session_id_order
  ON n8n_chat_histories(session_id, id ASC);

ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to n8n_chat_histories"
  ON n8n_chat_histories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read chat histories by session"
  ON n8n_chat_histories FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

CREATE POLICY "Anon can insert chat histories"
  ON n8n_chat_histories FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can read chat histories"
  ON n8n_chat_histories FOR SELECT
  TO authenticated
  USING (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can insert chat histories"
  ON n8n_chat_histories FOR INSERT
  TO authenticated
  WITH CHECK (session_id IS NOT NULL);

COMMENT ON TABLE n8n_chat_histories IS 'Chat memory storage for n8n Postgres Chat Memory node. Stores conversation history per session_id.';
COMMENT ON COLUMN n8n_chat_histories.session_id IS 'Maps to the conversation_id from the conversations table. Used by n8n to group messages by conversation.';
COMMENT ON COLUMN n8n_chat_histories.message IS 'Message in n8n format: {"type": "human"|"ai", "data": {"content": "message text"}}';
