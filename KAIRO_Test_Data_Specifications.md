# KAIRO Test Data Specifications
## Based on iClassPro Platform Analysis

**Document Purpose**: Define comprehensive test data structures for KAIRO development based on observed iClassPro data patterns.

**Date**: December 8, 2025  
**Source**: iClassPro screenshots analysis  
**Target Application**: KAIRO AI-Powered Registration Platform

---

## Table of Contents

1. [Data Model Overview](#data-model-overview)
2. [Family Data](#family-data)
3. [Student Data](#student-data)
4. [Class Data](#class-data)
5. [Enrollment Data](#enrollment-data)
6. [Staff Data](#staff-data)
7. [Payment/Transaction Data](#paymenttransaction-data)
8. [Communication Data](#communication-data)
9. [Test Scenario Sets](#test-scenario-sets)
10. [Data Generation Guidelines](#data-generation-guidelines)

---

## Data Model Overview

### Entity Relationships

```
ORGANIZATION
  â”‚
  â”œâ”€â”€ FAMILIES
  â”‚     â”œâ”€â”€ Guardian 1 (Primary)
  â”‚     â”œâ”€â”€ Guardian 2 (Secondary)
  â”‚     â”œâ”€â”€ STUDENTS (1-5 children typically)
  â”‚     â”œâ”€â”€ Payment Methods
  â”‚     â”œâ”€â”€ Waivers/Policies
  â”‚     â””â”€â”€ Communication Preferences
  â”‚
  â”œâ”€â”€ CLASSES/PROGRAMS
  â”‚     â”œâ”€â”€ Program Type (Soccer, Swim, Dance, etc.)
  â”‚     â”œâ”€â”€ Level/Age Group
  â”‚     â”œâ”€â”€ Schedule (Day, Time, Duration)
  â”‚     â”œâ”€â”€ Location/Zone
  â”‚     â”œâ”€â”€ Instructor
  â”‚     â”œâ”€â”€ Capacity
  â”‚     â””â”€â”€ Pricing
  â”‚
  â”œâ”€â”€ ENROLLMENTS
  â”‚     â”œâ”€â”€ Student â†’ Class mapping
  â”‚     â”œâ”€â”€ Status (Active, Waitlist, Dropped)
  â”‚     â”œâ”€â”€ Dates (Start, End)
  â”‚     â”œâ”€â”€ Payment Status
  â”‚     â””â”€â”€ Attendance Records
  â”‚
  â”œâ”€â”€ STAFF
  â”‚     â”œâ”€â”€ Instructors/Coaches
  â”‚     â”œâ”€â”€ Admin Users
  â”‚     â”œâ”€â”€ Front Desk
  â”‚     â””â”€â”€ Roles/Permissions
  â”‚
  â””â”€â”€ TRANSACTIONS
        â”œâ”€â”€ Charges
        â”œâ”€â”€ Payments
        â”œâ”€â”€ Refunds
        â””â”€â”€ Credits
```

---

## Family Data

### Family Record Structure

```json
{
  "family_id": "FAM-00001",
  "family_name": "Roberts",
  "created_date": "2024-03-15",
  "status": "active",
  "guardians": [...],
  "students": [...],
  "payment_methods": [...],
  "policies": [...],
  "preferences": {...},
  "notes": [],
  "tags": [],
  "household_data": {...}
}
```

### Guardian Data Structure

```json
{
  "guardian_id": "GUARD-00001",
  "relationship": "mother",
  "is_primary": true,
  "first_name": "Sandra",
  "last_name": "Roberts",
  "phone_primary": "714-625-1589",
  "phone_secondary": null,
  "email": "ashleyapollock@yahoo.com",
  "address": {
    "street": "123 Oak Street",
    "city": "Anaheim",
    "state": "CA",
    "zip": "92805",
    "country": "USA"
  },
  "emergency_contact": false,
  "can_pickup": true,
  "portal_access": true,
  "communication_preferences": {
    "email": true,
    "sms": true,
    "push": true,
    "language": "en"
  }
}
```

### Test Family Data Sets

#### 1. Complete Family (Ideal Case)
- **Family Name**: Roberts, Sandra R.
- **Guardian 1**: Mother, all contact info complete
- **Guardian 2**: Father, all contact info complete
- **Students**: 2 children (ages 4 and 7)
- **Payment Method**: Valid credit card on file
- **Status**: Active enrollments
- **Policies**: All signed
- **Use Case**: Happy path testing

#### 2. Single Parent Family
- **Family Name**: Johnson, Ashley
- **Guardian 1**: Mother only
- **Guardian 2**: None
- **Students**: 1 child (age 5)
- **Payment Method**: Valid
- **Status**: Active
- **Use Case**: Single guardian workflow

#### 3. Incomplete Family (Missing Data)
- **Family Name**: Smith
- **Guardian 1**: Primary contact only
- **Guardian 2**: None
- **Students**: 1 child
- **Payment Method**: MISSING (flag: "No Payment Method")
- **Phone**: MISSING (flag: "No Phone Numbers Set")
- **Email**: MISSING (flag: "No Emails Set")
- **Use Case**: Data completeness validation, error handling

#### 4. Multi-Child Family (Complexity Testing)
- **Family Name**: Martinez
- **Guardian 1**: Mother
- **Guardian 2**: Father
- **Students**: 4 children (ages 3, 5, 8, 11)
- **Payment Method**: Multiple cards on file
- **Status**: Mix of active and waitlist
- **Use Case**: Sibling discount, multi-enrollment testing

#### 5. Gift Certificate Family
- **Family Name**: "Gift Certificate"
- **Guardian 1**: Point of Sale placeholder
- **Students**: None initially
- **Payment Method**: Prepaid/voucher
- **Use Case**: Non-standard payment testing

#### 6. Suspended Family
- **Family Name**: Anderson
- **Guardian 1**: Mother
- **Students**: 2 children
- **Payment Method**: Failed/invalid
- **Status**: Suspended (unpaid balance)
- **Use Case**: Payment recovery, restriction enforcement

### Sample Family Names (20 Test Families)

From iClassPro screenshots:
1. Alina
2. Ashley
3. Grace
4. Lamiya
5. Lynn
6. Maulik
7. Michelle
8. Miriam
9. Sophie
10. Susan
11. Tami
12. A, Pann
13. A, Reem
14. A Roberts, Sandra R
15. Aabid, Ilham
16. Aaron, Hannah
17. Abadian, Mahshid
18. Abbaszade, Lina

**Data Pattern Observations:**
- Mix of first names only and full names
- Diverse ethnic backgrounds
- Some have middle initials
- Format varies: "LastName, FirstName" and "FirstName"

---

## Student Data

### Student Record Structure

```json
{
  "student_id": "STU-00001",
  "family_id": "FAM-00001",
  "first_name": "Connor",
  "last_name": "Roberts",
  "nickname": null,
  "date_of_birth": "2019-08-15",
  "age_years": 4,
  "age_months": 10,
  "gender": "male",
  "medical_info": {
    "allergies": ["none"],
    "medications": [],
    "conditions": [],
    "special_needs": null,
    "emergency_contacts": [...]
  },
  "photo_url": null,
  "notes": "",
  "skill_level": null,
  "preferences": {
    "shirt_size": "YS",
    "equipment_size": null
  },
  "status": "active"
}
```

### Age Distribution (From Screenshots)

- **Infant (0-2 years)**: 5m, 8m, 1y 7m
- **Toddler (2-4 years)**: 27y 11m (data entry error), 3y 4m, 4y 2m, 4y 5m, 4y 6m, 4y 10m
- **Early Elementary (5-7 years)**: 5m, 6y 8m, 6y 9m, 7y 10m, 8y 5m, 8y 7m
- **Elementary (8-10 years)**: 9y 5m, 10y 2m
- **Preteen (11-13 years)**: 12y 5m

**Data Pattern Notes:**
- Age displayed as "Years + Months" format (e.g., "4y 10m")
- Some data quality issues visible ("27y 11m" likely incorrect)
- Age ranges align with typical youth sports (3-13 years most common)

### Gender Distribution

From screenshots:
- **Male**: ~45%
- **Female**: ~50%
- **Not Specified**: ~5% (flagged in red)

**Test Data Recommendation**: Include records with:
- Male gender
- Female gender
- Not specified / prefer not to say
- Validation that missing gender doesn't block registration

### Sample Student Names (30+ from Screenshots)

1. Connor (4y 10m, Male)
2. Emma (5y, Female)
3. Aabid, Sereen (8y 5m, Female)
4. Aaron, Hadley (1y 7m, Female)
5. Abbey, Mckenzie (4y 10m, Female)
6. Abdinanti, Perry (1y 8m, Male)
7. Abdin, Eleen (6y 9m, Female)
8. Abdin, Tasneem (4y 2m, Male)
9. Abdou, Damien (5m, Male)
10. Aboulfree, Cole (12y 5m, Male)
11. Abu debel, laila (8y 7m, Female)
12. Abu debel, ryan (10y 2m, Male)
13. Abu Hanna, Giselle (3y 4m, Female)
14. Abu Hanna, Maysa (4y 5m, Female)
15. Abourqeba, Zain (7y 10m, Male)
16. Acero, Emma (4y 6m, Female)
17. Acero, Olivia (8y 5m, Female)
18. Ackley, David (9y 5m, Male)

**Special Cases for Testing:**
- STP Set Up (placeholder/demo student)
- Point of Sale (non-student enrollment)
- Trial students (indicated by special icons)

---

## Class Data

### Class Record Structure

```json
{
  "class_id": "CLASS-00001",
  "class_name": "Adult Lesson: Monday 7:00",
  "program": "Adult Lessons",
  "level": "All Levels",
  "age_range": {
    "min_age": 18,
    "max_age": 99
  },
  "schedule": {
    "day_of_week": "Monday",
    "start_time": "19:00",
    "end_time": "19:40",
    "duration_minutes": 40,
    "recurring": true,
    "frequency": "weekly"
  },
  "location": {
    "zone": "Yellow Pool",
    "facility": "Aqua Duks Anaheim Hills",
    "address": "123 Pool Lane, Anaheim Hills, CA"
  },
  "instructor": {
    "instructor_id": "INST-001",
    "name": "Jimenez, Manny"
  },
  "capacity": {
    "active": 1,
    "max": 1,
    "open": 0,
    "makeup": 1,
    "future": 1,
    "waitlist": 0
  },
  "status": "active",
  "pricing": {
    "tuition": 149.00,
    "billing_schedule": "8 weeks",
    "early_bird_discount": 10.00,
    "multi_child_discount": 15.00
  }
}
```

### Sample Class Data (From Screenshots)

#### Adult Lessons
- **Monday 7:00** - Active: 1, Open: 0, Makeup: 1, Future: 1 - Jimenez, Manny - Yellow Pool
- **Thursday 7:00** - Active: 1, Open: 0 - Proctor, Jenna - Orange Pool
- **Tuesday 6:30-7:10pm** - Active: 1, Open: 0 - McDonnell, Kathryn - Yellow Pool
- **Tuesday 7:00** - Active: 1, Open: 0 - Trejo, Kassty - Yellow Pool
- **Wednesday 6:20 MAKEUP** - Active: 1, Open: 1 - Carlson, Colton - Yellow Pool
- **Wednesday 7:00** (Multiple sections) - Various instructors and pools
- **Wednesday 7:10** - Active: 1, Open: 0 - Aiden B. - Orange Pool
- **Friday 7:00pm** (Multiple sections) - Various instructors

#### Break Times
- **Break** - Active: 1, Open: -1 - Delgado, Olivia - Yellow Pool - Mon 4:30PM-4:50PM
- **BREAK** - Active: 1, Open: -1 - Tellez, Matty - Orange Pool - Thu 4:20PM-4:40PM
- **BREAK** - Active: 0, Open: 1, Future: 1 - Proctor, Jenna - Yellow Pool - Thu 4:20PM-4:40PM
- **Break Time-Wed 09:40am** - Active: 1, Open: 0, Waiting: 3 - Orange Pool

#### Parent Taught Classes
- **Parent Taught Class- Tues 9:30am** - Active: 2, Open: 0, Waiting: 2/2 - Yellow Pool
- **Parent Taught: Friday 11:00am** - Active: 1, Open: 1/2, Waiting: 0 - Yellow Pool

#### Private Lessons
Multiple time slots throughout the week in both Yellow and Orange pools

### Class Status States

From screenshots, classes can be:
- **Active**: Currently running with enrolled students
- **Open**: Available for enrollment (spots remaining)
- **Full**: At capacity
- **Waitlist**: Over capacity, accepting waitlist
- **Makeup**: Makeup session available
- **Future**: Future enrollments accepted
- **Break**: Non-instructional time
- **Inactive**: Not currently offered

### Location/Zone Data

From screenshots:
- **Yellow Pool** (primary location)
- **Orange Pool** (secondary location)

**Test Data Recommendation**: Create 3-5 distinct zones/locations to test:
- Same time, different locations
- Different times, same location
- Geographic distance calculations
- Multi-location operators

### Instructor Data (From Class Assignments)

Visible instructors:
1. Jimenez, Manny
2. Proctor, Jenna
3. McDonnell, Kathryn
4. Trejo, Kassty
5. Carlson, Colton
6. Delgado, Alina
7. Delgado, Olivia
8. Griego, Joseph
9. Tellez, Matty
10. Aiden B.
11. Deus, Zaid
12. Fenn, Montana
13. Gaudez, Francisco

### Time Slots Observed

- Morning: 9:00am, 9:20am, 9:30am, 9:40am, 10:00am, 10:20am
- Afternoon: 4:00pm, 4:20pm, 4:30pm
- Evening: 6:20pm, 6:30pm, 7:00pm, 7:10pm, 7:40pm, 8:00pm, 8:10am
- Late: 9:00pm, 9:20pm, 9:30pm, 11:00am, 11:20am, 11:30am

**Pattern**: 20-minute or 40-minute classes, starting at :00, :20, or :30 past the hour

---

## Enrollment Data

### Enrollment Record Structure

```json
{
  "enrollment_id": "ENR-00001",
  "student_id": "STU-00001",
  "family_id": "FAM-00001",
  "class_id": "CLASS-00001",
  "enrollment_type": "class",
  "status": "active",
  "dates": {
    "enrolled_date": "2025-01-15",
    "start_date": "2025-01-22",
    "end_date": "2025-03-15",
    "last_attended": "2025-12-08"
  },
  "pricing": {
    "tuition": 149.00,
    "discounts": [
      {"type": "sibling", "amount": 10.00},
      {"type": "early_bird", "amount": 5.00}
    ],
    "total": 134.00,
    "billing_schedule": "monthly"
  },
  "payment_status": "current",
  "attendance": {
    "attended": 8,
    "excused": 1,
    "unexcused": 0,
    "makeups_available": 1,
    "makeups_used": 0
  },
  "special_attributes": {
    "is_trial": false,
    "is_makeup": false,
    "transferred_from": null,
    "waitlist_position": null
  }
}
```

### Enrollment Status States

From screenshots:
- **ACTIVE** (green background) - Currently enrolled and attending
- **WAIT** (yellow background) - On waitlist
- **DROPPED** - Withdrawn from class
- **TRIAL** (icon indicator) - Trial enrollment
- **TRANSFERRED** - Moved to different class

### Sample Enrollment Data (From Screenshots)

1. **Abu Hanna, Giselle** (3y 4m, Female)
   - Type: Parent Taught Class
   - Event: Parent Taught Class: Tues 9:30am
   - Schedule: Tue 9:30AM - 9:50AM
   - Level: Parent Taught Classes
   - Zone: Yellow Pool
   - Instructor: Aiden R.
   - Dates: 11/05/2025

2. **Abu Hanna, Maysa** (4y 5m, Female)
   - Type: Private Lessons
   - Event: Private Lessons-Wed 4:40pm
   - Schedule: Wed 4:40PM - 5:00PM
   - Level: Yellow Pool
   - Instructor: Kassty Trejo
   - Dates: 09/25/2025

3. **Ackley, David** (9y 5m, Male)
   - Type: Private Lesson
   - Event: Private Lesson- Sat 9:50am
   - Schedule: Sat 9:50AM - 10:10AM
   - Zone: Yellow Pool
   - Instructor: Joseph Griego
   - Dates: 10/18/2025

4. **Adams, Dusty** (9y 5m, Male)
   - Type: Private Lesson
   - Event: Private Lesson -Tues 4:05pm
   - Schedule: Tue 4:00PM - 4:20PM
   - Zone: Yellow Pool
   - Instructor: Kassty Trejo
   - Dates: 08/05/2025

5. **Adams, Jackson** (9y 5m, Male) - Multiple Enrollments
   - Enrollment 1: Private Lesson -Thurs 12:00pm - Thu 12:00PM - 12:20PM - ACTIVE
   - Enrollment 2: Private Lesson - Wed 9:20am - Wed 9:20AM - 9:40AM - WAIT
   - Enrollment 3: Private Lesson- Wed 9:20am - Wed 9:00AM - 9:20AM - WAIT
   - Enrollment 4: Private Lessons -Wed 9:40am - Wed 9:40AM - 10:00AM - WAIT

### Enrollment Test Scenarios

1. **Single Enrollment** - One student, one class
2. **Multi-Enrollment** - One student, multiple classes
3. **Sibling Enrollment** - Multiple students from same family, same class
4. **Mixed Status** - Family with active and waitlist enrollments
5. **Trial Conversion** - Trial enrollment converting to paid
6. **Dropped Enrollment** - Mid-season withdrawal
7. **Transfer Enrollment** - Moving from one class to another
8. **Waitlist Promotion** - Moving from waitlist to active when spot opens

---

## Staff Data

### Staff Record Structure

```json
{
  "staff_id": "STAFF-00001",
  "username": "mjenenez",
  "first_name": "Manny",
  "last_name": "Jimenez",
  "email": "gold.vs.red@gmail.com",
  "phone": "831-320-9424",
  "roles": ["coach", "instructor"],
  "user_groups": ["Coach/Instructor"],
  "permissions": {
    "can_take_attendance": true,
    "can_modify_schedule": false,
    "can_view_payments": false,
    "can_message_families": true
  },
  "availability": {
    "monday": ["19:00-22:00"],
    "tuesday": ["09:00-12:00", "16:00-20:00"],
    "wednesday": ["19:00-22:00"],
    "thursday": [],
    "friday": ["19:00-22:00"],
    "saturday": ["08:00-12:00"],
    "sunday": []
  },
  "certifications": [
    {
      "type": "CPR",
      "expires": "2026-03-15"
    },
    {
      "type": "First Aid",
      "expires": "2026-03-15"
    }
  ],
  "status": "active"
}
```

### Sample Staff Data (From Screenshots)

1. **Aiden B.**
   - Username: `abarge`
   - User Groups: Front Desk, Coach/Instructor
   - Phone: 714-353-9038
   - Email: aidenb816@gmail.com

2. **Aiden R.**
   - Username: `arocha`
   - User Groups: Coach/Instructor
   - Phone: 714-363-6228
   - Email: aidenr0306@gmail.com

3. **Berzansky, Josh**
   - Username: `vorgesusa`
   - User Groups: Point of Sales
   - Phone: No Phone Numbers Set (red flag)
   - Email: josh@vorgesusa.com

4. **Carlson, Colton**
   - Username: `ccarlson`
   - User Groups: Front Desk, Coach/Instructor
   - Phone: 951-987-1314
   - Email: carlsoncolton@groton.me

5. **Cortes, Jessi**
   - Username: `jcortes`
   - User Groups: **Admin** (red text)
   - Phone: 909-581-2343
   - Email: Jessi@aquaduks.com

6. **Delgado, Alina**
   - Username: `adelgado`
   - User Groups: Front Desk, Coach/Instructor
   - Phone: 562-457-7630
   - Email: delgadalina177@gmail.com

7. **Delgado, Olivia**
   - Username: `odelgado`
   - User Groups: Coach/Instructor
   - Phone: 562-504-9718
   - Email: delgado.olivia76@gmail.com

8. **Deus, Zaid**
   - Username: `zdeus`
   - User Groups: Coach/Instructor
   - Phone: 714-650-4228
   - Email: zaid.deus117@gmail.com

9. **Fenn, Montana**
   - Username: `mfenn`
   - User Groups: Front Desk, Coach/Instructor
   - Phone: 714-402-7334
   - Email: montanafenn22@gmail.com

10. **Gaudez, Francisco**
    - Username: `fgaudez`
    - User Groups: **Admin** (red text)
    - Phone: 951-824-4684
    - Email: mendezgarciafrancisco1@gmail.com

### Staff Roles/User Groups

From screenshots:
1. **Coach/Instructor** - Teaches classes, takes attendance
2. **Front Desk** - Handles check-in, enrollment, basic admin
3. **Admin** - Full system access (displayed in red)
4. **Point of Sales** - Retail/merchandise transactions

### Staff Test Scenarios

1. **Full-Time Instructor** - 30+ hours/week, multiple classes
2. **Part-Time Instructor** - 10-15 hours/week, limited availability
3. **Multi-Role Staff** - Front desk + instructor
4. **Admin User** - Full permissions
5. **Substitute Instructor** - Occasional fill-in
6. **Incomplete Profile** - Missing contact info or certifications

---

## Payment/Transaction Data

### Payment Record Structure

```json
{
  "transaction_id": "TXN-00001",
  "family_id": "FAM-00001",
  "transaction_type": "payment",
  "amount": 149.00,
  "payment_method": {
    "type": "credit_card",
    "last_four": "4521",
    "brand": "Visa",
    "expiry": "12/26"
  },
  "status": "completed",
  "gateway_response": {
    "transaction_id": "ch_1234567890",
    "processor": "Stripe",
    "timestamp": "2025-01-15T14:30:00Z"
  },
  "related_charges": ["CHG-00001"],
  "refunds": [],
  "notes": ""
}
```

### Payment Dashboard Metrics (From Screenshot)

**Summary Data:**
- Total Sales: 597 transactions
- Total Refunds: 4 transactions
- Total Chargebacks: 1 transaction
- Total Net Sales: $106,155.92
- Total Chargeback/Return: ($155.67)
- Total Fees: ($2,946.51)
- Total Net Amount: $103,053.74

**Daily Breakdown:**
- 12/05/2025: 13 sales, 0 refunds, 1 chargeback - Net Sales: $1,697.45, Chargeback: ($155.67), Fees: ($42.86), Net: $1,498.92
- 12/04/2025: 25 sales, 0 refunds, 0 chargebacks - Net Sales: $4,079.70, Fees: ($116.13), Net: $3,963.57
- 12/03/2025: 556 sales, 4 refunds, 0 chargebacks - Net Sales: $99,908.52, Fees: ($2,774.38), Net: $97,134.14
- 12/02/2025: 1 sale, 0 refunds - Net Sales: $156.75, Fees: ($4.38), Net: $152.37
- 12/01/2025: 2 sales, 0 refunds - Net Sales: $313.50, Fees: ($8.76), Net: $304.74

### Transaction Types

From screenshots:
1. **Class Tuition Charges** - Regular enrollment tuition
2. **Camp Tuition Charges** - Multi-day camp registration
3. **Appointment Tuition Charges** - Private lesson fees
4. **Class Drops** - Refunds for withdrawals
5. **Late Charges** - Late payment fees
6. **Anniversary Charges** - Recurring annual fees
7. **Payments** - Actual payment transactions
8. **Statements** - Account balance statements
9. **Credits** - Account credits
10. **Gateway Transactions** - Payment processor records

### Payment Test Scenarios

1. **Successful Payment** - Card processed successfully
2. **Failed Payment** - Declined card
3. **Payment Plan** - Installment billing
4. **Refund Request** - Full or partial refund
5. **Chargeback** - Disputed charge
6. **Split Payment** - Multiple payers for one enrollment
7. **Late Payment** - Overdue balance
8. **Early Bird Discount** - Time-based discount applied
9. **Multi-Child Discount** - Sibling discount
10. **Scholarship/Voucher** - Non-standard payment method

---

## Communication Data

### Communication Record Structure

```json
{
  "message_id": "MSG-00001",
  "family_id": "FAM-00001",
  "type": "email",
  "template": "registration_confirmation",
  "subject": "Connor is registered for Soccer!",
  "body": "...",
  "sent_date": "2025-01-15T14:35:00Z",
  "status": "delivered",
  "opened": true,
  "clicked": false,
  "channel": "email",
  "trigger": "enrollment_created",
  "metadata": {
    "student_name": "Connor",
    "class_name": "Wednesday Soccer",
    "start_date": "2025-01-22"
  }
}
```

### Communication Types (Inferred from Autopilot)

From screenshots:
1. **Registration Confirmation** - Enrollment created trigger
2. **Payment Receipt** - Payment completed trigger
3. **Class Reminder** - Scheduled 24h before class
4. **Policy Acceptance Request** - Missing waiver trigger
5. **Dropped Enrollment Follow Up** - Enrollment dropped trigger
6. **Invalid Payment Method** - Payment method marked invalid trigger
7. **Mobile App Prompt** - New enrollment without app download
8. **New Family Welcome** - Family created trigger

### Communication Test Scenarios

1. **Welcome Sequence** - New family onboarding (3-5 messages)
2. **Registration Confirmation** - Immediate after enrollment
3. **Payment Reminder** - Upcoming payment due
4. **Class Reminder** - 24 hours before class
5. **Cancellation Notice** - Class cancelled
6. **Abandoned Cart Recovery** - 1hr, 24hr, 72hr follow-up
7. **Re-enrollment Campaign** - End of season prompt
8. **Birthday Message** - Student birthday
9. **Milestone Celebration** - Achievement reached
10. **Feedback Survey** - Post-season satisfaction

---

## Test Scenario Sets

### Scenario Set 1: Happy Path Registration

**Family**: Roberts family
- Guardian: Sandra Roberts, complete contact info
- Student: Connor, age 4, male
- Class: Wednesday Soccer, 4:00 PM, 2 spots available
- Payment: Valid Visa card on file
- Waivers: All signed

**Expected Flow**:
1. Parent initiates registration
2. Kai identifies available class matching preferences
3. Payment processed successfully
4. Confirmation sent immediately
5. Calendar invite delivered
6. Welcome sequence begins

**Test Coverage**:
- REG-001 to REG-105 (Registration features)
- PAY-001, PAY-201, PAY-202 (Payment processing)
- COMM-001 (Registration confirmation)

### Scenario Set 2: Sibling Enrollment

**Family**: Martinez family
- Guardian: Maria Martinez
- Students: Sofia (5), Diego (7), Isabella (9)
- Class: Same class, 5 spots available
- Payment: Auto-discount applied
- Enrollment: Sequential

**Expected Flow**:
1. First child enrolled (full price)
2. Second child enrolled (10% discount auto-applied)
3. Third child enrolled (15% discount auto-applied)
4. Single payment for all three
5. Confirmation includes all children

**Test Coverage**:
- REG-006 (Multi-child registration)
- PAY-104 (Multi-child discounts)
- Data model handles sibling relationships

### Scenario Set 3: Waitlist with Alternatives

**Family**: Johnson family
- Guardian: Ashley Johnson
- Student: Emma, age 5
- Class: Tuesday 4:00 PM (FULL)
- Available Alternatives: Tuesday 5:00 PM, Wednesday 4:00 PM

**Expected Flow**:
1. Requested class is full
2. Kai suggests adjacent day (Wednesday 4:00 PM)
3. Parent accepts alternative
4. Enrollment completed without waitlist
5. Confirmation sent

**Test Coverage**:
- REG-301 to REG-308 (Waitlist intelligence)
- Kai's conversational alternative suggestions

### Scenario Set 4: Payment Failure Recovery

**Family**: Anderson family
- Guardian: Mark Anderson
- Student: Jake, age 6
- Enrollment: Active
- Payment Method: Card expires this month
- Status: Payment failed

**Expected Flow**:
1. Automatic payment fails
2. PAYBOT detects failure
3. SOLVOBOT initiates recovery sequence
4. Parent receives notification (email + SMS)
5. Parent updates payment method
6. Retry successful

**Test Coverage**:
- PAY-203 (Failed payment detection)
- PAY-204 (Payment recovery sequence)
- SOLVOBOT responsibilities

### Scenario Set 5: Abandoned Cart Recovery

**Family**: Wilson family
- Guardian: Jennifer Wilson
- Student: Tyler, age 7
- Cart Status: Registration started, not completed
- Time: 2 hours ago
- Issue: Unclear pricing display

**Expected Flow**:
1. Registration abandoned after viewing price
2. SOLVOBOT detects abandonment after 1 hour
3. First follow-up message sent (email)
4. 24 hours: Second follow-up (SMS)
5. 72 hours: Final follow-up with special offer
6. Parent completes registration

**Test Coverage**:
- COMM-201 (Abandoned cart recovery)
- SOLVE-001 to SOLVE-003 (Cart detection and recovery)

### Scenario Set 6: Class Transfer Request

**Family**: Brown family
- Guardian: Sarah Brown
- Student: Olivia, age 8
- Current: Tuesday 4:00 PM class
- Request: Move to Thursday 5:00 PM

**Expected Flow**:
1. Parent requests transfer via conversation
2. SOLVOBOT checks Thursday class availability (2 spots open)
3. Calculates any price difference (none)
4. Processes transfer
5. Updates calendar automatically
6. Sends confirmation of change

**Test Coverage**:
- Transfer workflow (needs to be added to KAIRO plan)
- SOLVOBOT problem resolution
- Calendar synchronization

### Scenario Set 7: Incomplete Profile Registration

**Family**: Davis family (incomplete data)
- Guardian: First name only, missing phone
- Student: Alex, age unknown
- Payment Method: None on file

**Expected Flow**:
1. Kai detects missing critical information
2. Prompts conversationally: "What's Alex's age?"
3. Requests payment method
4. Guides through waiver signing
5. Completes profile during registration
6. Successful enrollment with complete data

**Test Coverage**:
- DATABOT data validation
- Progressive disclosure pattern
- Error handling and recovery

### Scenario Set 8: Multi-Location Operator

**Organization**: Soccer Shots franchise (3 locations)
- Locations: North Park, South Hills, East Valley
- Classes: Same program across all locations
- Parent: Lives between North Park and South Hills

**Expected Flow**:
1. Parent: "Sign up for soccer"
2. Kai: "I found classes at 2 locations near you..."
3. Shows North Park (2 miles) and South Hills (3 miles)
4. Parent selects based on convenience
5. Location-specific instructor assigned
6. Confirmation includes location details

**Test Coverage**:
- REG-303, REG-304 (Location alternatives)
- Geographic search/ranking
- Multi-location data model

### Scenario Set 9: Trial to Paid Conversion

**Family**: Taylor family
- Guardian: Michael Taylor
- Student: Ryan, age 6
- Enrollment Type: Free trial (1 session)
- Trial Date: Completed successfully

**Expected Flow**:
1. Trial session completed
2. Coach provides positive feedback
3. Automated follow-up: "Ready to continue?"
4. Parent responds: "Yes"
5. Trial converted to paid enrollment
6. First payment processed
7. Celebration message sent

**Test Coverage**:
- Trial enrollment tracking (add to plan)
- Conversion workflow
- COMM-102 to COMM-104 (Lifecycle communications)

### Scenario Set 10: Season Re-Enrollment

**Family**: Garcia family (existing customer)
- Guardian: Carmen Garcia
- Student: Sofia, age 7
- Status: Completed fall season, not enrolled for spring
- Historical: Excellent attendance, no payment issues

**Expected Flow**:
1. Two weeks before spring season
2. COMMBOT sends re-enrollment prompt
3. Parent: "Sign Sofia up for spring"
4. Kai: "Same Wednesday 4:00 PM class?"
5. Parent: "Yes"
6. Pre-filled with Sofia's data
7. Payment method on file (Visa ending 4521)
8. One-click enrollment
9. Total time: Under 60 seconds

**Test Coverage**:
- REG-208 (Historical preference learning)
- COMM-202 (Re-enrollment campaigns)
- RETAIN-101 to RETAIN-108 (Retention features)

---

## Data Generation Guidelines

### Volume Recommendations

For comprehensive testing, generate:
- **20-30 families** (various configurations)
- **40-60 students** (avg 2 per family)
- **15-20 classes** (various times, locations, instructors)
- **80-120 enrollments** (mix of active, waitlist, dropped)
- **10-15 staff members** (coaches + admin)
- **200+ transactions** (payments, refunds, credits)
- **500+ communication records** (automated messages)

### Data Quality Rules

1. **Realistic Names**
   - Use iClassPro screenshots as reference
   - Include diverse ethnic backgrounds
   - Mix of common and uncommon names

2. **Realistic Contact Info**
   - Valid phone format: (714) 625-1589 or 714-625-1589
   - Valid email: firstname.lastname@domain.com
   - Real ZIP codes for target markets

3. **Age Distribution**
   - 60% ages 4-8 (primary youth sports range)
   - 20% ages 9-12 (older elementary)
   - 10% ages 2-3 (toddler programs)
   - 10% ages 13-15 (teen programs)

4. **Enrollment Status Distribution**
   - 75% active enrollments
   - 15% waitlist
   - 8% dropped (for testing retention)
   - 2% trial (for testing conversion)

5. **Payment Method Distribution**
   - 70% valid credit cards on file
   - 15% valid but expiring soon
   - 10% no payment method (testing)
   - 5% failed/invalid (testing recovery)

### Data Relationships

Ensure referential integrity:
- Every student belongs to exactly one family
- Every enrollment links to valid student + class
- Every transaction links to valid family + enrollment
- Every communication links to valid family
- Every class has valid instructor + location

### Special Test Cases

Include edge cases:
1. **Very Long Names** - Test display/truncation
2. **Special Characters** - Names with apostrophes, hyphens, accents
3. **Twins/Triplets** - Same age siblings
4. **Large Age Gaps** - Siblings 10+ years apart
5. **Complex Scheduling** - Student in 3+ classes
6. **High-Value Customers** - Families with $5K+ annual spend
7. **At-Risk Customers** - Patterns suggesting churn
8. **New vs. Returning** - Mix of first-time and multi-season families

---

## Sample SQL Seed Data Structure

```sql
-- Families Table
INSERT INTO families (id, family_name, created_at, status) VALUES
('FAM-00001', 'Roberts', '2024-03-15', 'active'),
('FAM-00002', 'Johnson', '2024-04-22', 'active'),
('FAM-00003', 'Martinez', '2024-05-10', 'active');

-- Guardians Table
INSERT INTO guardians (id, family_id, first_name, last_name, relationship, phone, email, is_primary) VALUES
('GUARD-00001', 'FAM-00001', 'Sandra', 'Roberts', 'mother', '714-625-1589', 'sandra.roberts@email.com', true),
('GUARD-00002', 'FAM-00001', 'Michael', 'Roberts', 'father', '714-625-1590', 'michael.roberts@email.com', false),
('GUARD-00003', 'FAM-00002', 'Ashley', 'Johnson', 'mother', '714-555-0123', 'ashley.johnson@email.com', true);

-- Students Table
INSERT INTO students (id, family_id, first_name, last_name, dob, gender) VALUES
('STU-00001', 'FAM-00001', 'Connor', 'Roberts', '2019-08-15', 'male'),
('STU-00002', 'FAM-00001', 'Emma', 'Roberts', '2017-03-22', 'female'),
('STU-00003', 'FAM-00002', 'Tyler', 'Johnson', '2018-11-05', 'male');

-- Classes Table
INSERT INTO classes (id, name, program, day_of_week, start_time, location, instructor_id, max_capacity) VALUES
('CLASS-00001', 'Wednesday Soccer 4pm', 'Youth Soccer', 'Wednesday', '16:00:00', 'North Park', 'INST-001', 12),
('CLASS-00002', 'Thursday Soccer 5pm', 'Youth Soccer', 'Thursday', '17:00:00', 'South Hills', 'INST-002', 12),
('CLASS-00003', 'Saturday Soccer 9am', 'Youth Soccer', 'Saturday', '09:00:00', 'North Park', 'INST-001', 15);

-- Enrollments Table
INSERT INTO enrollments (id, student_id, class_id, status, start_date, tuition_amount) VALUES
('ENR-00001', 'STU-00001', 'CLASS-00001', 'active', '2025-01-22', 149.00),
('ENR-00002', 'STU-00002', 'CLASS-00001', 'active', '2025-01-22', 134.10),
('ENR-00003', 'STU-00003', 'CLASS-00002', 'waitlist', '2025-01-22', 149.00);
```

---

## Appendix: iClassPro Data Patterns

### Observed Data Quality Issues

From screenshots, these real-world issues should be included in test data:
1. **Age Data Entry Error**: "27y 11m" (likely should be "2y 11m")
2. **Missing Phone Numbers**: Red flag shown for incomplete records
3. **Missing Email Addresses**: Red flag shown
4. **Missing Gender**: "Gender not specified" shown
5. **Invalid Payment Methods**: System flags for follow-up

**Recommendation**: Include 5-10% of test records with data quality issues to test validation and recovery workflows.

### Name Format Variations

iClassPro accepts multiple formats:
- `FirstName LastName` (standard)
- `LastName, FirstName` (formal)
- `FirstName` only (informal)
- `LastName, FirstName MiddleInitial.`
- Special characters: apostrophes, hyphens, accents

**Recommendation**: Test data should include all format variations to ensure KAIRO handles them correctly.

### Multi-Cultural Names

Observed patterns suggest diverse demographics:
- Hispanic/Latino: Martinez, Garcia, Delgado
- Middle Eastern: Aabid, Abdinanti, Aboulfree
- Asian: Abu Hanna, Abourqeba
- European: Roberts, Johnson, Wilson

**Recommendation**: Test data should reflect demographic diversity of target markets.

---

**Document Status**: Complete  
**Usage**: Use this specification to generate comprehensive test data for KAIRO development, ensuring coverage of all edge cases and realistic scenarios observed in production systems like iClassPro.

**Next Steps**: 
1. Generate seed data SQL scripts
2. Create API test fixtures
3. Build Faker.js/test data generator
4. Populate Supabase test database
5. Validate data relationships and integrity