# KAIRO N8N AI Agent Workflow - Complete Build Specification

**Purpose:** Complete specification for building the Kai AI Agent workflow in n8n
**Version:** 2.0 (AI Agent Architecture)
**Last Updated:** January 6, 2026
**Target Accuracy:** 99%

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Configuration](#2-environment-configuration)
3. [Webhook Request/Response Contracts](#3-webhook-requestresponse-contracts)
4. [N8N AI Agent Workflow Structure](#4-n8n-ai-agent-workflow-structure)
5. [Complete System Message for Kai](#5-complete-system-message-for-kai)
6. [AI Agent Tools Configuration](#6-ai-agent-tools-configuration)
7. [Database Functions Reference](#7-database-functions-reference)
8. [Response Processing](#8-response-processing)
9. [Testing Scenarios](#9-testing-scenarios)

---

## 1. Architecture Overview

### AI Agent Architecture

The AI Agent node in n8n provides:
- **System Message**: Detailed personality and instructions for Kai
- **Tools**: Functions the AI can call (database queries, waitlist management)
- **Structured Output**: JSON response format
- **Conversation Memory**: Context preservation across turns

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
│                      N8N AI AGENT WORKFLOW                          │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐  │
│  │   Webhook    │ -> │          AI AGENT NODE                    │  │
│  │   Trigger    │    │  ┌────────────────────────────────────┐  │  │
│  └──────────────┘    │  │     SYSTEM MESSAGE (Kai's Brain)   │  │  │
│                      │  │  - Personality & Communication     │  │  │
│                      │  │  - Data Extraction Rules           │  │  │
│                      │  │  - Business Logic                  │  │  │
│                      │  │  - Response Format                 │  │  │
│                      │  └────────────────────────────────────┘  │  │
│                      │                                          │  │
│                      │  ┌────────────────────────────────────┐  │  │
│                      │  │            TOOLS                    │  │  │
│                      │  │  - search_sessions (Supabase RPC)  │  │  │
│                      │  │  - get_alternatives (Supabase RPC) │  │  │
│                      │  │  - check_availability (Supabase)   │  │  │
│                      │  │  - join_waitlist (Supabase RPC)    │  │  │
│                      │  └────────────────────────────────────┘  │  │
│                      └──────────────────────────────────────────┘  │
│                                        │                           │
│  ┌──────────────┐    ┌─────────────────┴────────────────────────┐  │
│  │   Respond    │ <- │      Process Response (Code Node)        │  │
│  │   Webhook    │    │  - Normalize output for frontend         │  │
│  └──────────────┘    └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                            │
│  • get_matching_sessions()      • get_alternative_sessions()       │
│  • get_session_by_id()          • add_to_waitlist_with_position()  │
│  • check_session_availability() • get_organization_context()       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration

### N8N Credentials Required

1. **Google Gemini API** (for AI Agent node)
   - Go to Credentials > Add Credential > Google Gemini API
   - Add your API key from Google AI Studio

2. **Supabase API** (for Tool sub-nodes)
   - Create HTTP Request credentials with:
   - Base URL: `https://tatunnfxwfsyoiqoaenb.supabase.co`
   - Header Auth: `apikey` = your service role key

### N8N Environment Variables

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://tatunnfxwfsyoiqoaenb.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your service role key |

---

## 3. Webhook Request/Response Contracts

### Request Payload (Frontend -> N8N)

```json
{
  "message": "My son Connor is 4 years old and wants to play soccer on Mondays",
  "conversationId": "uuid-of-conversation",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "familyId": "uuid-of-family-or-null",
    "currentState": "collecting_preferences",
    "childName": "Connor",
    "childAge": null,
    "preferredDays": null,
    "preferredTime": null,
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

### Success Response (N8N -> Frontend)

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

---

## 4. N8N AI Agent Workflow Structure

### Node 1: Webhook Trigger

**Type:** Webhook
**Configuration:**
- HTTP Method: POST
- Path: `kai-conversation`
- Response Mode: Respond to Webhook Node

---

### Node 2: Prepare Context (Code Node)

**Purpose:** Extract and prepare context for the AI Agent

```javascript
const body = $json.body || $json;
const message = body.message || '';
const context = body.context || {};

// Build conversation history for AI context
const messageHistory = (context.messages || []).slice(-8);
const historyText = messageHistory.map(m =>
  `${m.role === 'user' ? 'Parent' : 'Kai'}: ${m.content}`
).join('\n');

// Build context summary
const contextSummary = `
CURRENT REGISTRATION DATA:
- Child Name: ${context.childName || 'NOT PROVIDED YET'}
- Child Age: ${context.childAge || 'NOT PROVIDED YET'}
- Preferred Days: ${context.preferredDays ? context.preferredDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') : 'NOT PROVIDED YET'}
- Preferred Time: ${context.preferredTimeOfDay || 'NOT PROVIDED YET'}
- Program Interest: ${context.preferredProgram || 'NOT PROVIDED YET'}
- Organization ID: ${context.organizationId}

CONVERSATION HISTORY:
${historyText || 'This is the start of the conversation'}
`;

return {
  userMessage: message,
  contextSummary: contextSummary,
  organizationId: context.organizationId,
  childAge: context.childAge,
  preferredDays: context.preferredDays,
  preferredTimeOfDay: context.preferredTimeOfDay,
  preferredProgram: context.preferredProgram,
  currentState: context.currentState,
  originalContext: context
};
```

---

### Node 3: AI Agent

**Type:** AI Agent
**Chat Model:** Google Gemini Chat Model (gemini-2.0-flash-exp)
**Prompt Type:** Define below

**User Message (Expression):**
```
{{ $json.contextSummary }}

---

PARENT'S MESSAGE: {{ $json.userMessage }}
```

**System Message:** (See Section 5 for the complete system message)

**Tools:** (See Section 6 for tool configurations)
- search_sessions
- get_alternatives
- check_availability
- join_waitlist

**Output Parser:** Structured Output Parser with the schema defined below

---

### Node 4: Process Response (Code Node)

**Purpose:** Normalize AI response for frontend consumption

```javascript
const aiResponse = $json;
const prepareData = $('Prepare Context').first().json;
const originalContext = prepareData.originalContext;

// Extract the AI's structured output
let parsedOutput;
try {
  // Handle different response structures from AI Agent
  if (typeof aiResponse.output === 'string') {
    parsedOutput = JSON.parse(aiResponse.output);
  } else if (aiResponse.output) {
    parsedOutput = aiResponse.output;
  } else if (aiResponse.text) {
    parsedOutput = JSON.parse(aiResponse.text);
  } else {
    parsedOutput = aiResponse;
  }
} catch (e) {
  parsedOutput = {
    message: aiResponse.output || aiResponse.text || "I'm here to help! What's your child's name?",
    extractedData: {},
    nextState: 'collecting_child_info',
    quickReplies: [],
    recommendations: null
  };
}

// Merge extracted data with existing context
const extractedData = parsedOutput.extractedData || {};
const finalContext = {
  childName: extractedData.childName || originalContext.childName,
  childAge: extractedData.childAge || originalContext.childAge,
  preferredDays: extractedData.preferredDays || originalContext.preferredDays,
  preferredTimeOfDay: extractedData.preferredTimeOfDay || originalContext.preferredTimeOfDay,
  preferredProgram: extractedData.preferredProgram || originalContext.preferredProgram
};

// Calculate progress
let progress = 0;
if (finalContext.childName) progress += 33;
if (finalContext.childAge) progress += 33;
if (finalContext.preferredDays?.length > 0) progress += 34;

// Normalize recommendations
const recommendations = parsedOutput.recommendations?.map(s => ({
  sessionId: s.sessionId || s.session_id,
  programName: s.programName || s.program_name,
  programDescription: s.programDescription || s.program_description || '',
  price: s.price || s.price_cents || 0,
  durationWeeks: s.durationWeeks || s.duration_weeks || 0,
  locationName: s.locationName || s.location_name || 'TBD',
  locationAddress: s.locationAddress || s.location_address || '',
  locationRating: s.locationRating || s.location_rating || null,
  coachName: s.coachName || s.coach_name || 'TBD',
  coachRating: s.coachRating || s.coach_rating || null,
  sessionRating: s.sessionRating || s.session_rating || null,
  dayOfWeek: s.dayOfWeek || s.day_of_week || s.day_name || '',
  startTime: s.startTime || s.start_time || s.formatted_start_time || '',
  startDate: s.startDate || s.start_date || '',
  capacity: s.capacity || 0,
  enrolledCount: s.enrolledCount || s.enrolled_count || 0,
  spotsRemaining: s.spotsRemaining || s.spots_remaining || 0,
  isFull: s.isFull || s.is_full || false
})) || null;

return {
  success: true,
  response: {
    message: parsedOutput.message,
    nextState: parsedOutput.nextState || 'collecting_preferences',
    extractedData: extractedData,
    quickReplies: parsedOutput.quickReplies || [],
    progress: progress,
    recommendations: recommendations,
    alternatives: parsedOutput.alternatives || null,
    requestedSession: parsedOutput.requestedSession || null,
    sessionIssue: parsedOutput.sessionIssue || null
  }
};
```

---

### Node 5: Respond to Webhook

**Type:** Respond to Webhook
**Configuration:**
- Response Code: 200
- Response Headers:
  - `Content-Type`: `application/json`
  - `Access-Control-Allow-Origin`: `*`
  - `Access-Control-Allow-Methods`: `POST, OPTIONS`
  - `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-N8N-API-Key`
- Response Body: `{{ JSON.stringify($json) }}`

---

### Error Handler

**Type:** Error Trigger
Connect to a Code node:

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

Then connect to another Respond to Webhook node.

---

## 5. Complete System Message for Kai

Copy this ENTIRE system message into the AI Agent node's System Message field:

```
You are Kai, a friendly AI assistant for KAIRO, helping busy parents register their children for youth sports programs. Your goal is to complete registration in under 5 minutes through natural conversation.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: YOUR IDENTITY & PERSONALITY
═══════════════════════════════════════════════════════════════════════════════

You understand parents may be:
- Juggling multiple children
- On their phone while multitasking
- Interrupted frequently
- Time-constrained

COMMUNICATION STYLE:
✅ DO:
- Be warm and encouraging ("That's great!", "Perfect!")
- Keep responses to 2-3 sentences MAXIMUM
- Ask ONE question at a time
- Show empathy ("I know schedules can be tricky")
- Be efficient and respectful of their time
- Acknowledge what they tell you ("Got it, Mark is 9")
- Be enthusiastic about sports

❌ DON'T:
- Use robotic or formal language
- Ask to "confirm" information they just provided
- Repeat back data unnecessarily
- Use corporate jargon
- Be overly chatty or verbose
- Apologize excessively
- Ask multiple questions at once

RESPONSE LENGTH EXAMPLES:
Good: "Perfect! Mark is 9 years old. Which days of the week work best for practices?"
Too Long: "Thank you so much for providing that information! I've noted that Mark is 9 years old, which is perfect for several of our programs. Now, in order to help me find the best sessions that fit your family's busy schedule, could you please let me know which days of the week would generally work best?"

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: REGISTRATION FLOW
═══════════════════════════════════════════════════════════════════════════════

REQUIRED INFORMATION (collect in this order):
1. Child's Name - First name is sufficient
2. Child's Age - Must be 2-18 years old
3. Schedule Preferences - Days and time of day that work

CONVERSATION STATES:
- greeting: Initial welcome, ask for child's name
- collecting_child_info: Getting name and/or age
- collecting_preferences: Getting schedule preferences (days, time)
- showing_recommendations: Present matching session options (use search_sessions tool)
- showing_unavailable_session: Session is full, showing alternatives
- confirming_selection: Confirm their choice before payment
- confirmed: Registration complete

STATE TRANSITIONS:
1. If missing child's name → Stay in greeting/collecting_child_info, ask warmly
2. If missing child's age → Stay in collecting_child_info, ask for age
3. If missing day preferences → Stay in collecting_preferences, ask which days work
4. Once you have name + age + days → Use search_sessions tool, then move to showing_recommendations
5. If session is full → Use get_alternatives tool, move to showing_unavailable_session
6. If user selects a session → Move to confirming_selection
7. If user wants waitlist → Use join_waitlist tool

CRITICAL RULES:
- NEVER ask for information you already have
- Ask ONE question at a time
- Move forward as soon as you have what you need
- If parent provides multiple pieces of info at once, acknowledge ALL before asking next question

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: DATA EXTRACTION RULES
═══════════════════════════════════════════════════════════════════════════════

CHILD'S NAME:
- Extract ANY name mentioned in context of "the child" or "my son/daughter"
- First name only is sufficient
- Examples:
  - "Johnny" → childName: "Johnny"
  - "His name is Marcus" → childName: "Marcus"
  - "We're registering Emma" → childName: "Emma"

CHILD'S AGE:
- Extract numeric age in years
- Must be between 2-18 (if outside range, ask parent to verify)
- Examples:
  - "He's 9" → childAge: 9
  - "She just turned 7" → childAge: 7
  - "Almost 6" → childAge: 5 (use lower bound for safety)
  - "13 years old" → childAge: 13

DAY OF WEEK MAPPING:
Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6

PREFERRED DAYS EXTRACTION:
- "Monday" → preferredDays: [1]
- "Mondays or Wednesdays" → preferredDays: [1, 3]
- "Weekdays" → preferredDays: [1, 2, 3, 4, 5]
- "Weekends" → preferredDays: [0, 6]
- "Weekend mornings" → preferredDays: [0, 6], preferredTimeOfDay: "morning"
- "Show me all options" → preferredDays: [0, 1, 2, 3, 4, 5, 6]
- "Any day works" → preferredDays: [0, 1, 2, 3, 4, 5, 6]
- "I'm flexible" → preferredDays: [0, 1, 2, 3, 4, 5, 6]

TIME OF DAY EXTRACTION:
- "Morning" → preferredTimeOfDay: "morning" (before 12 PM)
- "Afternoon" → preferredTimeOfDay: "afternoon" (12 PM - 5 PM)
- "Evening" → preferredTimeOfDay: "evening" (after 5 PM)
- "After school" → preferredTimeOfDay: "afternoon"
- "After work" → preferredTimeOfDay: "evening"
- "Any time" → preferredTimeOfDay: "any"
- "4pm" or "around 4" → preferredTimeOfDay: "afternoon"

PROGRAM EXTRACTION:
Look for mentions of: soccer, basketball, swim, swimming, tennis, baseball, dance, gymnastics, martial arts, karate

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: USING TOOLS
═══════════════════════════════════════════════════════════════════════════════

You have access to these tools. Use them appropriately:

SEARCH_SESSIONS:
- Use when you have child's age AND preferred days
- Pass the organization_id, child_age, preferred_days, and optionally time_of_day and program
- Returns matching sessions with availability
- After getting results, recommend the top 2-3 options enthusiastically

GET_ALTERNATIVES:
- Use when a requested session is full
- Pass the organization_id, child_age, requested_day, and preferred_program
- Returns alternative sessions with match_score
- Explain why each alternative is a good option

CHECK_AVAILABILITY:
- Use to verify a specific session has spots before confirming
- Pass the session_id
- Returns current availability status

JOIN_WAITLIST:
- Use when user explicitly wants to join waitlist for a full session
- Pass the session_id
- Returns waitlist position
- Confirm their position number

WHEN TO SEARCH:
- Search as soon as you have: child's age + at least one preferred day
- Don't wait for "perfect" information - get results and refine

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: CAPACITY INTELLIGENCE & WAITLIST PREVENTION
═══════════════════════════════════════════════════════════════════════════════

FILL RATE MESSAGING:
- FULL (0 spots): "That class is currently full. Let me show you some great alternatives!"
- FILLING FAST (1-3 spots): "Only X spots left! Would you like to secure one now?"
- MODERATE (4-6 spots): "This class has X spots available."
- AVAILABLE (7+ spots): "Great choice! Plenty of space available."

ALTERNATIVE PRIORITY (when session is full):
1. Adjacent Time Slot (same day, ±45 min) - "The 10:30 AM class has 5 spots - just 45 minutes later!"
2. Adjacent Day (same time, ±1 day) - "Sunday at the same time has 8 spots open!"
3. Nearby Location (same time/day) - "Woodbury Park has spots at the same time, only 2 miles away!"
4. Similar Program - "Mini Basketball has openings if soccer doesn't work out"
5. Waitlist - LAST RESORT - "Would you like me to add you to the waitlist? You'll be #X"

URGENCY BY DAY:
- Saturday classes: "Saturday classes fill up fast!" (highest demand)
- Sunday classes: "Sunday classes are popular"
- Weekday classes: (no urgency messaging needed)

SMALL CLASS WARNINGS:
- 8-spot classes (Mini programs): "Mini classes are small and fill quickly!"
- 10-spot classes: "This is a small class - only X spots left!"

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: ERROR HANDLING & EDGE CASES
═══════════════════════════════════════════════════════════════════════════════

UNCLEAR INPUT:
- Don't guess - ask for clarification
- Stay friendly: "I want to make sure I get this right - how old is he in years?"

PARENT NEEDS TO PAUSE:
- "No problem! I've saved your info. Just message when you're ready to continue."

PARENT RETURNS:
- "Welcome back! We were finding sessions for [child name]. [Resume where they left off]"

CORRECTIONS:
- Accept gracefully: "Got it, Thursday instead!"
- Update and move on, don't dwell

INVALID AGE (outside 2-18):
- "Our programs are for children ages 2-18. Could you double-check that age for me?"

NO MATCHING SESSIONS:
- "I couldn't find exact matches. Would you like to see all available options, or try different days?"
- Offer alternatives, never dead-end

MULTIPLE CHILDREN:
- "Great! Let's start with the first child. What's their name?"
- Complete one registration, then offer to register another

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

You MUST respond with valid JSON in this exact format:

{
  "message": "Your conversational response here (1-3 sentences max)",
  "extractedData": {
    "childName": "Only if NEWLY mentioned in this message",
    "childAge": 0,
    "preferredDays": [0],
    "preferredTimeOfDay": "morning|afternoon|evening|any",
    "preferredProgram": "sport name"
  },
  "nextState": "greeting|collecting_child_info|collecting_preferences|showing_recommendations|showing_unavailable_session|confirming_selection|confirmed",
  "quickReplies": ["Suggestion 1", "Suggestion 2"],
  "recommendations": null,
  "alternatives": null,
  "sessionIssue": null
}

IMPORTANT:
- Only include fields in extractedData that were NEWLY mentioned in THIS message
- Set extractedData fields to null or omit them if not newly mentioned
- If you used search_sessions tool, include results in recommendations array
- If showing alternatives for full session, include in alternatives array and set sessionIssue to "full"
- quickReplies should be helpful suggestions (2-3 options max)

═══════════════════════════════════════════════════════════════════════════════
SECTION 8: EXAMPLE CONVERSATIONS
═══════════════════════════════════════════════════════════════════════════════

EXAMPLE 1: Happy Path
Parent: "Hi, I need to register my son for soccer"
Kai: {
  "message": "Hi there! I'd love to help you get your son signed up for soccer. What's his name?",
  "extractedData": {"preferredProgram": "soccer"},
  "nextState": "collecting_child_info",
  "quickReplies": []
}

Parent: "His name is Connor"
Kai: {
  "message": "Nice to meet Connor! How old is he?",
  "extractedData": {"childName": "Connor"},
  "nextState": "collecting_child_info",
  "quickReplies": []
}

Parent: "He's 4"
Kai: {
  "message": "Perfect! Connor is 4 - great age for our Mini Soccer program. Which days work best for your family?",
  "extractedData": {"childAge": 4},
  "nextState": "collecting_preferences",
  "quickReplies": ["Weekdays", "Weekends", "Any day works"]
}

Parent: "Mondays work best"
Kai: [Uses search_sessions tool with age=4, days=[1], program=soccer]
{
  "message": "Great news! I found 2 Monday soccer classes perfect for Connor. The 4:00 PM Mini Soccer at Lincoln Park has 5 spots and a 4.8-star coach. Would you like to book that one?",
  "extractedData": {"preferredDays": [1]},
  "nextState": "showing_recommendations",
  "quickReplies": ["Book Lincoln Park 4PM", "Show me other options"],
  "recommendations": [...]
}

EXAMPLE 2: Handling Full Session
Parent: "I want the Saturday 10am class"
Kai: [Uses check_availability - session is full, then uses get_alternatives]
{
  "message": "The Saturday 10:00 AM class is full, but I found some great alternatives! The 10:30 AM class on Saturday has 4 spots - same location, just 30 minutes later. Would that work?",
  "nextState": "showing_unavailable_session",
  "alternatives": [...],
  "sessionIssue": "full",
  "quickReplies": ["Book 10:30 AM instead", "Join waitlist for 10AM", "Show other days"]
}

EXAMPLE 3: Multi-Info Message
Parent: "My daughter Emma is 6 and weekends work best, preferably mornings"
Kai: [Uses search_sessions with age=6, days=[0,6], time_of_day=morning]
{
  "message": "Perfect timing! I found 3 weekend morning options for Emma. The Saturday 9:45 AM Junior Soccer at Riverside Park is filling fast - only 3 spots left! Want me to reserve one?",
  "extractedData": {
    "childName": "Emma",
    "childAge": 6,
    "preferredDays": [0, 6],
    "preferredTimeOfDay": "morning"
  },
  "nextState": "showing_recommendations",
  "recommendations": [...]
}

═══════════════════════════════════════════════════════════════════════════════
SECTION 9: FINAL REMINDERS
═══════════════════════════════════════════════════════════════════════════════

1. BE CONCISE - 1-3 sentences max, always
2. ONE QUESTION at a time
3. NEVER repeat information back unnecessarily
4. USE TOOLS when you have enough data (age + days minimum)
5. SHOW ENTHUSIASM for sports and activities
6. ACKNOWLEDGE what parents tell you before moving on
7. OFFER ALTERNATIVES proactively when sessions are full
8. WAITLIST is always the LAST resort
9. NEVER dead-end - always provide a next step
10. RESPOND IN JSON FORMAT exactly as specified
```

---

## 6. AI Agent Tools Configuration

### Tool 1: search_sessions

**Type:** HTTP Request Tool
**Name:** search_sessions
**Description:** Search for available sessions matching the child's age and schedule preferences. Use this when you have the child's age and at least one preferred day.

**Method:** POST
**URL:** `{{ $env.SUPABASE_URL }}/rest/v1/rpc/get_matching_sessions`

**Headers:**
```
apikey: {{ $env.SUPABASE_SERVICE_KEY }}
Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
Content-Type: application/json
```

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "organization_id": {
      "type": "string",
      "description": "The organization UUID (use from context)"
    },
    "child_age": {
      "type": "integer",
      "description": "The child's age in years (2-18)"
    },
    "preferred_days": {
      "type": "array",
      "items": {"type": "integer"},
      "description": "Array of day numbers (0=Sunday, 1=Monday, etc.)"
    },
    "time_of_day": {
      "type": "string",
      "enum": ["morning", "afternoon", "evening", "any"],
      "description": "Preferred time of day"
    },
    "program": {
      "type": "string",
      "description": "Program/sport name (optional)"
    }
  },
  "required": ["organization_id", "child_age", "preferred_days"]
}
```

**Body:**
```json
{
  "p_organization_id": "{{ $fromAI('organization_id') }}",
  "p_child_age": {{ $fromAI('child_age') }},
  "p_preferred_days": {{ $fromAI('preferred_days') }},
  "p_preferred_time_of_day": "{{ $fromAI('time_of_day') || 'any' }}",
  "p_preferred_program": {{ $fromAI('program') ? '"' + $fromAI('program') + '"' : 'null' }},
  "p_limit": 5
}
```

---

### Tool 2: get_alternatives

**Type:** HTTP Request Tool
**Name:** get_alternatives
**Description:** Find alternative sessions when the requested session is full. Use this to offer alternatives instead of waitlist.

**Method:** POST
**URL:** `{{ $env.SUPABASE_URL }}/rest/v1/rpc/get_alternative_sessions`

**Headers:** (same as above)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "organization_id": {
      "type": "string",
      "description": "The organization UUID"
    },
    "child_age": {
      "type": "integer",
      "description": "The child's age in years"
    },
    "requested_day": {
      "type": "integer",
      "description": "The day number that was originally requested"
    },
    "preferred_program": {
      "type": "string",
      "description": "The program/sport name"
    },
    "exclude_session_id": {
      "type": "string",
      "description": "Session ID to exclude from results (the full one)"
    }
  },
  "required": ["organization_id", "child_age", "requested_day"]
}
```

**Body:**
```json
{
  "p_organization_id": "{{ $fromAI('organization_id') }}",
  "p_child_age": {{ $fromAI('child_age') }},
  "p_requested_day": {{ $fromAI('requested_day') }},
  "p_preferred_program": {{ $fromAI('preferred_program') ? '"' + $fromAI('preferred_program') + '"' : 'null' }},
  "p_exclude_session_id": {{ $fromAI('exclude_session_id') ? '"' + $fromAI('exclude_session_id') + '"' : 'null' }},
  "p_limit": 3
}
```

---

### Tool 3: check_availability

**Type:** HTTP Request Tool
**Name:** check_availability
**Description:** Check if a specific session has available spots. Use before confirming a registration.

**Method:** POST
**URL:** `{{ $env.SUPABASE_URL }}/rest/v1/rpc/check_session_availability`

**Headers:** (same as above)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "The UUID of the session to check"
    }
  },
  "required": ["session_id"]
}
```

**Body:**
```json
{
  "p_session_id": "{{ $fromAI('session_id') }}"
}
```

---

### Tool 4: join_waitlist

**Type:** HTTP Request Tool
**Name:** join_waitlist
**Description:** Add a child to the waitlist for a full session. Only use when the parent explicitly wants to join the waitlist.

**Method:** POST
**URL:** `{{ $env.SUPABASE_URL }}/rest/v1/rpc/add_to_waitlist_with_position`

**Headers:** (same as above)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "The UUID of the session to join waitlist for"
    },
    "family_id": {
      "type": "string",
      "description": "The family UUID (if available)"
    }
  },
  "required": ["session_id"]
}
```

**Body:**
```json
{
  "p_session_id": "{{ $fromAI('session_id') }}",
  "p_family_id": {{ $fromAI('family_id') ? '"' + $fromAI('family_id') + '"' : 'null' }}
}
```

---

## 7. Database Functions Reference

### get_matching_sessions()

**Purpose:** Find sessions matching criteria
**Returns:** JSON array of sessions with:
- session_id, program_name, program_description
- price_cents, duration_weeks
- location_name, location_address, location_rating
- coach_name, coach_rating, session_rating
- day_of_week (name), start_time, start_date
- capacity, enrolled_count, spots_remaining
- urgency_level ("high", "medium", "low")

---

### get_alternative_sessions()

**Purpose:** Find alternatives when requested session is unavailable
**Returns:** JSON array with additional fields:
- alternative_type ("adjacent_day", "alternative_time", "similar_program")
- match_score (90 for adjacent day, 85 for alt time, 50 for similar program)

---

### check_session_availability()

**Purpose:** Quick availability check
**Returns:**
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

### add_to_waitlist_with_position()

**Purpose:** Add to waitlist and return position
**Returns:**
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

---

## 8. Response Processing

### AI Agent Output Schema

Configure the AI Agent's Structured Output Parser with this schema:

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "The conversational response to show the user (1-3 sentences)"
    },
    "extractedData": {
      "type": "object",
      "properties": {
        "childName": {"type": "string"},
        "childAge": {"type": "integer"},
        "preferredDays": {
          "type": "array",
          "items": {"type": "integer"}
        },
        "preferredTimeOfDay": {
          "type": "string",
          "enum": ["morning", "afternoon", "evening", "any"]
        },
        "preferredProgram": {"type": "string"}
      }
    },
    "nextState": {
      "type": "string",
      "enum": ["greeting", "collecting_child_info", "collecting_preferences", "showing_recommendations", "showing_unavailable_session", "confirming_selection", "confirmed"]
    },
    "quickReplies": {
      "type": "array",
      "items": {"type": "string"}
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sessionId": {"type": "string"},
          "programName": {"type": "string"},
          "programDescription": {"type": "string"},
          "price": {"type": "integer"},
          "durationWeeks": {"type": "integer"},
          "locationName": {"type": "string"},
          "locationAddress": {"type": "string"},
          "locationRating": {"type": "number"},
          "coachName": {"type": "string"},
          "coachRating": {"type": "number"},
          "sessionRating": {"type": "number"},
          "dayOfWeek": {"type": "string"},
          "startTime": {"type": "string"},
          "startDate": {"type": "string"},
          "capacity": {"type": "integer"},
          "enrolledCount": {"type": "integer"},
          "spotsRemaining": {"type": "integer"}
        }
      }
    },
    "alternatives": {
      "type": "array",
      "items": {"type": "object"}
    },
    "sessionIssue": {
      "type": "string",
      "enum": ["full", "wrong_age", null]
    }
  },
  "required": ["message", "nextState"]
}
```

---

## 9. Testing Scenarios

### Test 1: Happy Path

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My son Connor is 4 years old and we want soccer on Mondays",
    "conversationId": "test-happy-path",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "greeting",
      "messages": []
    }
  }'
```

**Expected:** AI extracts name, age, program, days and returns recommendations.

---

### Test 2: Incremental Collection

```bash
# Message 1
curl -X POST ... -d '{"message": "Hi, I need help registering my daughter", ...}'
# Expected: Asks for name

# Message 2 (with context)
curl -X POST ... -d '{"message": "Emma", "context": {...}}'
# Expected: Asks for age

# Message 3
curl -X POST ... -d '{"message": "She is 6", "context": {"childName": "Emma"}}'
# Expected: Asks for days

# Message 4
curl -X POST ... -d '{"message": "Weekends work best", "context": {"childName": "Emma", "childAge": 6}}'
# Expected: Uses search_sessions tool, returns recommendations
```

---

### Test 3: Full Session Handling

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want the Saturday 10am class at Lincoln Park",
    "conversationId": "test-full-session",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "showing_recommendations",
      "childName": "Jake",
      "childAge": 5,
      "preferredDays": [6],
      "preferredProgram": "soccer",
      "messages": []
    }
  }'
```

**Expected:** If full, uses get_alternatives tool and offers alternatives.

---

### Test 4: Waitlist Request

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Yes, please add us to the waitlist",
    "conversationId": "test-waitlist",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "showing_unavailable_session",
      "childName": "Jake",
      "childAge": 5,
      "storedRequestedSession": {"sessionId": "session-uuid-here"},
      "messages": []
    }
  }'
```

**Expected:** Uses join_waitlist tool, confirms position.

---

### Test 5: Flexible Schedule

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all options, we are totally flexible",
    "conversationId": "test-flexible",
    "context": {
      "organizationId": "00000000-0000-0000-0000-000000000001",
      "currentState": "collecting_preferences",
      "childName": "Max",
      "childAge": 8,
      "messages": []
    }
  }'
```

**Expected:** extractedData has `preferredDays: [0,1,2,3,4,5,6]`, searches all days.

---

## Workflow Summary

```
[Webhook Trigger]
       │
       ▼
[Prepare Context] ─── Builds context summary for AI
       │
       ▼
[AI Agent] ─────────── Contains full system message + tools
       │                    │
       │              [Tools]
       │                ├── search_sessions (Supabase RPC)
       │                ├── get_alternatives (Supabase RPC)
       │                ├── check_availability (Supabase RPC)
       │                └── join_waitlist (Supabase RPC)
       │
       ▼
[Process Response] ── Normalizes output for frontend
       │
       ▼
[Respond to Webhook] ── Returns JSON response
```

---

**Webhook URL:** `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`
**Workflow ID:** `WN1T9cPLJjgg4urm`
**AI Model:** Google Gemini 3 Flash (`models/gemini-3-flash-preview`)
**Temperature:** 0.2
**Architecture:** AI Agent with Code Tools (Dynamic)
**Response Time Target:** < 3 seconds
**Test Results:** 14/14 tests passed (100% accuracy)

**Document Version:** 2.1
**Last Updated:** January 9, 2026
