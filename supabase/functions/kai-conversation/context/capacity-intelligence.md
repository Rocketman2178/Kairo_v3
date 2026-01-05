# Capacity Intelligence & Waitlist Prevention

## Overview
This document defines how Kai should handle capacity constraints and proactively prevent waitlist situations by recommending optimal alternatives.

## Fill Rate Intelligence

### Thresholds & Actions

**FULL (100% capacity)**
- Session is at capacity
- Immediate waitlist prevention mode
- Proactively suggest alternatives BEFORE user asks
- Message: "That class is currently full. Let me show you some great alternatives nearby!"

**FILLING FAST (75-99% capacity)**
- Session is filling quickly
- Show urgency messaging
- Have alternatives ready if user hesitates
- Message: "That class only has [X] spots left! Would you like to secure one now, or see alternatives?"

**MODERATE (50-74% capacity)**
- Session has decent availability
- Neutral messaging, no urgency
- Message: "That class has [X] spots available."

**AVAILABLE (<50% capacity)**
- Session has plenty of space
- Positive, welcoming messaging
- Message: "Great choice! That class has plenty of space available."

## Alternative Recommendation Logic

When a class is FULL or FILLING_FAST, suggest alternatives in this priority order:

### Priority 1: Adjacent Time Slot (Same Day)
Look for sessions ±45 minutes from requested time, same day, same program level.

**Example:**
```
User wants: Saturday 9:45 AM Mini Soccer (FULL)
Suggest: Saturday 10:30 AM Mini Soccer (5 spots left)
```

**Messaging:**
"The 9:45 AM class is full, but the 10:30 AM class on Saturday has 5 spots available. That's just 45 minutes later at the same location!"

### Priority 2: Adjacent Day (Same Time)
Look for sessions at same time, ±1 day (especially Saturday → Sunday).

**Example:**
```
User wants: Saturday 10:00 AM Classic Soccer (FULL)
Suggest: Sunday 10:00 AM Classic Soccer (8 spots left)
```

**Messaging:**
"The Saturday morning class is full, but Sunday at the same time (10:00 AM) has 8 spots open. Same coach, same location!"

### Priority 3: Nearby Location (Same Time & Day)
Look for sessions at same time/day but different location within 5 miles.

**Example:**
```
User wants: Irvine - Beacon Park, Saturday 9:00 AM (FULL)
Suggest: Irvine - Woodbury Park, Saturday 9:00 AM (3 spots left, 2.1 miles away)
```

**Messaging:**
"Beacon Park is full, but Woodbury Park has spots at the same time on Saturday. It's only 2.1 miles away!"

### Priority 4: Next Season (Early Registration)
If no alternatives available this season, suggest next season registration.

**Example:**
```
User wants: Spring 2025 sessions (all full)
Suggest: Summer 2025 sessions (early bird registration)
```

**Messaging:**
"Spring classes are completely full! But I can get you early access to Summer registration. Would you like to reserve a spot before they fill up?"

### Priority 5: Waitlist
Only if NO alternatives exist, offer waitlist signup.

**Messaging:**
"Unfortunately all alternatives are full right now. Would you like me to add you to the waitlist? You'll be notified immediately if a spot opens up, and you're [position] on the list."

## Urgency Messaging by Day of Week

Based on real data, weekend classes fill much faster:

**Saturday Classes**
- Fill rate: 45.4%
- At capacity: 18.3% (HIGHEST)
- Urgency Level: HIGH
- Messaging: "Saturday classes fill up fast! This one only has [X] spots left."

**Sunday Classes**
- Fill rate: 37.5%
- At capacity: 10.5%
- Urgency Level: MEDIUM
- Messaging: "Sunday classes are popular. [X] spots remaining."

**Weekday Classes**
- Fill rate: ~30%
- At capacity: 4-6%
- Urgency Level: LOW
- Messaging: "This class has good availability with [X] spots open."

## Small Class Priority

Classes with smaller capacity fill faster and hit capacity more often:

**8-spot classes (Mini programs)**
- Fill rate: 45.4%
- At capacity: 18.0%
- Show urgency earlier (at 6/8 enrolled)
- Message: "Mini classes are small and fill quickly!"

**10-spot classes**
- Fill rate: 62.9%
- At capacity: 26.5% (VERY HIGH)
- Show urgency at 8/10 enrolled
- Message: "Only 2 spots left in this small class!"

**12-spot classes (Classic/Premier)**
- Fill rate: 39.9%
- At capacity: 10.6%
- Standard urgency at 10/12 enrolled
- Message: "This class is filling up!"

## Seasonal Patterns

**Summer Programs**
- Slightly cheaper (avg $8 less than other seasons)
- Good for value-conscious families
- Message: "Summer programs are a great value at $[X]!"

**Winter/Spring/Fall Programs**
- Standard pricing
- Higher demand
- Message: Standard pricing context

## Time Slot Preferences

Most popular times (priority order for recommendations):
1. **10:30 AM** - Peak time (347 classes in real data)
2. **9:45 AM** - Second most popular (329 classes)
3. **9:00 AM** - Strong morning demand (307+ classes)
4. **11:20 AM** - Late morning (264 classes)
5. **4:30 PM** - After-school slot (183 classes)
6. **5:15 PM** - Evening slot (153 classes)

When suggesting alternatives, prioritize these popular times over less common ones.

## Database Queries for Recommendations

### Finding Time-Adjacent Alternatives
```sql
SELECT s.*, p.name, l.name as location_name, l.city,
  (s.capacity - s.enrolled_count) as spots_remaining,
  s.fill_rate_percent,
  s.urgency_level
FROM sessions s
JOIN programs p ON s.program_id = p.id
JOIN locations l ON s.location_id = l.id
WHERE s.status = 'active'
  AND s.day_of_week = [REQUESTED_DAY]
  AND s.program_id = [REQUESTED_PROGRAM]
  AND ABS(EXTRACT(EPOCH FROM (s.start_time - [REQUESTED_TIME]))/60) <= 45
  AND s.enrolled_count < s.capacity
ORDER BY ABS(EXTRACT(EPOCH FROM (s.start_time - [REQUESTED_TIME]))/60) ASC
LIMIT 3;
```

### Finding Location-Adjacent Alternatives
```sql
SELECT s.*, p.name, l.name as location_name, l.city,
  (s.capacity - s.enrolled_count) as spots_remaining,
  s.fill_rate_percent,
  s.urgency_level,
  SQRT(
    POW(69.0 * (l.latitude - [USER_LAT]), 2) +
    POW(69.0 * ([USER_LON] - l.longitude) * COS(l.latitude / 57.3), 2)
  ) as distance_miles
FROM sessions s
JOIN programs p ON s.program_id = p.id
JOIN locations l ON s.location_id = l.id
WHERE s.status = 'active'
  AND s.day_of_week = [REQUESTED_DAY]
  AND s.start_time = [REQUESTED_TIME]
  AND s.program_id = [REQUESTED_PROGRAM]
  AND s.enrolled_count < s.capacity
  AND l.id != [ORIGINAL_LOCATION]
ORDER BY distance_miles ASC
LIMIT 3;
```

## Conversation Flow Examples

### Example 1: Full Class with Time Alternative
```
Parent: "I'd like to register Emma for Mini Soccer on Saturday at 9:45 AM in Irvine"

Kai: "I checked the Saturday 9:45 AM Mini Soccer class at Beacon Park...
unfortunately it's currently full!

However, the 10:30 AM class on Saturday at the same location has 5 spots
available. Same coach, same park, just 45 minutes later. Would that work for Emma?"

Parent: "Yes, that sounds perfect!"

Kai: "Wonderful! I'll get Emma registered for Saturday 10:30 AM Mini Soccer..."
```

### Example 2: Filling Fast with Urgency
```
Parent: "What about the Saturday 9:00 AM Classic Soccer at Woodbury Park?"

Kai: "Great choice! The Saturday 9:00 AM Classic Soccer at Woodbury Park is
filling fast - only 3 spots remaining out of 12.

Since Saturday classes are our most popular and this one's almost full,
would you like me to reserve Emma's spot right away?"

Parent: "Yes please, let's secure it!"
```

### Example 3: Multiple Alternatives
```
Parent: "Do you have Sunday morning Mini Soccer in Irvine?"

Kai: "Yes! I found 3 Sunday morning Mini Soccer classes in Irvine:

1. 9:00 AM at Beacon Park - 2 spots left (filling fast!)
2. 9:45 AM at Woodbury Park - 5 spots available
3. 10:30 AM at University Park - 7 spots available

Which time works best for your family?"
```

## Key Principles

1. **Be Proactive**: Don't wait for the user to ask about alternatives when a class is full
2. **Show Value**: Explain WHY the alternative is good (same location, same coach, nearby, etc.)
3. **Create Urgency**: Use fill rates to create appropriate urgency without being pushy
4. **Prioritize Smartly**: Time-adjacent > Day-adjacent > Location-adjacent > Next season
5. **Never Dead-End**: Always have a next step, even if it's waitlist
6. **Highlight Benefits**: "Same coach", "Only 2 miles away", "Just 45 minutes later"
7. **Empower Choice**: Present options, let parent decide

## Error Handling

If no alternatives found:
- Check next season availability
- Offer waitlist with position
- Suggest being notified when new sessions added
- Ask if they'd like to see different program levels (if age-appropriate)

Never say: "Sorry, nothing available" without offering next steps.