# N8N Integration Architecture

**Purpose:** Primary AI Intelligence Layer for Kairo Registration Platform
**Last Updated:** December 10, 2025
**Architecture:** N8N Webhook as Central AI Orchestrator

---

## Overview

Kairo uses N8N as the **primary AI intelligence layer** for all conversational registration flows. The n8n workflow receives user messages, queries the Supabase database, builds AI prompts with context, calls Gemini, and returns structured responses.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐   │
│  │ ChatInterface│ -> │ useConversation │ -> │ n8nWebhook.ts    │   │
│  │  Component   │    │     Hook        │    │   Service        │   │
│  └──────────────┘    └─────────────────┘    └────────┬─────────┘   │
└──────────────────────────────────────────────────────┼─────────────┘
                                                       │ HTTP POST
                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         N8N WORKFLOW                                 │
│  ┌──────────────┐                                                   │
│  │   Webhook    │  <- POST /webhook/kai-conversation                │
│  │   Trigger    │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Pattern    │ -> │   Supabase   │ -> │   Build AI   │          │
│  │  Extraction  │    │   Queries    │    │    Prompt    │          │
│  └──────────────┘    └──────────────┘    └──────┬───────┘          │
│                                                  │                  │
│                                                  ▼                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Return     │ <- │   Process    │ <- │   Gemini     │          │
│  │   Response   │    │   Response   │    │   API Call   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    DATABASE VIEWS                             │   │
│  │  • available_sessions_view     (pre-joined session data)     │   │
│  │  • session_recommendations_view (with ratings)               │   │
│  │  • full_session_details_view   (complete session info)       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  DATABASE FUNCTIONS                           │   │
│  │  • get_matching_sessions()      (find sessions by criteria)  │   │
│  │  • get_alternative_sessions()   (find alternatives)          │   │
│  │  • get_session_by_id()          (get session details)        │   │
│  │  • add_to_waitlist_with_position() (waitlist management)     │   │
│  │  • check_session_availability() (quick availability check)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Benefits of N8N Architecture

- **Visual Workflow Management**: See and modify entire conversation flow visually
- **No Code Deployments**: Update AI prompts and logic without deploying
- **Centralized AI Logic**: All intelligence in one manageable location
- **Better Debugging**: Visual execution logs and step-by-step tracing
- **Easy Integration**: Add new services (Twilio, SendGrid) with drag-and-drop
- **Flexibility**: Route to different AI models based on conversation state

---

## Environment Configuration

### Frontend (.env)

```env
# Supabase Configuration
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co

# N8N Webhook Configuration (Required)
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/kai-conversation
VITE_N8N_WEBHOOK_KEY=optional_api_key_for_auth
```

### N8N Environment Variables

```env
# Supabase (for database queries)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## Webhook Request/Response Format

### Request Payload

The frontend sends this payload to the n8n webhook:

```json
{
  "message": "My son Connor is 4 years old and wants to play soccer on Mondays",
  "conversationId": "uuid-of-conversation",
  "context": {
    "organizationId": "uuid-of-organization",
    "familyId": "uuid-of-family-or-null",
    "currentState": "collecting_preferences",
    "childName": "Connor",
    "childAge": null,
    "preferredDays": null,
    "preferredTimeOfDay": null,
    "preferredProgram": null,
    "preferredLocation": null,
    "selectedSessionId": null,
    "storedAlternatives": [],
    "storedRequestedSession": null,
    "messages": [
      { "role": "assistant", "content": "Hi! I'm Kai..." },
      { "role": "user", "content": "Hi, I need to register my son" }
    ]
  }
}
```

### Response Payload

The n8n webhook should return:

```json
{
  "success": true,
  "response": {
    "message": "Great! Connor is 4 and wants Monday soccer. Let me find classes for him!",
    "nextState": "showing_recommendations",
    "extractedData": {
      "childName": "Connor",
      "childAge": 4,
      "preferredDays": [1],
      "preferredProgram": "soccer"
    },
    "quickReplies": ["Show all options", "Different day"],
    "progress": 66,
    "recommendations": [
      {
        "sessionId": "uuid",
        "programName": "Mini Soccer",
        "programDescription": "Fun soccer for ages 3-5",
        "price": 16900,
        "durationWeeks": 8,
        "locationName": "Central Park Field",
        "locationAddress": "123 Park Ave",
        "locationRating": 4.5,
        "coachName": "Coach Mike",
        "coachRating": 4.8,
        "sessionRating": 4.6,
        "dayOfWeek": "Monday",
        "startTime": "4:00 PM",
        "startDate": "2025-01-15",
        "capacity": 12,
        "enrolledCount": 8,
        "spotsRemaining": 4
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "I'm having trouble right now. Let me show you a form to continue.",
    "fallbackToForm": true
  }
}
```

---

## N8N Workflow Implementation Guide

### Node 1: Webhook Trigger

**Type:** Webhook
**Method:** POST
**Path:** /webhook/kai-conversation
**Authentication:** Header Auth (optional - X-N8N-API-Key)

**Output:** Raw request body with message, conversationId, context

### Node 2: Pattern Extraction (Code Node)

Extract patterns from the user's message:

```javascript
const message = $json.message.toLowerCase();
const context = $json.context;

// Day extraction
const dayPatterns = {
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6,
  'sunday': 0, 'sun': 0,
  'weekday': [1,2,3,4,5],
  'weekend': [0,6],
  'any day': [0,1,2,3,4,5,6]
};

// Time extraction
const timePatterns = {
  'morning': 'morning',
  'afternoon': 'afternoon',
  'evening': 'evening',
  'night': 'evening',
  'after school': 'afternoon',
  'after work': 'evening'
};

// Program extraction
const programPatterns = ['soccer', 'basketball', 'swim', 'tennis', 'baseball', 'art', 'dance', 'gymnastics'];

// Age extraction
const ageMatch = message.match(/(\d+)\s*(years?\s*old|yo|y\/o)/i) ||
                 message.match(/age\s*(\d+)/i) ||
                 message.match(/is\s*(\d+)/i);

// Name extraction
const nameMatch = message.match(/(?:named?|called?|is|son|daughter)\s+([A-Z][a-z]+)/i);

// Build extracted data
const extractedData = {};

if (ageMatch) extractedData.childAge = parseInt(ageMatch[1]);
if (nameMatch) extractedData.childName = nameMatch[1];

for (const [pattern, value] of Object.entries(dayPatterns)) {
  if (message.includes(pattern)) {
    extractedData.preferredDays = Array.isArray(value) ? value : [value];
    break;
  }
}

for (const [pattern, value] of Object.entries(timePatterns)) {
  if (message.includes(pattern)) {
    extractedData.preferredTimeOfDay = value;
    break;
  }
}

for (const program of programPatterns) {
  if (message.includes(program)) {
    extractedData.preferredProgram = program;
    break;
  }
}

return {
  message: $json.message,
  conversationId: $json.conversationId,
  context: $json.context,
  extractedData,
  mergedContext: { ...context, ...extractedData }
};
```

### Node 3: Supabase Query Sessions (HTTP Request)

**Condition:** Only run if we have childAge and preferredDays

**URL:** `{{$env.SUPABASE_URL}}/rest/v1/rpc/get_matching_sessions`
**Method:** POST
**Headers:**
- `apikey`: `{{$env.SUPABASE_SERVICE_KEY}}`
- `Authorization`: `Bearer {{$env.SUPABASE_SERVICE_KEY}}`
- `Content-Type`: `application/json`

**Body:**
```json
{
  "p_organization_id": "{{$node['Webhook'].json.context.organizationId}}",
  "p_child_age": {{$node['Pattern Extraction'].json.mergedContext.childAge}},
  "p_preferred_days": {{$node['Pattern Extraction'].json.mergedContext.preferredDays}},
  "p_preferred_time_of_day": "{{$node['Pattern Extraction'].json.mergedContext.preferredTimeOfDay}}",
  "p_preferred_program": "{{$node['Pattern Extraction'].json.mergedContext.preferredProgram}}",
  "p_limit": 5
}
```

### Node 4: Build System Prompt (Code Node)

```javascript
const context = $node['Pattern Extraction'].json.mergedContext;
const messageHistory = $json.context.messages || [];
const sessions = $node['Supabase Query'].json || [];

// Build conversation history text
const historyText = messageHistory.map(m =>
  `${m.role === 'user' ? 'Parent' : 'Kai'}: ${m.content}`
).join('\n');

// Build available sessions text
let sessionsText = '';
if (sessions.length > 0) {
  sessionsText = '\n\n## AVAILABLE SESSIONS (from database):\n' +
    sessions.map((s, i) =>
      `${i+1}. ${s.program_name} - ${s.day_of_week} at ${s.start_time} @ ${s.location_name} (${s.spots_remaining} spots, $${s.price/100})`
    ).join('\n');
}

const systemPrompt = `You are Kai, a friendly AI assistant helping parents register their children for youth sports programs.

## Your Personality
- Warm, conversational, and helpful
- Never robotic or overly formal
- Keep responses SHORT (1-3 sentences max)
- Ask ONE question at a time
- Use parent's language naturally

## Current Registration Data
- Child Name: ${context.childName || 'Not provided yet'}
- Child Age: ${context.childAge || 'Not provided yet'}
- Preferred Days: ${context.preferredDays ? context.preferredDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') : 'Not provided yet'}
- Preferred Time: ${context.preferredTimeOfDay || 'Not provided yet'}
- Preferred Program: ${context.preferredProgram || 'Not provided yet'}
${sessionsText}

## Conversation History
${historyText}

## Your Response (JSON format)
{
  "message": "Your conversational response here",
  "extractedData": {
    "childName": "only if newly mentioned",
    "childAge": only_if_newly_mentioned,
    "preferredDays": [array_if_newly_mentioned],
    "preferredTimeOfDay": "morning|afternoon|evening|any",
    "preferredProgram": "sport_name"
  },
  "nextState": "greeting|collecting_child_info|collecting_preferences|showing_recommendations|confirming_selection|confirmed",
  "quickReplies": ["suggestion 1", "suggestion 2"]
}

## Day Numbers: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6

## Guidelines
1. If missing child name, ask for it warmly
2. If missing age, ask for it after getting name
3. If missing day/program, ask about preferences
4. Once you have name + age + day, you can show recommendations
5. NEVER ask about information already provided
6. If sessions are available, recommend them enthusiastically
7. If no sessions match, suggest alternatives or different days`;

return {
  systemPrompt,
  userMessage: $node['Webhook'].json.message,
  sessions: sessions
};
```

### Node 5: Call Gemini API (HTTP Request)

**URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{$env.GEMINI_API_KEY}}`
**Method:** POST
**Headers:**
- `Content-Type`: `application/json`

**Body:**
```json
{
  "system_instruction": {
    "parts": [{ "text": "{{$node['Build Prompt'].json.systemPrompt}}" }]
  },
  "contents": [{
    "role": "user",
    "parts": [{ "text": "{{$node['Build Prompt'].json.userMessage}}" }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 1024,
    "responseMimeType": "application/json"
  }
}
```

### Node 6: Process Response (Code Node)

```javascript
const geminiResponse = $json.candidates?.[0]?.content?.parts?.[0]?.text;
const sessions = $node['Build Prompt'].json.sessions || [];
const existingContext = $node['Pattern Extraction'].json.mergedContext;

let parsedResponse;
try {
  parsedResponse = JSON.parse(geminiResponse);
} catch (e) {
  parsedResponse = {
    message: geminiResponse || "I'm here to help! What would you like to know?",
    extractedData: {},
    nextState: 'collecting_preferences',
    quickReplies: []
  };
}

// Merge extracted data
const finalExtractedData = {
  ...existingContext,
  ...(parsedResponse.extractedData || {})
};

// Calculate progress
let progress = 0;
if (finalExtractedData.childName) progress += 33;
if (finalExtractedData.childAge) progress += 33;
if (finalExtractedData.preferredDays?.length > 0) progress += 34;

// Format recommendations
const recommendations = sessions.map(s => ({
  sessionId: s.session_id,
  programName: s.program_name,
  programDescription: s.program_description || '',
  price: s.price_cents || s.price || 0,
  durationWeeks: s.duration_weeks || 0,
  locationName: s.location_name || 'TBD',
  locationAddress: s.location_address || '',
  locationRating: s.location_rating || null,
  coachName: s.coach_name || 'TBD',
  coachRating: s.coach_rating || null,
  sessionRating: s.session_rating || null,
  dayOfWeek: s.day_of_week || s.day_name,
  startTime: s.start_time || s.formatted_start_time,
  startDate: s.start_date,
  capacity: s.capacity,
  enrolledCount: s.enrolled_count,
  spotsRemaining: s.spots_remaining
}));

return {
  success: true,
  response: {
    message: parsedResponse.message,
    nextState: parsedResponse.nextState || 'collecting_preferences',
    extractedData: parsedResponse.extractedData || {},
    quickReplies: parsedResponse.quickReplies || [],
    progress: progress,
    recommendations: recommendations.length > 0 ? recommendations : null
  }
};
```

### Node 7: Return Response (Respond to Webhook)

**Response Code:** 200
**Response Headers:**
- `Content-Type`: `application/json`
- `Access-Control-Allow-Origin`: `*`

**Response Body:** `{{$json}}`

---

## Database Functions Reference

### get_matching_sessions()

Finds sessions matching criteria. Call via Supabase RPC.

```sql
SELECT * FROM get_matching_sessions(
  'organization-uuid',  -- p_organization_id
  4,                    -- p_child_age
  ARRAY[1,2,3],        -- p_preferred_days (Mon, Tue, Wed)
  'afternoon',          -- p_preferred_time_of_day
  'soccer',             -- p_preferred_program
  5                     -- p_limit
);
```

### get_alternative_sessions()

Finds alternatives when requested session is unavailable.

```sql
SELECT * FROM get_alternative_sessions(
  'organization-uuid',  -- p_organization_id
  4,                    -- p_child_age
  1,                    -- p_requested_day (Monday)
  'soccer',             -- p_preferred_program
  'afternoon',          -- p_preferred_time_of_day
  'exclude-session-id', -- p_exclude_session_id
  3                     -- p_limit
);
```

### add_to_waitlist_with_position()

Adds to waitlist and returns position.

```sql
SELECT * FROM add_to_waitlist_with_position(
  'session-uuid',  -- p_session_id
  'child-uuid',    -- p_child_id (optional)
  'family-uuid'    -- p_family_id (optional)
);
```

Returns:
```json
{
  "success": true,
  "waitlistId": "uuid",
  "position": 3,
  "programName": "Mini Soccer",
  "dayOfWeek": "Monday",
  "startTime": "4:00 PM"
}
```

### check_session_availability()

Quick availability check before payment.

```sql
SELECT * FROM check_session_availability('session-uuid');
```

Returns:
```json
{
  "available": true,
  "spotsRemaining": 4,
  "isFull": false,
  "waitlistCount": 2,
  "status": "active"
}
```

---

## Handling Special Cases

### Waitlist Request

When user says "join waitlist":

1. Detect "join waitlist" or "add to waitlist" in message
2. Get session ID from context (storedRequestedSession.sessionId)
3. Call `add_to_waitlist_with_position()` function
4. Return confirmation message with position

### View Alternatives

When user clicks "View alternatives":

1. Detect "view alternatives" message
2. Return stored alternatives from context.storedAlternatives
3. No AI call needed - just return the data

### Session Selection

When user selects a specific session:

1. Check for selectedSessionId in context
2. Call `get_session_by_id()` to get full details
3. Return confirmation message with session details
4. Set nextState to "confirming_selection"

---

## Error Handling

### Gemini API Errors

```javascript
try {
  const response = await callGemini(prompt);
  return processResponse(response);
} catch (error) {
  return {
    success: false,
    error: {
      code: 'AI_UNAVAILABLE',
      message: "I'm having trouble understanding. Let me show you the options directly.",
      fallbackToForm: true
    }
  };
}
```

### Database Errors

```javascript
if (!sessions || sessions.length === 0) {
  return {
    success: true,
    response: {
      message: "I couldn't find exact matches, but let me show you all available options.",
      nextState: 'showing_recommendations',
      recommendations: [],
      quickReplies: ['Show all programs', 'Try different days']
    }
  };
}
```

### Timeout Handling

Set n8n workflow timeout to 25 seconds. Frontend has 30 second timeout.

---

## Testing

### Test with curl

```bash
curl -X POST https://your-n8n-instance.com/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-Key: your-optional-key" \
  -d '{
    "message": "My son Connor is 4 and wants to play soccer on Mondays",
    "conversationId": "test-123",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "greeting",
      "messages": []
    }
  }'
```

### Expected Response

```json
{
  "success": true,
  "response": {
    "message": "Great! Let me find Monday soccer classes for Connor (age 4). Here are the best options!",
    "nextState": "showing_recommendations",
    "extractedData": {
      "childName": "Connor",
      "childAge": 4,
      "preferredDays": [1],
      "preferredProgram": "soccer"
    },
    "quickReplies": ["Different day", "Show all options"],
    "progress": 100,
    "recommendations": [...]
  }
}
```

---

## Monitoring

### N8N Execution Monitoring

- Check execution logs in n8n UI
- Monitor average execution time (target: < 3 seconds)
- Alert on failed executions
- Review AI responses periodically for quality

### Frontend Console Logs

The frontend logs all n8n communication:

```
=== SENDING TO N8N WEBHOOK ===
N8N Configured: true
Message: My son Connor is 4
Context: { ... }
==============================

=== N8N WEBHOOK RESPONSE ===
Success: true
Next State: collecting_preferences
Extracted Data: { childName: "Connor", childAge: 4 }
============================
```

---

## Migration Notes

This architecture replaces the previous Supabase Edge Function approach. Key changes:

1. **Removed**: Direct Gemini calls from Edge Functions
2. **Added**: n8nWebhook.ts service in frontend
3. **Added**: Database views and functions for n8n queries
4. **Updated**: useConversation hook to use n8n
5. **Updated**: Environment variables for n8n configuration

The kai-conversation Edge Function is no longer the primary AI handler. All AI intelligence now flows through n8n.

---

**Document Owner:** Development Team
**Last Updated:** December 10, 2025
