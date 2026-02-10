# KAI Agent Conversation Test Scenarios

This document contains 4 comprehensive test conversations designed to showcase the KAI agent's capabilities, knowledge, and response quality. Each conversation includes an initial prompt and 3 follow-up questions based on realistic parent registration scenarios.

---

## Test Scenario 1: Young Child Soccer Registration (Straightforward Search)

### Context
Parent looking for a soccer program for a young child on weekends. Tests basic data extraction, session search, and recommendation presentation.

### Initial Prompt
```
Hi! I'm looking to register my son Liam for soccer. He's 3 years old and we live in Irvine. Do you have any Saturday morning classes available?
```

**Expected Agent Behavior:**
- Extract: Child name (Liam), age (3), sport (soccer), day (Saturday), time (morning), location (Irvine)
- Resolve program: Mini Soccer (ages 2-3)
- Search sessions: Saturday mornings in Irvine
- Return 2 sessions: Oakwood Recreation Center at 9:00 AM (2 spots) and 10:30 AM (1 spot)
- Display price: $208
- Show capacity urgency (high - only 1-2 spots left)

### Follow-Up Question 1
```
What if the Saturday classes fill up? Do you have any Sunday options?
```

**Expected Agent Behavior:**
- Acknowledge concern about capacity
- Search for Sunday sessions in Irvine
- Return Sunday 9:45 AM session at Oakwood Recreation Center (3 spots available)
- Mention it's less full than Saturday options
- Offer to show both Saturday and Sunday for comparison

### Follow-Up Question 2
```
Tell me more about the coach and the location rating for the 9:00 AM Saturday class.
```

**Expected Agent Behavior:**
- Provide coach details: Coach Mike
- Show coach rating if available (4.9★)
- Provide location details: Oakwood Recreation Center, Irvine
- Show location rating if available
- Mention location address: 1 Sunnyhill Dr, Irvine, CA 92618
- Offer to show reviews or other sessions with this coach

### Follow-Up Question 3
```
How much is it and can I pay monthly?
```

**Expected Agent Behavior:**
- State full price: $208 (or $149 with discount)
- Explain payment plan options: Full payment vs 2-month installment
- Calculate monthly amount: approximately $79/month for 2 months
- Mention duration: 8 weeks
- Explain any early registration discounts
- Offer to proceed with registration

---

## Test Scenario 2: Swimming Program with Time Constraints

### Context
Parent with specific scheduling needs, testing time-of-day filtering and weekday availability.

### Initial Prompt
```
My daughter Emma is 6 and we want to sign her up for swimming lessons. We need weekday mornings only because I work afternoons. Anywhere in Orange County works.
```

**Expected Agent Behavior:**
- Extract: Child name (Emma), age (6), sport (swimming), time (mornings), days (weekdays), location (flexible)
- Resolve program: Learn to Swim (ages 4-8)
- Search sessions: Weekday mornings
- Return options in Orange, Fullerton, RSM areas
- Show Tuesday 9:00 AM at Westside Sports Complex (6 spots)
- Show Wednesday 11:00 AM at East Park Athletic Fields (4 spots)
- Show Thursday 9:00 AM at RSM Community Center (7 spots)
- Price: $232

### Follow-Up Question 1
```
What's the difference between Tuesday and Thursday options? Which is better?
```

**Expected Agent Behavior:**
- Compare both sessions side-by-side
- Mention location differences (Orange vs RSM)
- Compare availability (6 vs 7 spots)
- Compare coaches (Lisa Chen vs Sarah Mitchell)
- Mention ratings if different
- Ask about location preference
- Suggest based on convenience

### Follow-Up Question 2
```
We live in Irvine, so which location is closer for us?
```

**Expected Agent Behavior:**
- Acknowledge Irvine as home location
- Recommend Orange locations (closer to Irvine than RSM)
- Suggest Tuesday 9:00 AM at Westside Sports Complex
- Provide address for verification
- Mention drive time if available
- Ask if they want to see other Orange locations

### Follow-Up Question 3
```
Does the program include any equipment or do we need to bring our own swim gear?
```

**Expected Agent Behavior:**
- Provide program details for Learn to Swim
- Explain what's included vs what to bring
- Mention typical swim gear needed (swimsuit, goggles, towel)
- Note any facility amenities (changing rooms, showers)
- Offer to proceed with registration if interested
- Provide any first-day instructions

---

## Test Scenario 3: Premier Soccer with Capacity and Alternative Exploration

### Context
Parent looking for a competitive program with high demand, testing capacity intelligence and alternative suggestions.

### Initial Prompt
```
Hi! I need to register Marcus (he's 9) for competitive soccer. We prefer Saturday mornings in Rancho Santa Margarita. What do you have available?
```

**Expected Agent Behavior:**
- Extract: Child name (Marcus), age (9), sport (soccer), competitive level, day (Saturday), time (morning), location (RSM)
- Resolve program: Premier Soccer (ages 7-10)
- Search sessions: Saturday mornings in RSM
- Return 2 sessions at RSM Community Center:
  - 9:00 AM (4 spots, moderate urgency)
  - 10:30 AM (2 spots, high urgency - filling fast)
- Price: $240
- Note weekend popularity

### Follow-Up Question 1
```
The 9 AM looks perfect. Can you tell me how quickly it's filling up?
```

**Expected Agent Behavior:**
- Show current capacity: 8/12 enrolled (4 spots left)
- Calculate fill rate: 67% full
- Mention urgency level: moderate (more than Saturday average)
- Note it's Saturday (most popular day)
- Recommend registering soon
- Offer to show session rating: Check reviews from previous sessions
- Provide coach info: Coach Mike (4.9★)

### Follow-Up Question 2
```
What if both Saturday sessions fill up? Are there Sunday options?
```

**Expected Agent Behavior:**
- Search for Sunday Premier Soccer in RSM
- Return Sunday 9:45 AM session (5 spots available)
- Compare with Saturday sessions
- Note Sunday is slightly less popular
- Show both Irvine and RSM Sunday options
- Recommend based on availability and convenience

### Follow-Up Question 3
```
My daughter is 5 - do you have anything for her at the same time as Marcus's class?
```

**Expected Agent Behavior:**
- Extract new child: sister, age 5
- Resolve program: Junior Soccer (ages 4-6)
- Search for sessions at same location/time
- Check for Saturday 9:00 AM Junior Soccer at RSM
- If not available, suggest nearby times
- Calculate family discount if applicable
- Show total pricing for both children
- Offer multi-child registration

---

## Test Scenario 4: Parent Exploring Multiple Programs

### Context
Uncertain parent exploring different activities, testing program knowledge and comparative recommendations.

### Initial Prompt
```
I'm not sure what to sign up my 8-year-old daughter Sophie for. She's athletic but hasn't tried organized sports. What programs do you recommend for her age?
```

**Expected Agent Behavior:**
- Extract: Child name (Sophie), age (8), new to sports
- Identify age-appropriate programs:
  - Classic Soccer (ages 4-7) - just aged out
  - Premier Soccer (ages 7-10) - good fit
  - Intermediate Swimming (ages 8-12) - good fit
  - Creative Arts Studio (ages 6-14) - non-sport option
  - Youth Basketball (ages 5-8) - upper age range
- Recommend 2-3 programs with brief descriptions
- Ask about interests: team sports vs individual, indoor vs outdoor
- Ask about schedule preferences

### Follow-Up Question 1
```
She loves being outdoors and working with other kids. What would you suggest?
```

**Expected Agent Behavior:**
- Narrow down to team sports: Soccer and Basketball
- Recommend Premier Soccer (ages 7-10)
- Explain program: "Advanced training for ages 7-10, competitive skills and strategic play"
- Show several session options across different days/locations
- Mention price: $240 for 8 weeks
- Ask about location and day preferences

### Follow-Up Question 2
```
How does soccer compare to swimming at this age? Which is better for beginners?
```

**Expected Agent Behavior:**
- Provide balanced comparison:
  - Soccer: Team sport, outdoor, social, tactical skills
  - Swimming: Individual focus, water safety, lifetime skill, indoor
- Note both are beginner-friendly
- Mention soccer may be better for "working with other kids" preference
- Swimming good for fitness foundation
- Ask about water comfort level
- Suggest trying one first, then expanding

### Follow-Up Question 3
```
Let's go with soccer. Show me Saturday options in Orange or Irvine.
```

**Expected Agent Behavior:**
- Confirm: Premier Soccer (age 8), Saturday, Orange/Irvine
- Search and return sessions:
  - Irvine - Oakwood Recreation Center at 9:00 AM (4 spots)
  - Orange - Main Sports Complex at 10:00 AM (6 spots)
  - RSM - Community Center at 9:00 AM (4 spots) - nearby option
- Show all details: coach, location, capacity, price
- Highlight weekend popularity
- Recommend registering soon
- Offer to proceed with selection

---

## Testing Notes

### Success Criteria for Each Conversation

1. **Data Extraction Accuracy**
   - Correctly identifies child name, age, sport/activity
   - Properly extracts location, day, and time preferences
   - Maintains context across multiple messages

2. **Session Matching Quality**
   - Returns sessions that match ALL specified criteria
   - Age ranges are correctly applied
   - Location filtering works (city names, aliases like RSM)
   - Day of week filtering is accurate
   - Time of day filtering (morning/afternoon/evening) works

3. **Response Quality**
   - Natural, conversational tone
   - Addresses parent's specific questions
   - Provides relevant details without overwhelming
   - Proactively offers helpful information (capacity, ratings, alternatives)

4. **Capacity Intelligence**
   - Correctly identifies high-demand sessions
   - Provides urgency indicators (filling fast, spots left)
   - Calculates fill rates accurately
   - Suggests alternatives when needed

5. **Program Knowledge**
   - Correctly resolves sport names to specific programs (e.g., "soccer" + age 3 = "Mini Soccer")
   - Provides accurate age ranges
   - Explains program differences and suitability
   - Offers appropriate alternatives

6. **Pricing Transparency**
   - Shows correct prices from database
   - Explains payment plan options
   - Mentions discounts when applicable
   - Calculates monthly amounts correctly

### Expected Session Counts by Scenario

- **Scenario 1** (Liam): Should return 2 Saturday morning Mini Soccer sessions in Irvine
- **Scenario 2** (Emma): Should return 3-4 weekday morning Learn to Swim sessions
- **Scenario 3** (Marcus): Should return 2 Saturday morning Premier Soccer sessions in RSM
- **Scenario 4** (Sophie): Should return 2-3 Saturday Premier Soccer sessions in Orange/Irvine

### Known Database Facts to Verify

- Mini Soccer: Ages 2-3, $208
- Junior Soccer: Ages 4-6, $224
- Premier Soccer: Ages 7-10, $240
- Learn to Swim: Ages 4-8, $232
- Saturday is the most popular day (highest fill rates)
- Coach Mike has 4.9★ rating
- Multiple locations in Irvine, Orange, Fullerton, RSM
- Most sessions are 8 weeks duration
- Payment plans: Full payment (discount) or 2-month installment

---

## How to Use These Tests

1. **Manual Testing**: Copy each prompt into the KAI agent chat interface and verify responses
2. **Regression Testing**: Use these conversations to verify functionality after updates
3. **Training Examples**: Share with stakeholders to demonstrate agent capabilities
4. **Quality Benchmarking**: Evaluate response quality and make improvements
5. **N8N Workflow Validation**: Confirm data extraction and session search work end-to-end
