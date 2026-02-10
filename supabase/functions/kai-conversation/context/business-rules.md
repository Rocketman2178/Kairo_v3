# Business Rules & Program Structure

## Age Requirements
- Programs serve children ages **2-18 years old**
- Each program has specific age ranges (listed below)
- Age ranges use **exclusive upper bound**: `[2,4)` means ages 2 and 3 qualify (NOT age 4)
- If parent provides age outside 2-18, politely ask them to double-check

## Program Catalog (with exact age ranges)

### Soccer Programs
| Program | Ages | Price | Level |
|---------|------|-------|-------|
| Mini Soccer | 2-3 (range [2,4)) | $208.00 | mini |
| Junior Soccer | 4-6 (range [4,7)) | $224.00 | classic |
| Classic Soccer | 4-7 (range [4,8)) | $299.00 | classic |
| Premier Soccer | 7-10 or 8-12 (ranges [7,11) and [8,13)) | $240.00 | premier/classic |
| Teen Soccer | 10-14 (range [10,15)) | $229.00 | premier |
| High School Soccer | 15-18 (range [15,19)) | $201.83 | other |

### Basketball Programs
| Program | Ages | Price | Level |
|---------|------|-------|-------|
| Youth Basketball | 5-8 (range [5,9)) | $202.33 | classic |
| Teen Basketball | 9-13 (range [9,14)) | $250.02 | premier |
| High School Basketball | 14-18 (range [14,19)) | $257.35 | other |

### Swimming Programs
| Program | Ages | Price | Level |
|---------|------|-------|-------|
| Learn to Swim | 4-8 (range [4,9)) | $232.42 | classic |
| Intermediate Swimming | 8-12 (range [8,13)) | $203.15 | premier |
| Advanced Swimming | 11-16 (range [11,17)) | $245.04 | premier |

### Arts Programs
| Program | Ages | Price | Level |
|---------|------|-------|-------|
| Creative Arts Studio | 6-14 (range [6,15)) | $253.10 | classic |

## Age-to-Program Quick Reference
- **Age 2-3**: Mini Soccer
- **Age 4**: Junior Soccer, Classic Soccer, Learn to Swim
- **Age 5**: Junior Soccer, Classic Soccer, Youth Basketball, Learn to Swim
- **Age 6**: Junior Soccer, Classic Soccer, Youth Basketball, Learn to Swim, Creative Arts Studio
- **Age 7**: Classic Soccer, Premier Soccer, Youth Basketball, Learn to Swim, Creative Arts Studio
- **Age 8**: Premier Soccer, Youth Basketball, Learn to Swim, Intermediate Swimming, Creative Arts Studio
- **Age 9**: Premier Soccer, Teen Basketball, Intermediate Swimming, Creative Arts Studio
- **Age 10**: Premier Soccer, Teen Soccer, Teen Basketball, Intermediate Swimming, Creative Arts Studio
- **Age 11**: Premier Soccer, Teen Soccer, Teen Basketball, Intermediate Swimming, Advanced Swimming, Creative Arts Studio
- **Age 12**: Premier Soccer, Teen Soccer, Teen Basketball, Intermediate Swimming, Advanced Swimming, Creative Arts Studio
- **Age 13**: Teen Soccer, Teen Basketball, Advanced Swimming, Creative Arts Studio
- **Age 14**: Teen Soccer, High School Basketball, Advanced Swimming, Creative Arts Studio
- **Age 15**: High School Soccer, High School Basketball, Advanced Swimming
- **Age 16**: High School Soccer, High School Basketball, Advanced Swimming
- **Age 17-18**: High School Soccer, High School Basketball

## Session Structure
A "session" is a specific class instance with:
- **Program**: The activity type (Soccer, Swimming, Basketball, Arts)
- **Location**: Where it meets
- **Day of Week**: Monday (1) through Sunday (0)
- **Time**: Start time (e.g., 4:00 PM)
- **Duration**: Usually 1-2 hours
- **Capacity**: Maximum number of children
- **Coach**: Instructor name

## Scheduling Patterns
- Most programs run once per week
- Common time slots:
  - Morning: 9:00 AM - 11:00 AM
  - Afternoon: 3:00 PM - 5:00 PM
  - Evening: 6:00 PM - 8:00 PM
- Weekend sessions typically start later (10 AM+)

## Waitlist Handling
If a session is full:
1. Offer to add them to the waitlist for that specific session
2. Suggest alternative sessions (different day/time, same program)
3. Suggest similar programs if no alternatives available

## Age Mismatch Handling
If a parent requests a specific program that doesn't match their child's age:
1. **Acknowledge their interest** in that program type
2. **Gently explain** the age restriction (e.g., "Mini Soccer is designed for our youngest players ages 2-3")
3. **Immediately suggest** the age-appropriate program (e.g., "But I have Junior Soccer programs that are perfect for a 6-year-old!")
4. **Search for sessions** in the correct age-appropriate program
5. **Show recommendations** for the appropriate program

**Example:**
```
Parent: "I'd like to sign Liam up for Mini Soccer. He's 6 and we want Saturday mornings in Irvine."
You extract: childName: "Liam", childAge: 6, preferredProgram: "soccer"
You notice: Age 6 doesn't qualify for Mini Soccer (ages 2-3)
You respond: "I see Liam is 6 years old. Mini Soccer is designed for our youngest players (ages 2-3), but I have Junior Soccer and Classic Soccer programs that are perfect for him! Let me find Saturday morning sessions in Irvine..."
You search: For Junior Soccer (age 4-6) sessions matching their preferences
```

**Critical:** NEVER just say "no sessions found" when the issue is an age mismatch. Always suggest the correct program!

## Data Interpretation Guidelines

### Days of Week
- "Weekdays" = Monday-Friday (1,2,3,4,5)
- "Weekends" = Saturday-Sunday (6,0)
- "Monday or Wednesday" = [1, 3]
- "Mondays are best, but also Thursday or Friday" = [1, 4, 5]

### Time of Day
- "Morning" = before 12:00 PM
- "Afternoon" = 12:00 PM - 5:00 PM
- "Evening" = after 5:00 PM
- "4pm" or "4:00" = 16:00 (convert to 24-hour format)
- "Around 4" = approximately 16:00, afternoon
- "After school" = afternoon or evening

### Age Patterns
- "He's 9" = 9 years old
- "She just turned 7" = 7 years old
- "Almost 6" = 5 years old (use lower bound for safety)
- If unclear, ask for specific age