# NBC Sports Engine Data Insights - KAIRO Update Plan

**Created:** December 17, 2025
**Source:** NBC Sports Engine Analysis (661 registrations from Soccer Shots OC)
**Purpose:** Actionable updates for Build Plan, Demo, Sample Data, and Test Data Dashboard

---

## Executive Summary of Key Insights

| Insight | Current State | Action Required |
|---------|---------------|-----------------|
| Preschool Partnerships = 74.8% of revenue | Not reflected in demo/data | Add preschool program type and scenarios |
| 86.4% Pay in Full | Payment plans emphasized | Show pay-in-full as primary, plans secondary |
| 92.3% Weekday Registration | Not tracked | Add registration timing analytics |
| 8.1% Multi-Child Families | Demo shows this | Update sibling discount to $50-60 range |
| $200-250 Price Sweet Spot | Prices vary widely | Standardize test data pricing |
| Age 3-5 = 65% of registrations | Covered | Emphasize in recommendations |
| Irvine = 19.4% of registrations | Generic locations | Add realistic OC geography |

---

## 1. BUILD PLAN UPDATES

### New Section: Preschool Partnership Features (Stage 3 or 5)

**Priority: HIGH** - Represents 74.8% of revenue in real data

```markdown
### Preschool Partnership Module

**Business Context:** NBC data shows preschool partnerships generate 74.8% of registration
revenue vs 25.2% from community programs. This segment requires dedicated features.

**Key Features:**
- [ ] Preschool admin portal for partner schools
- [ ] Bulk enrollment support (school submits roster)
- [ ] Partner-specific agreement management
- [ ] Enrollment deadline reminders to school contacts
- [ ] Partner billing and invoicing
- [ ] Background registration (parent completes, class during school hours)
- [ ] School-specific discount codes
- [ ] Partner performance dashboard
```

### Update Stage 3: Payments & Retention

Add payment display psychology insights:

```markdown
### Payment Display Psychology (Data-Driven)

**NBC Insight:** 86.4% pay in full, only 8% use payment plans

**Implementation:**
- [ ] Default display: Pay in Full with savings indicator
- [ ] Show monthly equivalent for context: "$208 total ($26/class)"
- [ ] Payment plan as secondary option, not primary
- [ ] "Most families pay in full" social proof messaging
- [ ] Quick checkout for returning families with saved cards
```

### Update Stage 2: Smart Recommendations

Add smart defaults based on NBC data:

```markdown
### Smart Defaults (Data-Driven)

**NBC Insights:**
- Age 3-4 → Mini/Classic program (41.8% of registrations)
- Age 4-5 → Classic program (23.4%)
- Age 3 → XXS shirt (27.5%)
- Age 4-5 → XS shirt (56.3%)

**Implementation:**
- [ ] Age → Program auto-suggestion
- [ ] Age → Shirt size default (reduce decision fatigue)
- [ ] Zip code → Nearest venues (top 3)
- [ ] Returning family → Previous preferences pre-filled
```

### Update Data Integration Priority Table

```markdown
| Source | Priority | Status | Notes |
|--------|----------|--------|-------|
| iClass | Complete | DONE | Data structure and features integrated |
| Configio | **URGENT** | PENDING | Being sunset soon |
| NBC Sports Engine | **HIGH** | PENDING | 74.8% preschool revenue insight critical |
```

### New Section: Registration Timing Insights

```markdown
### Registration Timing Patterns (NBC Data)

**When Parents Register:**
- Monday-Friday: 92.3%
- Saturday-Sunday: 7.7%
- Peak day: Thursday (22.1%)

**KAIRO Implications:**
- Mobile-first validated (parents away from home computers)
- Quick completion essential (limited work-break windows)
- Abandoned cart recovery should target evenings (6-8 PM)
- Save progress crucial (interruptions guaranteed)
```

---

## 2. DEMO UPDATES

### New Demo Scenarios to Add

```typescript
// Preschool Program Registration
{
  label: 'Preschool program registration',
  category: 'Preschool',
  initialMessage: "My daughter goes to Milestones Montessori in Irvine. They offer Soccer Shots - how do I register?"
}

// Pay in Full (Primary Path)
{
  label: 'Quick checkout - Pay in full',
  category: 'Pricing',
  initialMessage: "I just want to pay the full amount now and be done with registration"
}

// Geographic/Zip-based
{
  label: 'Zip code search',
  category: 'Location',
  initialMessage: "I'm in 92618 - what classes are near me?"
}

// Shirt size auto-suggestion
{
  label: 'Equipment included',
  category: 'Programs',
  initialMessage: "Does the program include a jersey? My son is 4."
}
```

### Update Sibling Discount Response

Current:
```
• Sibling discount: -$60
```

Should reflect NBC data (25% off second child):
```
• 2nd child: 25% off ($56 savings)
• 3rd child: 25% off ($56 savings)
```

### Add Preschool Demo Response

```typescript
'preschool': {
  role: 'assistant',
  content: "Great! Milestones Montessori is one of our partner schools. Soccer Shots runs during school hours on Wednesdays.\n\n**Milestones Montessori - Classic Soccer**\n• Wednesdays during school hours\n• 8-week session: $208\n• Jersey included (I'll auto-select size based on age)\n\nWould you like to register now?",
  quickReplies: ['Register now', 'What size jersey?', 'See other preschools']
}
```

---

## 3. TEST DATA DASHBOARD UPDATES

### New Summary Cards to Add

```tsx
// Preschool vs Community breakdown
<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
  <div className="text-gray-400 text-sm mb-2">Preschool Programs</div>
  <div className="text-3xl font-bold text-emerald-400">
    {sessions.filter(s => s.location_type === 'preschool').length}
  </div>
  <div className="text-xs text-gray-500">74% of revenue in real data</div>
</div>

// Payment Distribution
<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
  <div className="text-gray-400 text-sm mb-2">Pay in Full</div>
  <div className="text-3xl font-bold text-blue-400">86%</div>
  <div className="text-xs text-gray-500">vs 8% payment plans</div>
</div>
```

### New Analytics Section

```tsx
// Geographic Distribution (Top Cities)
<div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution (NBC Benchmark)</h3>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="text-center">
      <div className="text-2xl font-bold text-white">19.4%</div>
      <div className="text-sm text-gray-400">Irvine</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-white">6.7%</div>
      <div className="text-sm text-gray-400">Tustin</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-white">4.7%</div>
      <div className="text-sm text-gray-400">Lake Forest</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-white">4.7%</div>
      <div className="text-sm text-gray-400">Orange</div>
    </div>
  </div>
</div>

// Registration Day Distribution
<div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">When Parents Register (NBC Benchmark)</h3>
  <div className="flex items-end gap-2 h-32">
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full bg-blue-500 rounded-t" style={{height: '75%'}}></div>
      <div className="text-xs text-gray-400 mt-1">Mon</div>
      <div className="text-xs text-gray-500">20.6%</div>
    </div>
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full bg-blue-500 rounded-t" style={{height: '65%'}}></div>
      <div className="text-xs text-gray-400 mt-1">Tue</div>
      <div className="text-xs text-gray-500">17.7%</div>
    </div>
    <!-- etc -->
  </div>
</div>
```

### New Location Type Column

Add to sessions table:
- `location_type`: 'preschool' | 'community'
- Display with color coding (green for preschool, blue for community)

---

## 4. SAMPLE DATA UPDATES

### Database Migration: Add Location Type

```sql
-- Add location_type to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'community';

-- Update existing locations
UPDATE locations SET location_type = 'preschool'
WHERE name ILIKE '%montessori%' OR name ILIKE '%preschool%' OR name ILIKE '%school%';
```

### New Preschool Partner Locations

Based on NBC data top venues:

```sql
INSERT INTO locations (organization_id, name, address, location_type) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Milestones Montessori Irvine', '100 Education Way, Irvine, CA 92618', 'preschool'),
('550e8400-e29b-41d4-a716-446655440000', 'Piper Preschool', '200 Learning Lane, Tustin, CA 92780', 'preschool'),
('550e8400-e29b-41d4-a716-446655440000', 'Bella Montessori', '300 Child Care Blvd, Lake Forest, CA 92630', 'preschool'),
('550e8400-e29b-41d4-a716-446655440000', 'LiMai Montessori', '400 Early Ed Dr, Buena Park, CA 90620', 'preschool'),
('550e8400-e29b-41d4-a716-446655440000', 'Montessori Academy on the Ranch', '500 Ranch Rd, Rancho Mission Viejo, CA 92694', 'preschool');
```

### Update Pricing to $200-250 Sweet Spot

```sql
-- Update program pricing to match NBC sweet spot
UPDATE programs SET price_cents = 20800 WHERE name = 'Mini Soccer';     -- $208
UPDATE programs SET price_cents = 22400 WHERE name = 'Junior Soccer';   -- $224
UPDATE programs SET price_cents = 24000 WHERE name = 'Classic Soccer';  -- $240
UPDATE programs SET price_cents = 24900 WHERE name = 'Premier Soccer';  -- $249
```

### Add Shirt Size to Children

```sql
-- Add shirt_size to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Smart defaults based on age
UPDATE children SET shirt_size = 'XXS (2T-3T)' WHERE EXTRACT(YEAR FROM AGE(date_of_birth)) < 4;
UPDATE children SET shirt_size = 'XS (4T-5T)' WHERE EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 4 AND 5;
UPDATE children SET shirt_size = 'S (Youth 6-8)' WHERE EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 6 AND 8;
```

### Realistic Parent/Child Names (from NBC data)

```sql
-- Sample realistic names from NBC data
-- Parents
('Acevedo', 'Austin'), ('Anderson', 'Josh'), ('Bansal', 'Maneesh'),
('Brown', 'Sara'), ('Kim', 'Dayeon'), ('Morgan', 'Lindsay'),
('Hornstein', 'Jennifer'), ('Pho', 'Michael')

-- Children
('Leo', 'Acevedo'), ('Mila', 'Anderson'), ('Sophia', 'Bansal'),
('Seungyeon', 'Bae'), ('Zahra', 'Hornstein'), ('Emmy', 'Pho')
```

---

## 5. PRIORITY IMPLEMENTATION ORDER

### Phase 1: Immediate (High Impact, Low Effort)
1. Add preschool demo scenario to DemoChat.tsx
2. Update sibling discount amounts in demo responses
3. Add location_type to database schema
4. Update pricing to $200-250 range

### Phase 2: Dashboard Enhancement
1. Add preschool vs community breakdown card
2. Add registration timing visualization
3. Add geographic distribution section
4. Add NBC benchmark comparisons

### Phase 3: Build Plan Updates
1. Add Preschool Partnership Module section
2. Update Data Integration Priority
3. Add Registration Timing Insights section
4. Add Smart Defaults section

### Phase 4: Comprehensive Data Update
1. Add preschool partner locations to seed data
2. Add shirt size field and defaults
3. Update family/child names to realistic patterns
4. Add 74/26 preschool/community session split

---

## Key Metrics to Track Post-Implementation

| Metric | NBC Benchmark | KAIRO Target |
|--------|---------------|--------------|
| Preschool Revenue % | 74.8% | Track split |
| Pay in Full Rate | 86.4% | > 80% |
| Multi-Child Rate | 8.1% | Track & optimize |
| Weekday Registration | 92.3% | Mobile-first validation |
| Avg Price Point | $206 | $200-250 range |
| Sibling Discount | $50-60 | Auto-apply |

---

*This document serves as the action plan for incorporating NBC Sports Engine competitive intelligence into KAIRO development.*
