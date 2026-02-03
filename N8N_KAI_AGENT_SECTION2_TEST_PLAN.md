# N8N Kairo Intelligence Agent - Section 2 Test Plan

**Production Workflow | Soccer Shots Demo Organization | Extended Coverage**

---

## Overview

Comprehensive test plan for validating the N8N Kairo Intelligence Agent (Section 2 implementation) with 80+ test cases combining baseline functionality validation with extended edge cases and robustness testing.

- **Status:** Production Workflow
- **Test Organization:** Soccer Shots Demo (ID: `00000000-0000-0000-0000-000000000001`)
- **N8N Webhook URL:** `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`
- **Workflow ID:** `WN1T9cPLJjgg4urm`
- **Baseline Tests:** 14 existing tests (all must pass)
- **New Test Cases:** 60+ edge cases and extended scenarios
- **Expected Total Pass Rate:** 100%

---

## 1. Pre-Test Environment Setup & Validation

### 1.1 Connectivity Verification

- [ ] N8N webhook endpoint accessible via curl
- [ ] Test with simple request to verify connectivity
- [ ] Response includes expected structure (success, response, error fields)
- [ ] Network latency documented (<100ms to endpoint)

### 1.2 Environment Variable Validation

Required variables:
- [ ] `VITE_N8N_WEBHOOK_URL` = `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`
- [ ] `VITE_SUPABASE_URL` = `tatunnfxwfsyoiqoaenb.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` configured with proper permissions
- [ ] All variables loaded in Claude Code desktop

### 1.3 Test Organization Validation

Soccer Shots Demo Organization:
- [ ] Organization ID: `00000000-0000-0000-0000-000000000001` exists
- [ ] Two test locations available:
  - Lincoln Park (50 capacity)
  - Riverside Park (40 capacity)
- [ ] Three test programs available:
  - Mini Soccer
  - Junior Soccer
  - Premier Soccer

### 1.4 Database Connectivity

- [ ] Supabase connection verified
- [ ] `kairo_chat` table exists with proper schema
- [ ] `conversations` table ready for test data
- [ ] All 5 RPC functions deployed and callable:
  - `search_sessions()`
  - `get_alternatives()`
  - `check_availability()`
  - `join_waitlist()`
  - Additional helper functions

### 1.5 Test Infrastructure Setup

- [ ] Claude Code desktop open with dev tools ready
- [ ] Network tab enabled for webhook monitoring
- [ ] Console tab open for error detection
- [ ] Text editor prepared for test documentation
- [ ] UUID generator ready for conversation IDs
- [ ] Test data backup created (if needed)

---

## 2. Foundation Tests - Baseline Functionality (14 Existing Tests)

### Test Group A: Basic Functionality (3 Tests)

#### Test 2.1: Happy Path - Complete Conversation in Single Message

**Test ID:** `T2.1`

**Prompt:**
```
My son Connor is 4 years old and we want soccer on Mondays
```

**Initial State:**
```json
{
  "conversationId": "test-happy-path-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "greeting",
    "messages": []
  }
}
```

**Expected Behavior:**
- AI extracts: name (Connor), age (4), program (soccer), days ([1])
- Calls `search_sessions()` tool
- Returns 1-3 session recommendations
- Response time: <500ms
- nextState = "showing_recommendations"

**Verification Points:**
- [ ] Name extracted correctly as "Connor"
- [ ] Age extracted as 4 (within 2-18 range)
- [ ] Program preference = "soccer"
- [ ] Preferred days = [1] (Monday)
- [ ] Recommendations array populated
- [ ] Database entry created in kairo_chat

**Pass Criteria:**
All verification points met, response time <500ms

---

#### Test 2.2: Incremental Collection - Multi-Turn Data Gathering

**Test ID:** `T2.2`

**Turn 1:**
```json
{
  "message": "Hi, I need help registering my daughter",
  "conversationId": "test-incremental-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "greeting",
    "messages": []
  }
}
```

**Expected Response:** Asks for child's name

**Turn 2:**
```json
{
  "message": "Emma",
  "conversationId": "test-incremental-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "collecting_child_info",
    "messages": [
      {"role": "user", "content": "Hi, I need help registering my daughter"},
      {"role": "assistant", "content": "What's your daughter's name?"}
    ]
  }
}
```

**Expected Response:** Confirms name, asks for age

**Turn 3:**
```json
{
  "message": "She is 6",
  "conversationId": "test-incremental-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "childName": "Emma",
    "currentState": "collecting_child_info",
    "messages": [
      {"role": "user", "content": "Hi, I need help registering my daughter"},
      {"role": "assistant", "content": "What's your daughter's name?"},
      {"role": "user", "content": "Emma"},
      {"role": "assistant", "content": "Nice to meet Emma! How old is she?"}
    ]
  }
}
```

**Expected Response:** Confirms age, asks for schedule preferences

**Turn 4:**
```json
{
  "message": "Weekends work best",
  "conversationId": "test-incremental-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "childName": "Emma",
    "childAge": 6,
    "currentState": "collecting_preferences",
    "messages": [
      {"role": "user", "content": "Hi, I need help registering my daughter"},
      {"role": "assistant", "content": "What's your daughter's name?"},
      {"role": "user", "content": "Emma"},
      {"role": "assistant", "content": "Nice to meet Emma! How old is she?"},
      {"role": "user", "content": "She is 6"},
      {"role": "assistant", "content": "Perfect! Emma is 6. What days work best for her schedule?"}
    ]
  }
}
```

**Expected Response:** Calls search_sessions, returns recommendations

**Verification Points:**
- [ ] Context preserved across 4 turns
- [ ] extractedData evolves: Turn 1 (empty) → T2 (name) → T3 (name+age) → T4 (name+age+days)
- [ ] All 4 messages stored in kairo_chat
- [ ] State transitions: greeting → collecting_child_info → collecting_child_info → collecting_preferences → showing_recommendations
- [ ] Final recommendations include weekend sessions

**Pass Criteria:**
All turns complete successfully, context preserved, correct state progression

---

#### Test 2.3: Flexible Schedule Handling

**Test ID:** `T2.3`

**Prompt:**
```
Show me all options, we are totally flexible
```

**Initial State:**
```json
{
  "conversationId": "test-flexible-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "collecting_preferences",
    "childName": "Max",
    "childAge": 8,
    "messages": []
  }
}
```

**Expected Behavior:**
- Extracts preference: all 7 days available
- preferredDays = [0, 1, 2, 3, 4, 5, 6]
- Calls search_sessions with full week filter
- Returns recommendations across all days

**Verification Points:**
- [ ] preferredDays array = [0, 1, 2, 3, 4, 5, 6]
- [ ] Recommendations include sessions from multiple days
- [ ] At least one Sunday session (day 0)
- [ ] At least one Saturday session (day 6)
- [ ] At least one weekday session (days 1-5)

**Pass Criteria:**
preferredDays covers all 7 days, recommendations span entire week

---

### Test Group B: Complex Scenarios (5 Tests)

#### Test 2.4: Full Session Detection & Alternatives

**Test ID:** `T2.4`

**Prompt:**
```
I want the Saturday 10am class at Lincoln Park
```

**Initial State:**
```json
{
  "conversationId": "test-full-session-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "showing_recommendations",
    "childName": "Jake",
    "childAge": 5,
    "preferredDays": [6],
    "preferredProgram": "soccer",
    "messages": []
  }
}
```

**Setup:**
- Session "Saturday 10am at Lincoln Park" must be full in test data (capacity = enrolled_count)

**Expected Behavior:**
- Detects session is full
- Calls `get_alternatives()` tool
- Returns 2-3 alternative sessions
- nextState = "showing_unavailable_session"

**Verification Points:**
- [ ] Original session identified correctly
- [ ] get_alternatives tool called
- [ ] Alternatives returned with reduced match scores
- [ ] nextState = "showing_unavailable_session"
- [ ] AI message explains unavailability and presents alternatives
- [ ] Each alternative includes clear day/time/location

**Pass Criteria:**
Alternatives provided, nextState correct, user can see available options

---

#### Test 2.5: Waitlist Join Request

**Test ID:** `T2.5`

**Prompt:**
```
Yes, please add us to the waitlist
```

**Initial State:**
```json
{
  "conversationId": "test-waitlist-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "showing_unavailable_session",
    "childName": "Jake",
    "childAge": 5,
    "storedRequestedSession": {
      "sessionId": "full-session-uuid",
      "programName": "Soccer",
      "locationName": "Lincoln Park"
    },
    "messages": []
  }
}
```

**Expected Behavior:**
- Calls `join_waitlist()` tool
- Returns waitlist position (e.g., "You're 2nd on the waitlist")
- Confirms enrollment in waitlist
- nextState = "confirmed"

**Verification Points:**
- [ ] join_waitlist tool called with correct session ID
- [ ] Waitlist entry created in database
- [ ] Position returned in response
- [ ] Message confirms waitlist enrollment
- [ ] User receives confirmation with position number

**Pass Criteria:**
Waitlist entry created, position returned, user confirmation provided

---

#### Test 2.6: Age Boundary Validation

**Test ID:** `T2.6`

**Test 2.6a: Minimum Valid Age (2 years old)**

**Prompt:**
```
My child is 2 years old
```

**Expected:** Accepts age, continues normally

**Verification:**
- [ ] childAge = 2
- [ ] No validation error
- [ ] Continues to next question

**Test 2.6b: Maximum Valid Age (18 years old)**

**Prompt:**
```
My child is 18 years old
```

**Expected:** Accepts age, continues normally

**Verification:**
- [ ] childAge = 18
- [ ] No validation error
- [ ] Continues to next question

**Test 2.6c: Below Minimum (1 year old)**

**Prompt:**
```
My baby is 1 year old
```

**Expected:** Explains minimum age, asks for correct age

**Verification:**
- [ ] childAge NOT extracted or marked invalid
- [ ] Message explains minimum age requirement
- [ ] Asks user to provide correct age
- [ ] Remains in collecting_child_info state

**Test 2.6d: Above Maximum (19 years old)**

**Prompt:**
```
My teen is 19 years old
```

**Expected:** Explains maximum age, asks for correct age

**Verification:**
- [ ] childAge NOT extracted or marked invalid
- [ ] Message explains maximum age limit
- [ ] Asks user to provide correct age
- [ ] Remains in collecting_child_info state

**Pass Criteria:**
All 4 sub-tests pass, age boundaries enforced correctly

---

#### Test 2.7: Program Intent Recognition (Multiple Phrasings)

**Test ID:** `T2.7`

**Test 2.7a: Direct Program Name**

**Prompt:**
```
We want basketball
```

**Expected:** preferredProgram = "basketball"

**Verification:**
- [ ] Program recognized and extracted

**Test 2.7b: Program as Noun**

**Prompt:**
```
Looking for swimming classes
```

**Expected:** preferredProgram = "swimming"

**Verification:**
- [ ] Program recognized from context

**Test 2.7c: Program as Question**

**Prompt:**
```
Is there gymnastics available?
```

**Expected:** preferredProgram = "gymnastics"

**Verification:**
- [ ] Program recognized despite question format

**Pass Criteria:**
All 3 phrasings correctly extract program preference

---

#### Test 2.8: Day of Week Mapping Validation

**Test ID:** `T2.8`

**Test 2.8a: Specific Weekdays**

**Prompt:**
```
Monday and Wednesday please
```

**Expected:** preferredDays = [1, 3]

**Verification:**
- [ ] Monday = 1
- [ ] Wednesday = 3
- [ ] Both days present in array

**Test 2.8b: Time + Weekdays (Weekday Evenings)**

**Prompt:**
```
Weekday evenings only
```

**Expected:**
- preferredDays = [1, 2, 3, 4, 5]
- preferredTimeOfDay = "evening"

**Verification:**
- [ ] All 5 weekdays present
- [ ] Time of day = "evening"
- [ ] Weekend days (0, 6) excluded

**Test 2.8c: Weekend Mornings**

**Prompt:**
```
Saturday or Sunday mornings
```

**Expected:**
- preferredDays = [0, 6]
- preferredTimeOfDay = "morning"

**Verification:**
- [ ] Only weekend days (0, 6)
- [ ] Time of day = "morning"
- [ ] No weekday sessions

**Pass Criteria:**
All 3 day/time combinations map correctly

---

### Test Group C: Edge Cases (2 Tests)

#### Test 2.9: Conflicting/Changing Preferences

**Test ID:** `T2.9`

**Prompt Sequence:**
```
1. Monday soccer
2. Wait, Tuesday soccer
3. Actually, any weekday works
```

**Expected Behavior:**
- AI adapts smoothly to each change
- Final response reflects latest preference (any weekday)
- extractedData = weekday preference [1,2,3,4,5]

**Verification Points:**
- [ ] Each message processed independently
- [ ] No confusion from intermediate preferences
- [ ] Final state correct (weekday preference)
- [ ] No error states or failed transitions

**Pass Criteria:**
Conversation flows smoothly despite preference changes, final intent correct

---

#### Test 2.10: Multiple Children Request

**Test ID:** `T2.10`

**Prompt:**
```
I have two kids - Jake is 5 and wants soccer, Emma is 7 and wants gymnastics
```

**Expected Behavior:**
- AI recognizes multi-child scenario
- Asks clarifying question (which child registering now, or register both separately)
- Suggests single-child registration flow

**Verification Points:**
- [ ] Both children recognized
- [ ] Multiple preferences acknowledged
- [ ] AI seeks clarification
- [ ] Appropriate follow-up question provided

**Pass Criteria:**
Multi-child scenario handled appropriately, conversation continues logically

---

### Test Group D: Registration Flow (4 Tests)

#### Test 2.11: Session Selection & Confirmation

**Test ID:** `T2.11`

**Prompt:**
```
I like the first option
```

**Initial State:**
```json
{
  "conversationId": "test-selection-001",
  "context": {
    "organizationId": "00000000-0000-0000-0000-000000000001",
    "currentState": "showing_recommendations",
    "childName": "Sarah",
    "childAge": 7,
    "messages": []
  }
}
```

**Expected Behavior:**
- Confirms selection of first recommendation
- Transitions to confirming_selection state
- Prepares registration data

**Verification Points:**
- [ ] Session identified (first in list)
- [ ] nextState = "confirming_selection"
- [ ] requestedSession populated with selected session data
- [ ] Confirmation message displayed

**Pass Criteria:**
Selection acknowledged, state transitioned correctly

---

#### Test 2.12: Context Preservation Across Page Reload

**Test ID:** `T2.12`

**Procedure:**
1. Complete 3 turns of conversation:
   - Turn 1: "Hi, registering my son"
   - Turn 2: "His name is Marcus"
   - Turn 3: "He's 8 years old"
2. Capture temp_family_id from localStorage
3. Reload browser page
4. Verify conversation continues

**Expected Behavior:**
- Conversation state persists after reload
- Same temp_family_id recovered
- Previous messages visible
- Can continue from where left off

**Verification Points:**
- [ ] temp_family_id consistent before/after reload
- [ ] All 3 previous messages still in UI
- [ ] Context available in localStorage
- [ ] Can send new message and it references previous context
- [ ] Database shows all messages under same conversation_id

**Pass Criteria:**
Conversation persists across page reload

---

#### Test 2.13: Anonymous to Registered Conversion Flow

**Test ID:** `T2.13`

**Procedure:**
1. Start as anonymous user (temp_family_id only, no family_id)
2. Complete conversation through recommendations
3. User clicks "Register" button
4. System creates actual family record
5. Temp data linked to registered family

**Expected Behavior:**
- Conversation completes
- System detects registration action
- temp_family_id converted to family_id
- Registration token generated
- Redirect URL provided

**Verification Points:**
- [ ] Initial state: family_id = null, temp_family_id generated
- [ ] After registration: family_id created
- [ ] Temp data migrated to registered family
- [ ] Response includes registration token
- [ ] Response includes redirect to payment/confirmation page

**Pass Criteria:**
Anonymous to registered conversion successful

---

#### Test 2.14: Error Recovery Fallback

**Test ID:** `T2.14`

**Procedure:**
1. Send message to N8N webhook
2. Wait 30+ seconds without response (simulate timeout)
3. UI should show fallback

**Expected Behavior:**
- Timeout detected after ~30 seconds
- Fallback response provided
- User offered alternative input method (form)
- No error message shown to user

**Verification Points:**
- [ ] Request sent to N8N
- [ ] Timeout detected (30+ seconds)
- [ ] Graceful error message displayed
- [ ] Fallback form suggested
- [ ] User not blocked from continuing

**Pass Criteria:**
Graceful timeout handling, fallback provided

---

## 3. Smart Recommendations & Filtering Tests

### Test 3.1: Age-Based Session Filtering

**Test ID:** `T3.1`

**Test 3.1a: 4-Year-Old Search**

**Prompt:**
```
4-year-old wants soccer
```

**Expected:**
- All recommendations have age_min <= 4 <= age_max
- No recommendations for 6+ only programs

**Verification:**
- [ ] All sessions appropriate for 4-year-old
- [ ] Query includes age filtering

**Test 3.1b: 10-Year-Old Search**

**Prompt:**
```
10-year-old for basketball
```

**Expected:**
- Different session set than 4-year-old search
- Age-specific recommendations

**Verification:**
- [ ] All sessions appropriate for 10-year-old
- [ ] Different from 4yo recommendations

**Pass Criteria:**
Age-based filtering works correctly

---

### Test 3.2: Time of Day Filtering

**Test ID:** `T3.2`

**Test 3.2a: Morning Preference**

**Prompt:**
```
Morning classes only
```

**Expected:** All recommendations start_time < 12:00

**Test 3.2b: Afternoon Preference**

**Prompt:**
```
After school hours (3-5 PM)
```

**Expected:** All recommendations 15:00 <= start_time <= 17:00

**Test 3.2c: Evening Preference**

**Prompt:**
```
Evening after 5 PM
```

**Expected:** All recommendations start_time >= 17:00

**Pass Criteria:**
All time filters applied correctly

---

### Test 3.3: Recommendation Count & Quality Scoring

**Test ID:** `T3.3`

**Test 3.3a: Exact Match**

**Prompt:**
```
Wednesday afternoons, soccer, age 6
```

**Expected:**
- 1-3 recommendations
- Ordered by match score (100 first if exact match)

**Test 3.3b: Partial Match**

**Prompt:**
```
Wednesday or Thursday, soccer, age 6
```

**Expected:**
- Up to 3 recommendations
- Wed preferred over Thu

**Test 3.3c: No Exact Match**

**Prompt:**
```
Friday 6 AM soccer
```

**Expected:**
- Returns best available options
- Scores < 100
- Doesn't fail

**Pass Criteria:**
All scoring scenarios handled correctly

---

### Test 3.4: Coach Rating Integration

**Test ID:** `T3.4`

**Prompt:** Any search

**Verification:**
- [ ] Each recommendation includes coachName (non-null string)
- [ ] Each recommendation includes coachRating (0-5 numeric)
- [ ] Highest-rated coaches appear first (if available)

**Pass Criteria:**
Coach ratings populated and used for sorting

---

### Test 3.5: Capacity & Urgency Display

**Test ID:** `T3.5`

**Test 3.5a: Available Session (5+ spots)**

**Verification:**
- [ ] No urgency language used

**Test 3.5b: Filling Session (2-4 spots)**

**Verification:**
- [ ] Light urgency ("Only a few spots left")

**Test 3.5c: Nearly Full (1 spot)**

**Verification:**
- [ ] Strong urgency ("Just one spot available!")

**Pass Criteria:**
Urgency messaging appropriate to availability

---

## 4. Waitlist Prevention & Alternative Suggestions Tests

### Test 4.1: Adjacent Day Suggestions

**Test ID:** `T4.1`

**Setup:** Mark all Monday sessions as full

**Prompt:**
```
My son wants Monday soccer
```

**Expected:**
- Kai suggests Tuesday and/or Wednesday
- Recommendations show days 2-3 (Tue/Wed)
- Alternative recommendations score >= 90

**Verification:**
- [ ] Adjacent day alternatives provided
- [ ] Match scores reflect preference (adjacent > distant)
- [ ] get_alternatives() function called

**Pass Criteria:**
Adjacent day alternatives offered

---

### Test 4.2: Alternative Time Slots

**Test ID:** `T4.2`

**Setup:** Fill all morning sessions at Lincoln Park

**Prompt:**
```
Morning soccer at Lincoln Park, age 6
```

**Expected:**
- Suggestions for afternoon/evening at same location
- Same location_id, different start_time

**Verification:**
- [ ] Same location preserved
- [ ] Different time slots shown

**Pass Criteria:**
Time alternatives at same location offered

---

### Test 4.3: Alternative Location

**Test ID:** `T4.3`

**Setup:** Fill all Monday 4 PM slots at Lincoln Park

**Prompt:**
```
Monday at 4 PM at Lincoln Park
```

**Expected:**
- Riverside Park suggested
- Same day/time, different location

**Verification:**
- [ ] Location changed (Riverside Park)
- [ ] Day/time preserved

**Pass Criteria:**
Location alternatives at same day/time offered

---

### Test 4.4: Fallback Program Suggestions

**Test ID:** `T4.4`

**Prompt:**
```
Junior basketball on Friday at 5 PM
```

**Expected:**
- Similar programs offered (Mini basketball, Premier basketball, Junior soccer)

**Verification:**
- [ ] Related programs suggested
- [ ] Format maintained but program type flexed

**Pass Criteria:**
Program alternatives offered when exact not available

---

### Test 4.5: Waitlist as True Last Resort

**Test ID:** `T4.5`

**Setup:** Manually fill all alternative sessions

**Prompt:**
```
Friday 6 AM specialty soccer only
```

**Expected:**
- At least 2 alternatives tried before waitlist
- Waitlist offered as only option
- Clear explanation provided

**Verification:**
- [ ] Multiple alternatives exhausted
- [ ] Waitlist clearly last resort
- [ ] User understands why

**Pass Criteria:**
Waitlist suggested only after alternatives exhausted

---

### Test 4.6: Smart Alternative Ranking

**Test ID:** `T4.6`

**Verify scoring thresholds:**

| Match Type | Score |
|-----------|-------|
| Exact match | 100 |
| Adjacent day | 90 |
| Alternative time, same location | 85 |
| Alternative location, same time | 80 |
| Similar program | 75 |

**Procedure:**
1. Request with 5+ potential alternatives
2. Verify top 3 ranked correctly

**Verification:**
- [ ] Exact matches shown first (100)
- [ ] Adjacent days high priority (90)
- [ ] Location preserved when possible (85)

**Pass Criteria:**
Scoring algorithm correctly prioritizes recommendations

---

### Test 4.7: AI Decision Logic - Register vs. Waitlist

**Test ID:** `T4.7`

**Test 4.7a: Good Alternative Available**

**Prompt:**
```
Tuesday soccer (Tuesday has availability, Monday doesn't)
```

**Expected:**
- Recommends Tuesday registration
- No waitlist suggestion

**Test 4.7b: Only Waitlist Available**

**Prompt:**
```
Only Monday will work (Monday full, no viable alternatives)
```

**Expected:**
- Mentions waitlist as option
- Acknowledges constraint

**Pass Criteria:**
Logic correctly chooses registration over waitlist when possible

---

## 5. Extended Edge Cases & Robustness Tests

### Test 5.1: Special Characters & Non-ASCII Names

**Test ID:** `T5.1`

**Test 5.1a: Accented Names**

**Prompt:**
```
My daughter's name is José María
```

**Expected:**
- Name extracted and stored correctly
- UTF-8 storage verified in database

**Test 5.1b: Multi-Part Names**

**Prompt:**
```
His name is Jean-Claude
```

**Expected:**
- childName = "Jean-Claude"

**Pass Criteria:**
Special characters handled correctly

---

### Test 5.2: Timezone & DST Handling

**Test ID:** `T5.2`

**Procedure:**
- Send search request
- Verify times displayed in local timezone

**Verification:**
- [ ] No hardcoded UTC times
- [ ] No offset errors
- [ ] Correct daylight saving consideration

**Pass Criteria:**
Times correct for all timezones

---

### Test 5.3: Empty/No Results Scenarios

**Test ID:** `T5.3`

**Test 5.3a: Impossible Combination**

**Prompt:**
```
12-year-old wants underwater basket weaving at 3 AM
```

**Expected:**
- Graceful explanation
- Alternatives offered
- No error thrown

**Test 5.3b: Age Outside Available Programs**

**Prompt:**
```
My 18-year-old wants youth soccer
```

**Expected:**
- Explains no programs for this age
- Suggests alternatives

**Pass Criteria:**
Empty results handled gracefully

---

### Test 5.4: Repeated/Cyclic Preferences

**Test ID:** `T5.4`

**Prompt Sequence:**
```
1. Monday...
2. Tuesday...
3. Wednesday...
4. Actually any weekday
```

**Expected:**
- No infinite loop
- Settles on final answer
- Moves forward

**Pass Criteria:**
Cyclic preferences resolved correctly

---

### Test 5.5: Ambiguous Requests

**Test ID:** `T5.5`

**Test 5.5a: Tentative Statement**

**Prompt:**
```
Let's try soccer
```

**Expected:**
- Clarifies if preference or thinking
- Confirms understanding

**Test 5.5b: Uncertain Preference**

**Prompt:**
```
Swimming, I think
```

**Expected:**
- Acknowledges
- Confirms with user

**Pass Criteria:**
Ambiguity resolved through clarification

---

### Test 5.6: Very Long Prompts

**Test ID:** `T5.6`

**Prompt:** Multi-sentence rambling request with scattered information

**Expected:**
- Extracts relevant data
- Ignores noise
- Conversation moves forward

**Pass Criteria:**
Long prompts handled gracefully

---

### Test 5.7: Response Time Performance

**Test ID:** `T5.7`

**Procedure:**
- Monitor network tab for each request
- Document response times

**Expected:**
- Average: <500ms
- 95th percentile: <1000ms
- No timeouts

**Documentation:**
- [ ] Min response time: ___ ms
- [ ] Max response time: ___ ms
- [ ] Average response time: ___ ms
- [ ] Total requests tested: ___

**Pass Criteria:**
All response times within acceptable range

---

### Test 5.8: Context Size Limits

**Test ID:** `T5.8`

**Procedure:**
1. Simulate 20+ turns of conversation
2. Verify buffer memory maintained (last 8 messages)

**Expected:**
- Old context doesn't interfere
- Window buffer managed
- No errors from large context

**Pass Criteria:**
Large conversation histories handled correctly

---

### Test 5.9: Concurrent Conversations

**Test ID:** `T5.9`

**Procedure:**
1. Open 2-3 separate browser tabs
2. Start conversations with different organization IDs
3. Verify isolation

**Expected:**
- Each conversation maintains separate context
- No cross-contamination

**Verification:**
- [ ] Database entries properly isolated
- [ ] No context mixing

**Pass Criteria:**
Concurrent conversations properly isolated

---

### Test 5.10: Rapid Sequential Messages

**Test ID:** `T5.10`

**Procedure:**
1. Send 5 messages in quick succession
2. Don't wait for responses

**Expected:**
- N8N queues properly
- No message loss
- All messages appear in order

**Verification:**
- [ ] All 5 messages in kairo_chat table
- [ ] Correct order maintained
- [ ] All processed

**Pass Criteria:**
Rapid sequential messages handled correctly

---

## 6. Database State & Data Integrity Tests

### Test 6.1: Message Persistence

**Test ID:** `T6.1`

**Procedure:**
1. Complete 5-turn conversation
2. Query kairo_chat table
3. Verify all entries

**Verification for each message:**
- [ ] Correct conversation_id
- [ ] Alternating role (user/assistant)
- [ ] extracted_data populated where relevant
- [ ] conversation_state showing progression
- [ ] Timestamps in ascending order
- [ ] No null fields

**Pass Criteria:**
All 5 messages persisted correctly

---

### Test 6.2: Recommendation Data Completeness

**Test ID:** `T6.2`

**Procedure:**
- Retrieve any recommendation
- Verify all required fields

**Required Fields:**
- [ ] sessionId
- [ ] programName
- [ ] programDescription
- [ ] price (non-zero)
- [ ] durationWeeks
- [ ] capacity
- [ ] enrolledCount
- [ ] spotsRemaining
- [ ] locationName
- [ ] locationAddress
- [ ] locationRating (if available)
- [ ] coachName
- [ ] coachRating
- [ ] sessionRating
- [ ] dayOfWeek (0-6)
- [ ] startTime (HH:MM)
- [ ] startDate (YYYY-MM-DD)

**Pass Criteria:**
All fields present and valid

---

### Test 6.3: Context Data Accuracy

**Test ID:** `T6.3`

**Procedure:**
1. Send message with specific data
2. Extract context from response
3. Verify matches input

**Verification:**
- [ ] childName matches exactly
- [ ] childAge matches exactly
- [ ] preferredDays matches exactly
- [ ] preferredTimeOfDay matches exactly
- [ ] No truncation
- [ ] No modification

**Pass Criteria:**
All context data accurate

---

### Test 6.4: Waitlist Position Tracking

**Test ID:** `T6.4`

**Procedure:**
1. Join waitlist via conversation
2. Query waitlist table
3. Verify position

**Verification:**
- [ ] Position stored correctly
- [ ] Reflects current queue length
- [ ] Position = (existing entries) + 1

**Pass Criteria:**
Waitlist position tracked correctly

---

### Test 6.5: RLS Policy Validation

**Test ID:** `T6.5`

**Procedure:**
1. Attempt to query kairo_chat for different conversation_id
2. Verify permission denied

**Expected:**
- RLS policies enforced
- Unauthorized access denied
- Security confirmed

**Pass Criteria:**
RLS policies working correctly

---

## 7. UI & Frontend Integration Tests

### Test 7.1: Message Display Rendering

**Test ID:** `T7.1`

**Verification:**
- [ ] User messages: right-aligned, user styling
- [ ] Assistant messages: left-aligned, Kai styling
- [ ] Quick reply buttons rendered (if present)
- [ ] Session cards rendered (if present)
- [ ] No layout shifts

**Pass Criteria:**
All message types render correctly

---

### Test 7.2: Quick Reply Button Functionality

**Test ID:** `T7.2`

**Procedure:**
1. Response includes quickReplies array
2. Click button
3. Verify message sent

**Verification:**
- [ ] Button clickable
- [ ] Message sent as if user typed it
- [ ] Conversation continues normally

**Pass Criteria:**
Quick replies work correctly

---

### Test 7.3: Session Card Display

**Test ID:** `T7.3`

**Verification each card shows:**
- [ ] Program name
- [ ] Coach name with star rating
- [ ] Day, time, date
- [ ] Price and duration
- [ ] Capacity/spots with progress bar
- [ ] "Select" button functional

**Pass Criteria:**
All card elements present and functional

---

### Test 7.4: Loading State During N8N Call

**Test ID:** `T7.4`

**Procedure:**
1. Send message
2. Observe loading state
3. Wait for response

**Verification:**
- [ ] Loading spinner appears immediately
- [ ] Input disabled during loading
- [ ] Loading cleared on response
- [ ] New message displays

**Pass Criteria:**
Loading states work correctly

---

### Test 7.5: Error State Handling

**Test ID:** `T7.5`

**Procedure:**
1. Simulate N8N error
2. Observe error display

**Verification:**
- [ ] User sees friendly message (not technical)
- [ ] Fallback form offered
- [ ] Not blocked from continuing

**Pass Criteria:**
Error handling user-friendly

---

### Test 7.6: Auto-Scroll to Latest Message

**Test ID:** `T7.6`

**Procedure:**
1. Send message with long recommendation list
2. Observe scroll behavior

**Verification:**
- [ ] Chat auto-scrolls to newest content
- [ ] No manual scroll required

**Pass Criteria:**
Auto-scroll works correctly

---

### Test 7.7: Temp ID Generation & Persistence

**Test ID:** `T7.7`

**Procedure:**
1. First visit: check localStorage
2. Reload page: check localStorage

**Verification:**
- [ ] temp_family_id created on first visit
- [ ] temp_child_id created
- [ ] Both stored in localStorage
- [ ] Same IDs persist after reload
- [ ] Consistent across session

**Pass Criteria:**
Temp IDs generated and persisted correctly

---

## 8. Production Readiness Checklist

### Configuration Verification

- [ ] N8N webhook URL correct and accessible
- [ ] All environment variables set
- [ ] N8N credentials (Gemini API) configured
- [ ] Supabase RLS policies enabled
- [ ] CORS headers configured
- [ ] Database backups created
- [ ] Error logging configured

### Performance Metrics

- [ ] Average response time: ___ ms (target: <500ms)
- [ ] 95th percentile response time: ___ ms (target: <1000ms)
- [ ] Maximum response time: ___ ms
- [ ] Total requests tested: ___ (target: 50+)
- [ ] Timeout rate: ___ % (target: 0%)
- [ ] Consistent across query types: YES / NO

### Data Quality

- [ ] No null values in critical fields: YES / NO
- [ ] All recommendations valid and relevant: YES / NO
- [ ] Context preservation 100%: YES / NO
- [ ] No duplicate messages: YES / NO
- [ ] No race conditions: YES / NO

### Stability

- [ ] Zero crashes: YES / NO
- [ ] Zero unhandled errors: YES / NO
- [ ] Graceful error handling: YES / NO
- [ ] State machine transitions correct: YES / NO
- [ ] Edge cases handled: YES / NO

### Security

- [ ] RLS policies enforced: YES / NO
- [ ] No sensitive data in logs: YES / NO
- [ ] API keys not exposed: YES / NO
- [ ] CORS properly configured: YES / NO
- [ ] Input validation working: YES / NO

### Documentation

- [ ] All test cases documented: YES / NO
- [ ] Screenshots captured: YES / NO
- [ ] Response times recorded: YES / NO
- [ ] Issues documented: YES / NO
- [ ] Test report generated: YES / NO

---

## 9. Test Execution & Documentation Process

### For Each Test Case

**Required Documentation:**
- [ ] Test ID recorded
- [ ] Prompt text captured
- [ ] Expected behavior documented
- [ ] Network request payload recorded (dev tools)
- [ ] N8N response payload recorded
- [ ] Actual behavior noted
- [ ] Screenshot taken
- [ ] Database changes verified
- [ ] Response time documented
- [ ] Pass/Fail status recorded

### Test Report Structure

**Summary Section:**
- Total tests run: ___
- Tests passed: ___
- Tests failed: ___
- Pass rate: ___%
- Total time: ___

**Baseline Comparison:**
- 14 existing tests status: ___/14 passed
- New edge cases status: ___/60+ passed

**Performance Section:**
- Min response time: ___ ms
- Max response time: ___ ms
- Average response time: ___ ms
- 95th percentile: ___ ms

**Issues Found:**
- Critical issues: [ ] List any
- Major issues: [ ] List any
- Minor issues: [ ] List any

**Database Validation:**
- Total messages in kairo_chat: ___
- Total recommendations served: ___
- Waitlist entries created: ___
- Orphaned data: [ ] List any

**Recommendations:**
- [ ] Production ready
- [ ] Needs fixes (list)
- [ ] Needs optimization (list)
- [ ] Hold for further testing (list)

### Cleanup & Reset

**After Completion:**
- [ ] Document final database state
- [ ] Decide: keep test data or delete
- [ ] Verify no orphaned data remains
- [ ] Archive test report
- [ ] Sign off on production readiness

---

## 10. Success Criteria & Sign-Off

### Test Plan Success Requires:

✅ **All 14 baseline tests pass (100%)**
✅ **At least 50 new edge case tests pass (85%+ success rate)**
✅ **Average response time <500ms**
✅ **Zero critical issues**
✅ **Zero unhandled exceptions**
✅ **100% RLS security validation**
✅ **All database integrity checks pass**

### Sign-Off

When all criteria met:
- [ ] Lead tester approves
- [ ] QA lead confirms
- [ ] Tech lead authorizes
- [ ] Ready for production deployment

---

## Appendix: Test Data Summary

### Organizations
- Soccer Shots Demo: `00000000-0000-0000-0000-000000000001`

### Locations
- Lincoln Park: 50 capacity
- Riverside Park: 40 capacity

### Programs
- Mini Soccer
- Junior Soccer
- Premier Soccer

### Test Sessions (Examples)
- Monday 4 PM Mini Soccer at Lincoln Park
- Saturday 10 AM Junior Soccer at Lincoln Park (marked as full)
- Tuesday 3 PM Premier Soccer at Riverside Park
- Wednesday 6 PM Mini Soccer at Riverside Park
- Friday 5 PM Junior Soccer at Lincoln Park

### Test Family Accounts
- Created during Test 2.2 (Emma, age 6)
- Created during Test 2.13 (anonymous to registered)
- Additional as needed per test cases

---

**Document Version:** 1.0
**Created:** January 23, 2026
**Status:** Ready for Execution
**Test Lead:** QA Team
**Production Deployment Gate:** All tests pass with sign-off
