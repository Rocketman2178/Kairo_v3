# N8N Workflow Quick Start Guide

**Purpose:** Step-by-step guide to build the Kai AI conversation workflow in n8n
**Last Updated:** December 10, 2025
**Prerequisite:** Access to your n8n instance at healthrocket.app.n8n.cloud

---

## Step 1: Configure Environment Variables

Before building the workflow, add these environment variables in n8n:

1. Go to **Settings** > **Variables** (or Environment in some versions)
2. Add the following:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://tatunnfxwfsyoiqoaenb.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key (from Supabase Dashboard > Settings > API) |
| `GEMINI_API_KEY` | Your Gemini API key |

---

## Step 2: Create New Workflow

1. Click **Add Workflow**
2. Name it: `Kai Conversation Handler`
3. Add a description: `AI-powered registration conversation for Kairo platform`

---

## Step 3: Add Webhook Trigger

1. Add node: **Webhook**
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `kai-conversation`
   - **Authentication:** None (or Header Auth if you want to use API key)
   - **Response Mode:** Respond to Webhook Node

The webhook URL will be: `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`

---

## Step 4: Add Pattern Extraction (Code Node)

1. Add node: **Code**
2. Name: `Pattern Extraction`
3. Language: JavaScript
4. Paste this code:

```javascript
const body = $json.body || $json;
const message = (body.message || '').toLowerCase();
const context = body.context || {};

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
  'weekend': [0,6]
};

// Time extraction
const timePatterns = {
  'morning': 'morning',
  'afternoon': 'afternoon',
  'evening': 'evening',
  'after school': 'afternoon',
  'after work': 'evening'
};

// Program extraction
const programs = ['soccer', 'basketball', 'swim', 'tennis', 'baseball', 'dance', 'gymnastics', 'martial arts'];

// Extract data
const extractedData = {};

// Age
const ageMatch = message.match(/(\d+)\s*(years?\s*old|yo|y\/o)/i) ||
                 message.match(/age\s*(\d+)/i) ||
                 message.match(/is\s*(\d+)/i);
if (ageMatch) extractedData.childAge = parseInt(ageMatch[1]);

// Name
const nameMatch = message.match(/(?:named?|called?|son|daughter)\s+([A-Z][a-z]+)/i);
if (nameMatch) extractedData.childName = nameMatch[1];

// Days
for (const [pattern, value] of Object.entries(dayPatterns)) {
  if (message.includes(pattern)) {
    extractedData.preferredDays = Array.isArray(value) ? value : [value];
    break;
  }
}

// Time
for (const [pattern, value] of Object.entries(timePatterns)) {
  if (message.includes(pattern)) {
    extractedData.preferredTimeOfDay = value;
    break;
  }
}

// Program
for (const program of programs) {
  if (message.includes(program)) {
    extractedData.preferredProgram = program;
    break;
  }
}

// Merge with existing context
const mergedContext = {
  organizationId: context.organizationId,
  familyId: context.familyId,
  currentState: context.currentState,
  childName: extractedData.childName || context.childName,
  childAge: extractedData.childAge || context.childAge,
  preferredDays: extractedData.preferredDays || context.preferredDays,
  preferredTimeOfDay: extractedData.preferredTimeOfDay || context.preferredTimeOfDay,
  preferredProgram: extractedData.preferredProgram || context.preferredProgram
};

return {
  originalMessage: body.message,
  conversationId: body.conversationId,
  context: context,
  extractedData,
  mergedContext,
  // Pass through for later nodes
  hasAge: !!mergedContext.childAge,
  hasDays: !!(mergedContext.preferredDays && mergedContext.preferredDays.length > 0)
};
```

---

## Step 5: Add Supabase Query (HTTP Request)

1. Add node: **HTTP Request**
2. Name: `Query Sessions`
3. Configure:
   - **Method:** POST
   - **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/rpc/get_matching_sessions`
   - **Authentication:** None
   - **Headers:**
     - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`
     - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`
     - `Content-Type`: `application/json`
   - **Body (JSON):**

```json
{
  "p_organization_id": "{{ $json.mergedContext.organizationId }}",
  "p_child_age": {{ $json.mergedContext.childAge || 'null' }},
  "p_preferred_days": {{ $json.mergedContext.preferredDays ? JSON.stringify($json.mergedContext.preferredDays) : 'null' }},
  "p_preferred_time_of_day": {{ $json.mergedContext.preferredTimeOfDay ? '"' + $json.mergedContext.preferredTimeOfDay + '"' : 'null' }},
  "p_preferred_program": {{ $json.mergedContext.preferredProgram ? '"' + $json.mergedContext.preferredProgram + '"' : 'null' }},
  "p_limit": 5
}
```

**Important:** Enable "Continue on Error" so the workflow continues even if no sessions are found.

---

## Step 6: Add Build Prompt (Code Node)

1. Add node: **Code**
2. Name: `Build Prompt`
3. Paste this code:

```javascript
const patternData = $('Pattern Extraction').first().json;
const context = patternData.mergedContext;
const messageHistory = patternData.context.messages || [];
const sessions = $json || [];
const originalMessage = patternData.originalMessage;

// Build conversation history
const historyText = messageHistory.slice(-6).map(m =>
  `${m.role === 'user' ? 'Parent' : 'Kai'}: ${m.content}`
).join('\n');

// Build sessions text
let sessionsText = '';
if (Array.isArray(sessions) && sessions.length > 0) {
  sessionsText = '\n\n## AVAILABLE SESSIONS FROM DATABASE:\n' +
    sessions.map((s, i) =>
      `${i+1}. ${s.program_name} - ${s.day_of_week} at ${s.start_time} @ ${s.location_name} (${s.spots_remaining} spots left, $${Math.round(s.price_cents/100)})`
    ).join('\n');
}

const systemPrompt = `You are Kai, a friendly AI assistant helping parents register their children for youth sports programs.

## Your Personality
- Warm, conversational, and helpful
- Keep responses SHORT (1-3 sentences max)
- Ask ONE question at a time
- Be enthusiastic about sports and activities

## Current Registration Data
- Child Name: ${context.childName || 'Not provided yet'}
- Child Age: ${context.childAge || 'Not provided yet'}
- Preferred Days: ${context.preferredDays ? context.preferredDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') : 'Not provided yet'}
- Preferred Time: ${context.preferredTimeOfDay || 'Not provided yet'}
- Program Interest: ${context.preferredProgram || 'Not provided yet'}
${sessionsText}

## Conversation History
${historyText || 'No history yet - this is the start of the conversation'}

## Your Task
Respond to the parent's message naturally.
- If you need more info (name, age, or day preference), ask for it warmly
- If sessions are available, recommend them with enthusiasm
- Keep it conversational and brief

## Response Format (JSON only, no markdown)
{
  "message": "Your conversational response here",
  "extractedData": {
    "childName": "only include if newly mentioned in this message",
    "childAge": "only include if newly mentioned",
    "preferredDays": "only include array if newly mentioned",
    "preferredTimeOfDay": "morning|afternoon|evening - only if mentioned",
    "preferredProgram": "sport name - only if mentioned"
  },
  "nextState": "greeting|collecting_child_info|collecting_preferences|showing_recommendations|confirming_selection",
  "quickReplies": ["helpful suggestion 1", "helpful suggestion 2"]
}

IMPORTANT:
- Day numbers: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
- Only include fields in extractedData that were NEWLY mentioned in this message
- If sessions are available (listed above), transition to showing_recommendations`;

return {
  systemPrompt,
  userMessage: originalMessage,
  sessions: Array.isArray(sessions) ? sessions : [],
  context,
  patternData
};
```

---

## Step 7: Add Gemini API Call (HTTP Request)

1. Add node: **HTTP Request**
2. Name: `Call Gemini`
3. Configure:
   - **Method:** POST
   - **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{ $env.GEMINI_API_KEY }}`
   - **Headers:**
     - `Content-Type`: `application/json`
   - **Body (JSON):**

```json
{
  "system_instruction": {
    "parts": [{ "text": "{{ $json.systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n') }}" }]
  },
  "contents": [{
    "role": "user",
    "parts": [{ "text": "{{ $json.userMessage }}" }]
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

**Note:** The `responseMimeType: "application/json"` tells Gemini to return valid JSON.

---

## Step 8: Add Process Response (Code Node)

1. Add node: **Code**
2. Name: `Process Response`
3. Paste this code:

```javascript
const geminiResponse = $json.candidates?.[0]?.content?.parts?.[0]?.text;
const buildPromptData = $('Build Prompt').first().json;
const sessions = buildPromptData.sessions || [];
const context = buildPromptData.context;

let parsedResponse;
try {
  // Try to parse the JSON response
  parsedResponse = JSON.parse(geminiResponse);
} catch (e) {
  // If parsing fails, use the raw text as the message
  parsedResponse = {
    message: geminiResponse || "I'm here to help! What would you like to know about our programs?",
    extractedData: {},
    nextState: 'collecting_preferences',
    quickReplies: []
  };
}

// Calculate progress based on what we know
let progress = 0;
const merged = { ...context, ...(parsedResponse.extractedData || {}) };
if (merged.childName) progress += 33;
if (merged.childAge) progress += 33;
if (merged.preferredDays?.length > 0) progress += 34;

// Format recommendations for frontend
const recommendations = sessions.map(s => ({
  sessionId: s.session_id,
  programName: s.program_name,
  programDescription: s.program_description || '',
  price: s.price_cents || 0,
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

// Build final response
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

---

## Step 9: Add Respond to Webhook

1. Add node: **Respond to Webhook**
2. Configure:
   - **Response Code:** 200
   - **Response Headers:**
     - `Content-Type`: `application/json`
     - `Access-Control-Allow-Origin`: `*`
   - **Response Body:** `{{ JSON.stringify($json) }}`

---

## Step 10: Connect the Nodes

Connect in this order:
```
Webhook -> Pattern Extraction -> Query Sessions -> Build Prompt -> Call Gemini -> Process Response -> Respond to Webhook
```

---

## Step 11: Add Error Handling

1. Add an **Error Trigger** node
2. Connect it to a **Code** node with:

```javascript
return {
  success: false,
  error: {
    code: 'AI_UNAVAILABLE',
    message: "I'm having trouble right now. Let me show you a form to continue.",
    fallbackToForm: true
  }
};
```

3. Connect that to a **Respond to Webhook** node configured the same as Step 9.

---

## Step 12: Activate and Test

1. **Activate** the workflow (toggle in top right)
2. Note the webhook URL shown
3. Test with curl:

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, I want to sign my son up for soccer",
    "conversationId": "test-123",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "greeting",
      "messages": []
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "message": "Hi there! I'd love to help you get your son signed up for soccer. What's his name?",
    "nextState": "collecting_child_info",
    "extractedData": {},
    "quickReplies": [],
    "progress": 0,
    "recommendations": null
  }
}
```

---

## Testing Different Scenarios

### Test 2: With child info
```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My son Connor is 4 years old and we like Monday afternoons",
    "conversationId": "test-123",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "collecting_child_info",
      "messages": []
    }
  }'
```

This should return sessions in the `recommendations` array.

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Empty sessions array | Check that child age is provided |
| Gemini errors | Verify API key is correct in n8n variables |
| Supabase errors | Check service key has RPC permissions |
| CORS errors | Ensure `Access-Control-Allow-Origin: *` header |
| JSON parse errors | Check Gemini is using `responseMimeType: application/json` |

### Debug Tips

- Use n8n's execution log to see each step's input/output
- Click on the "Query Sessions" node output to see if sessions were found
- Check the "Call Gemini" raw response if AI responses seem wrong
- Enable "Always save execution data" in workflow settings for debugging

---

## Database Functions Available

Your Supabase database has these RPC functions ready for n8n:

| Function | Use Case |
|----------|----------|
| `get_matching_sessions` | Find sessions by age/day/program |
| `get_alternative_sessions` | Find alternatives when session full |
| `get_session_by_id` | Get full details for one session |
| `check_session_availability` | Quick spot check before payment |
| `add_to_waitlist_with_position` | Add to waitlist |

---

## Next Steps

Once the basic workflow is working:

1. **Add session selection handling** - Detect when user selects a session
2. **Add waitlist flow** - Handle "join waitlist" requests
3. **Add alternatives flow** - Show alternatives when sessions are full
4. **Add payment initiation** - Prepare for Stripe integration

See `N8N_INTEGRATION.md` for complete implementation details.

---

**Webhook URL:** `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`
**Gemini Model:** `gemini-2.0-flash-exp`
**Last Updated:** December 10, 2025
