# Kai Agent Webhook Test Prompts

These test scenarios validate the Kai agent's conversation flow and data retrieval through the n8n webhook. Each scenario contains 4 sequential prompts simulating a real parent interaction.

---

## Scenario 1: Happy Path -- Toddler Mini Soccer Registration

**Goal**: Test the complete registration flow from greeting to session recommendations for a young child.

**Expected data matches**: Mini Soccer program (ages 2-4), Saturday morning sessions at Oakwood Recreation Center (Irvine) and Springfield Community Center (Rancho Santa Margarita).

| Turn | User Prompt | Expected Behavior |
|------|------------|-------------------|
| 1 | "Hi, I'd like to sign up my little one for soccer" | Agent greets and asks for child's name. State: `greeting` -> `collecting_child_info`. Progress: 0%. |
| 2 | "His name is Oliver and he just turned 3" | Agent extracts `childName: "Oliver"`, `childAge: 3`. Asks about schedule preferences. State: `collecting_child_info` -> `collecting_preferences`. Progress: 66%. |
| 3 | "Saturday mornings work best, we live near Irvine" | Agent extracts `preferredDays: [6]`, `preferredTimeOfDay: "morning"`, `preferredLocation: "Irvine"`. Queries sessions and returns Mini Soccer matches. State: `collecting_preferences` -> `showing_recommendations`. Progress: 100%. |
| 4 | "Option 1 looks great, let's go with that" | Agent sets `selectedSessionId` for chosen session and moves to confirmation. State: `showing_recommendations` -> `confirming_selection`. |

**Database sessions that should match (Turn 3)**:
- Mini Soccer, Oakwood Recreation Center (Irvine), Saturday 9:00 AM, 2/8 spots filled
- Mini Soccer, Springfield Community Center (RSM), Saturday 9:00 AM, 6/8 spots filled
- Mini Soccer, Oakwood Recreation Center (Irvine), Saturday 10:30 AM, 7/8 spots filled (filling fast)

**Key validations**:
- Age 3 correctly maps to Mini Soccer (ages 2-4), NOT Junior Soccer (ages 4-7)
- Saturday = day_of_week 6
- Morning filter returns sessions with start_time before 12:00
- Sessions are sorted by availability (least full first)
- Price displayed should be around $208 (20800 cents)

---

## Scenario 2: Full Session -- Waitlist & Alternatives Flow

**Goal**: Test the flow when a parent requests a specific session that is at capacity, triggering the alternatives and waitlist path.

**Expected data matches**: Teen Basketball at Main Sports Complex (Orange), Thursday 6:00 PM is FULL (12/12). Alternatives include Sunday and Saturday sessions at Westside Sports Complex and other locations.

| Turn | User Prompt | Expected Behavior |
|------|------------|-------------------|
| 1 | "I need to register my daughter for basketball" | Agent greets and asks for child's name and age. State: `greeting` -> `collecting_child_info`. |
| 2 | "Her name is Maya, she's 12" | Agent extracts `childName: "Maya"`, `childAge: 12`. Asks about schedule preferences. State: `collecting_child_info` -> `collecting_preferences`. Progress: 66%. |
| 3 | "Thursday evenings at Main Sports Complex please" | Agent extracts `preferredDays: [4]`, `preferredTimeOfDay: "evening"`, `preferredLocation: "Main Sports Complex"`, `preferredProgram: "basketball"`. Finds Teen Basketball Thursday 6PM is FULL. Returns `sessionIssue: "full"` with alternatives. State: `collecting_preferences` -> `showing_unavailable_session`. |
| 4 | "Can I join the waitlist for the Thursday session?" | Agent calls `addToWaitlist()` for the full session. Returns confirmation with waitlist position. State: `showing_unavailable_session` -> `confirmed`. |

**Full session (Turn 3)**:
- Teen Basketball, Main Sports Complex (Orange), Thursday 6:00 PM, 12/12 FULL

**Alternative sessions that should appear**:
- Teen Basketball, Westside Sports Complex (Orange), Sunday 2:00 PM, 2/12 enrolled
- Teen Basketball, Main Sports Complex (Orange), Tuesday 3:30 PM, 0/12 enrolled
- Teen Basketball, Westside Sports Complex (Orange), Saturday 1:00 PM, 2/12 enrolled

**Key validations**:
- Age 12 maps to Teen Basketball (ages 9-14)
- System correctly identifies the Thursday evening session as full
- `sessionIssue` field is set to `"full"`
- Alternatives are scored and ranked (adjacent days, same location preferred)
- Waitlist position is correctly calculated

---

## Scenario 3: Age-Appropriate Matching with Preference Change

**Goal**: Test that the agent correctly matches programs by age, handles mid-conversation preference changes, and finds sessions across multiple days.

**Expected data matches**: Junior Soccer (ages 4-7) sessions on Wednesdays, then Tuesday when the parent changes their mind.

| Turn | User Prompt | Expected Behavior |
|------|------------|-------------------|
| 1 | "Hey there! Looking to get my kid into some activities after school" | Agent greets and asks for child's name. State: `greeting` -> `collecting_child_info`. |
| 2 | "Liam, he's 6. We're interested in soccer" | Agent extracts `childName: "Liam"`, `childAge: 6`, `preferredProgram: "soccer"`. Asks about schedule preferences. State: `collecting_child_info` -> `collecting_preferences`. Progress: 66%. |
| 3 | "Wednesdays after school, so afternoon would be great" | Agent extracts `preferredDays: [3]`, `preferredTimeOfDay: "afternoon"`. Queries for Junior Soccer on Wednesday afternoon. State: `collecting_preferences` -> `showing_recommendations`. Progress: 100%. |
| 4 | "Actually, could we look at Tuesdays instead?" | Agent updates `preferredDays: [2]` (correction). Re-queries for Tuesday afternoon Junior Soccer sessions. State stays at `showing_recommendations` with new results. |

**Sessions that should match (Turn 3 - Wednesday afternoon)**:
- Junior Soccer, Main Sports Complex (Orange), Wednesday 5:00 PM, 2/12 enrolled

**Sessions that should match (Turn 4 - Tuesday afternoon)**:
- Junior Soccer, North Field Location (Fullerton), Tuesday 3:00 PM, 8/12 enrolled (moderate)

**Key validations**:
- Age 6 maps to Junior Soccer (ages 4-7), NOT Classic Soccer (ages 4-8) or Mini Soccer (ages 2-4)
- "After school" is interpreted as afternoon (12:00-17:00)
- Wednesday = day_of_week 3, Tuesday = day_of_week 2
- Agent handles mid-conversation preference correction gracefully
- Previously extracted data (name, age, program) is preserved when day changes

---

## Scenario 4: Swimming Program with Location-Specific Search

**Goal**: Test a non-soccer program search, location filtering, and the "filling fast" urgency messaging.

**Expected data matches**: Learn to Swim (ages 4-9), various sessions. Tests that the system handles non-soccer programs and surfaces urgency for nearly-full sessions.

| Turn | User Prompt | Expected Behavior |
|------|------------|-------------------|
| 1 | "Hi, I want to sign my daughter up for swimming lessons" | Agent greets and asks for child's name. State: `greeting` -> `collecting_child_info`. |
| 2 | "She's Emma, 7 years old" | Agent extracts `childName: "Emma"`, `childAge: 7`, `preferredProgram: "swimming"`. Asks about schedule preferences. State: `collecting_child_info` -> `collecting_preferences`. Progress: 66%. |
| 3 | "We'd prefer mornings during the week, somewhere in Orange" | Agent extracts `preferredDays: [1,2,3,4,5]`, `preferredTimeOfDay: "morning"`, `preferredLocation: "Orange"`. Queries for swimming sessions. State: `collecting_preferences` -> `showing_recommendations`. Progress: 100%. |
| 4 | "What about the Friday one at Oakwood in Irvine instead?" | Agent updates `preferredLocation: "Irvine"`, `preferredDays: [5]`. Finds Learn to Swim at Oakwood Friday 9:30 AM is FULL (8/8). Returns `sessionIssue: "full"` with alternatives. State: `showing_recommendations` -> `showing_unavailable_session`. |

**Sessions that should match (Turn 3 - weekday mornings in Orange)**:
- Learn to Swim, Westside Sports Complex (Orange), Tuesday 9:00 AM, 2/8 enrolled
- Learn to Swim, East Park Athletic Fields (Orange), Wednesday 11:00 AM, 4/8 enrolled

**Full session (Turn 4)**:
- Learn to Swim, Oakwood Recreation Center (Irvine), Friday 9:30 AM, 8/8 FULL

**Key validations**:
- "Swimming" maps to Learn to Swim (ages 4-9) for a 7-year-old, NOT Intermediate Swimming (ages 8-13)
- "During the week" is interpreted as Monday-Friday (days 1-5)
- Morning filter applies correctly (start_time before 12:00)
- Location filter narrows to Orange-area locations
- When user asks about a specific full session, system correctly identifies it and offers alternatives
- Urgency messaging is appropriate for full sessions

---

## Webhook Payload Reference

Each prompt is sent to the n8n webhook with this payload structure:

```json
{
  "message": "<user prompt text>",
  "conversationId": "<uuid>",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "familyId": null,
    "tempChildId": null,
    "tempFamilyId": null,
    "isAuthenticated": false,
    "currentState": "<current conversation state>",
    "childName": "<extracted or null>",
    "childAge": "<extracted or null>",
    "preferredDays": "<extracted array or null>",
    "preferredTime": "<extracted or null>",
    "preferredTimeOfDay": "<extracted or null>",
    "preferredProgram": "<extracted or null>",
    "preferredLocation": "<extracted or null>",
    "selectedSessionId": "<selected or null>",
    "storedAlternatives": [],
    "storedRequestedSession": null,
    "messages": [
      { "role": "user", "content": "previous message" },
      { "role": "assistant", "content": "previous response" }
    ]
  }
}
```

## Expected Response Structure

The n8n webhook should return:

```json
{
  "success": true,
  "response": {
    "message": "<conversational AI response>",
    "nextState": "<next conversation state>",
    "extractedData": {
      "childName": "Oliver",
      "childAge": 3,
      "preferredDays": [6],
      "preferredTimeOfDay": "morning",
      "preferredProgram": "soccer",
      "preferredLocation": "Irvine"
    },
    "quickReplies": ["Option 1", "Option 2", "Show me other options"],
    "progress": 100,
    "recommendations": [
      {
        "sessionId": "<uuid>",
        "programName": "Mini Soccer",
        "price": 20800,
        "durationWeeks": 8,
        "locationName": "Oakwood Recreation Center",
        "locationAddress": "789 Oak Street, Springfield, IL 62703",
        "coachName": "Coach Mike",
        "coachRating": 4.9,
        "dayOfWeek": "Saturday",
        "startTime": "09:00",
        "startDate": "2027-01-19",
        "capacity": 8,
        "enrolledCount": 6,
        "spotsRemaining": 2,
        "isFull": false
      }
    ],
    "alternatives": null,
    "requestedSession": null,
    "sessionIssue": null
  }
}
```

## State Progression Reference

| State | Triggers Transition To |
|-------|----------------------|
| `greeting` | `collecting_child_info` (after initial message) |
| `collecting_child_info` | `collecting_preferences` (after name + age collected) |
| `collecting_preferences` | `showing_recommendations` (after days/time collected) |
| `collecting_preferences` | `showing_unavailable_session` (if requested session is full/unavailable) |
| `showing_recommendations` | `confirming_selection` (after user picks a session) |
| `showing_unavailable_session` | `confirmed` (after waitlist signup) |
| `showing_unavailable_session` | `showing_recommendations` (after viewing alternatives) |
| `confirming_selection` | `collecting_payment` (after confirmation) |
