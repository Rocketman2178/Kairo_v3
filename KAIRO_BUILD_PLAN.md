# Kairo Platform - Strategic Build Plan

**Version:** 2.8
**Last Updated:** January 5, 2026
**Current Stage:** Stage 2 In Progress (Architecture Migration Complete, Voice Registration Next)

---

## Customer Feedback Integration (January 2026)

This version incorporates detailed customer feedback received in January 2026, adding significant enhancements to:
- Coach App (Incident Reports, Curriculum Timer, Smart Scheduling)
- Payments (3 Payment Plan Types, Fees, Apple Pay, Biometric Login)
- Business Intelligence (Proactive Chat, Churn Prevention)
- Marketing (Employee Referrals, Tipping System, Ad Platform Integration)

---

## Project Timeline & Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Stage 1: Foundation | December 2, 2025 | COMPLETE |
| Stage 2: Kai Intelligence | December 2025 | IN PROGRESS |
| Stage 3: Payments & Retention | January 2026 | PLANNED |
| Entrepreneur Feedback Session | After January 8, 2026 | SCHEDULED |
| Full Platform Capability | February 2026 | TARGET |
| Adjustments & Enhancements | March 2026 | TARGET |

---

## Quality Philosophy

**CRITICAL: No MVP Approach**

This platform supports family livelihoods - business owners depend on it for their income. Therefore:

- The platform **cannot be a Minimum Viable Product (MVP)**
- Every feature must be **production-ready** at rollout
- High level of completion required before launch
- Thorough testing with real-world scenarios
- Entrepreneur feedback incorporated before release

---

## Accuracy Target

| Metric | Previous Architecture | New Architecture (N8N + Gemini) |
|--------|----------------------|--------------------------------|
| Use Case Accuracy | 80-90% | **99% Target** |
| Edge Case Handling | Struggled | Robust context preservation |
| Conversational Context | Lost frequently | Maintained across turns |

---

## Mission Statement

Transform youth sports registration from an 18-20 minute painful process into a seamless sub-5-minute (targeting 3 minutes) conversational experience using AI-powered registration with voice and text support.

**Core Value Proposition:** "Registration in 3 Minutes, Not 20"

---

## Architecture Decisions

### AI Model Strategy
- **Primary Model:** Google Gemini Flash (`gemini-2.0-flash-exp`)
  - Fast response times (<500ms)
  - Cost-effective for high-volume conversations
  - Strong natural language understanding
  - Good at structured data extraction
  - JSON response mode for reliable parsing

### Integration Pattern (Updated December 10, 2025)
- **N8N Workflow** as primary AI orchestration layer
- **Frontend → N8N Webhook → Gemini → Response** flow
- **N8N queries Supabase** for session data via RPC functions
- **Database views and functions** optimized for n8n queries
- **Real-time subscriptions** for live availability updates

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

### Architecture Benefits (N8N Approach)
- **Visual Workflow Management**: See and modify entire conversation flow visually
- **No Code Deployments**: Update AI prompts and logic without deploying
- **Centralized AI Logic**: All intelligence in one manageable location
- **Better Debugging**: Visual execution logs and step-by-step tracing
- **Easy Integration**: Add new services (Twilio, SendGrid) with drag-and-drop
- **Flexibility**: Route to different AI models based on conversation state
- **Secure**: API keys stored in n8n, never exposed to frontend

### Database
- **Supabase PostgreSQL** with Row Level Security
- **Database views** for optimized n8n queries
- **Database functions** for complex operations (RPC)
- **Real-time subscriptions** for live availability
- **Multi-tenant architecture** at organization level

---

## Data Integration Priority

Integration with existing registration platforms is critical for customer migration.

| Source | Priority | Status | Notes |
|--------|----------|--------|-------|
| iClass | Complete | DONE | Data structure and features integrated |
| Configio | **URGENT** | PENDING | Being sunset soon - immediate action required |
| NBC Sports Engine | **HIGH** | ANALYZED | Critical insights: 74.8% preschool revenue, pricing patterns |

**Multi-Location Support:** Database architecture supports 120+ locations as required by Configio migration.

### NBC Sports Engine Key Insights (December 2025 Analysis)

Analysis of 661 registrations from Soccer Shots OC revealed critical business patterns:

| Insight | Value | KAIRO Implication |
|---------|-------|-------------------|
| Preschool Partnership Revenue | **74.8%** | Prioritize preschool partner portal features |
| Community Program Revenue | 25.2% | Secondary focus |
| Pay in Full Rate | **86.4%** | Show pay-in-full as primary, plans secondary |
| Payment Plan Usage | 8% | Payment plans underutilized |
| Multi-Child Families | 8.1% | Sibling discount auto-apply ($50-60 range) |
| Weekday Registration | **92.3%** | Mobile-first validated, evening cart recovery |
| Age 3-5 Years | 65% | Age-based program suggestions critical |
| Price Sweet Spot | $200-250 | Standardize around this range |
| Top City (Irvine) | 19.4% | Zip code-based suggestions valuable |

**Smart Defaults to Implement:**
- Age 3-4 → Mini/Classic program suggestion
- Age 3 → XXS shirt size default
- Age 4-5 → XS shirt size default
- Zip code → Nearest 3 venues

### Integration Action Items
1. Obtain Configio access credentials and API documentation
2. Map Configio data schema to Kairo database
3. Build data migration scripts for families, children, registrations
4. Test migration with sample data
5. Plan cutover timeline with affected businesses

---

## Competitor Pricing Analysis

Research required to inform Kairo's tiered pricing model.

### Competitors to Analyze
| Competitor | Research Status | Key Pricing Elements |
|------------|-----------------|---------------------|
| iClass | Pending | Per-student fees, feature tiers |
| Configio | Pending | Enterprise pricing, multi-location |
| NBC Sports Engine | Pending | League/organization pricing |

### Kairo Pricing Tiers (Planned)
- **Starter** - Basic registration, limited features
- **Essentials** - Full registration + communications
- **Premium** - All features + advanced analytics + AI optimization
- **Add-ons** - Coach app messaging (Slack replacement), marketing automation

**Value Proposition:** Platform reduces customer attrition ($80K+/month documented losses) and eliminates costs for third-party tools (Slack, marketing platforms).

---

## 14-Stage Development Roadmap

### Stage 1: Foundation (COMPLETED)
**Status:** Complete
**Completion Date:** December 2, 2025

**Deliverables:**
- [x] Complete database schema (13 tables)
- [x] Row Level Security policies
- [x] Supabase client setup
- [x] Authentication system (AuthContext)
- [x] Core TypeScript types
- [x] Mobile-first UI components (Button, Input, Card)
- [x] Basic chat interface with Kai
- [x] Demo seed data (Soccer Shots Demo org)

**Files Created:**
- `src/types/database.ts` - Database types
- `src/types/conversation.ts` - Conversation types
- `src/types/registration.ts` - Registration types
- `src/lib/supabase.ts` - Supabase client
- `src/contexts/AuthContext.tsx` - Auth management
- `src/components/common/` - Reusable UI components
- `src/components/registration/ChatInterface.tsx` - Main chat UI
- `src/components/registration/MessageBubble.tsx` - Message display

**Database Tables:**
1. organizations
2. locations
3. programs
4. sessions
5. staff
6. families
7. children
8. registrations
9. conversations
10. waitlist
11. payments
12. abandoned_carts
13. communications

---

### Stage 2: Kai Intelligence & Voice (IN PROGRESS)
**Target Completion:** [TBD]

**Goals:**
- AI-powered conversational registration
- Voice input capability
- Smart class recommendations
- Waitlist prevention intelligence
- Multi-language support (English, Spanish)

**Completed Features:**

#### 2.1 AI Integration (Architecture Migrated to N8N)
- [x] N8N webhook integration for Kai conversation management
- [x] Frontend service layer (`n8nWebhook.ts`)
- [x] Conversation hook updated for n8n (`useConversation.ts`)
- [x] Database views for optimized queries
- [x] Database functions for session matching (RPC)
- [x] Intent recognition and data extraction (n8n Code node)
- [x] Context preservation across turns (conversation state)
- [x] Conversation state machine implementation
- [x] Error handling with fallback to guided forms
- [x] Age validation (2-18 years)

**Previous Edge Function Implementation (Deprecated):**
- ~~Supabase Edge Function for Kai conversation management~~
- ~~Direct Gemini API calls from Edge Functions~~
- Note: Edge functions remain in codebase but are no longer the primary AI handler

#### 2.2 Smart Recommendations
- [x] Age-based class filtering
- [x] Schedule compatibility matching (day of week, time of day)
- [x] Real-time availability checking
- [x] Session detail presentation with SessionCard UI
- [x] Coach rating display
- [x] Spots remaining urgency indicators
- [x] Session quality scoring
- [x] Up to 3 top recommendations shown
- [ ] Location-based sorting (proximity) - Deferred to later stage

#### 2.3 Waitlist Prevention
- [x] Adjacent day suggestions (Wed full -> Tue/Thu)
- [x] Alternative time slots (same location)
- [x] Alternative locations (same time)
- [x] Similar program fallback options
- [x] Match scoring algorithm (90 for adjacent days, 85 for alt times, etc.)
- [x] Database function `get_alternative_sessions()` for n8n
- [x] Integration with conversation flow
- [x] Waitlist as last resort (<20% target)

#### 2.4 Voice Registration
- [ ] Web Speech API integration
- [ ] Voice activity detection
- [ ] Speech-to-text transcription
- [ ] Text-to-speech responses
- [ ] Fallback to text input
- [ ] Visual waveform feedback

#### 2.5 Multi-Language
- [ ] English (primary)
- [ ] Spanish (secondary)
- [ ] Language detection
- [ ] Translation layer

**Files Created/Updated (December 10, 2025):**
- `src/services/ai/n8nWebhook.ts` - N8N webhook service layer (NEW)
- `src/hooks/useConversation.ts` - Updated to use n8n webhook
- `supabase/migrations/20251210204818_add_n8n_database_views.sql` - Database views for n8n
- `supabase/migrations/20251210204907_add_n8n_database_functions.sql` - Database functions for n8n
- `N8N_INTEGRATION.md` - Comprehensive n8n workflow documentation

**Legacy Files (No Longer Primary):**
- `supabase/functions/kai-conversation/index.ts` - Original Edge Function (deprecated)
- `supabase/functions/session-recommendations/index.ts` - Session matching Edge Function (deprecated)
- `supabase/functions/find-alternatives/index.ts` - Waitlist alternatives Edge Function (deprecated)
- `src/services/ai/kaiAgent.ts` - Original AI service layer (deprecated)

**Files to Create:**
- `src/hooks/useVoiceInput.ts` - Voice capture hook
- `src/components/registration/VoiceIndicator.tsx` - Voice recording UI feedback

---

### Stage 3: Payments & Retention (PLANNED)
**Target Start:** After Stage 2
**Updated:** January 2026 with customer feedback enhancements

**Goals:**
- Complete payment processing with multiple options
- Flexible payment plans (3 types)
- Cart abandonment recovery
- Re-enrollment automation
- Payment display psychology (data-driven)
- Biometric authentication

#### 3.1 Payment Processing
- [ ] Stripe integration
- [ ] Apple Pay / Google Pay
- [ ] Saved payment methods for returning families
- [ ] Failed payment recovery

#### 3.1.1 Biometric Authentication (Priority: MEDIUM) - NEW Jan 2026
**Customer Request:** Face recognition and biometric login options

- [ ] Face ID support (iOS)
- [ ] Touch ID / Fingerprint support (iOS/Android)
- [ ] Native biometric prompt integration
- [ ] Fallback to password/PIN when biometrics unavailable
- [ ] Device-level security (NO biometric data stored on servers)
- [ ] Biometric re-authentication for payment confirmation
- [ ] User preference to enable/disable biometrics

#### 3.2 Payment Plan Options (Priority: HIGH) - ENHANCED Jan 2026
**Customer Requirement:** Fully customizable payment plans with 3 distinct models

**Plan Type 1: Divided Payments**
- [ ] Calculate payment intervals based on: season length / number of payments
- [ ] Final payment must complete X days before last class (configurable by owner)
- [ ] Automatic scheduling of intermediate payments
- [ ] Example: 2-month season, 3 payments = Day 1, midpoint, 30 days before end
- [ ] Business owner sets number of payment options available (2, 3, 4, etc.)

**Plan Type 2: Subscription Model (Monthly)**
- [ ] Fixed monthly payment date (configurable, default: 7 days before next month)
- [ ] Withdrawal with notice period (default: 30 days, adjustable by owner)
- [ ] No penalty if proper notice given
- [ ] Prorated final month if applicable
- [ ] Automatic renewal handling
- [ ] Same-day-of-month billing consistency

**Plan Type 3: Two-Payment Split**
- [ ] First payment: Due immediately at registration
- [ ] Second payment: Due at season halfway point
- [ ] Automatic reminder before second payment due
- [ ] Simple, straightforward option

**Payment Fees & Markups (Business Owner Configurable):**
- [ ] Flat dollar fee option (e.g., $15 registration fee, $5 processing fee)
- [ ] Percentage markup option (e.g., 3% credit card fee)
- [ ] Fee display transparency (show breakdown to customer)
- [ ] Per-plan fee configuration (different fees for payment plans vs. pay-in-full)
- [ ] Fee waiver for pay-in-full (incentive)

#### 3.3 Payment Display Psychology (NBC Data-Driven)
**Insight:** 86.4% of parents pay in full, only 8% use payment plans

- [ ] Default to "Pay in Full" as primary option with savings indicator
- [ ] Show per-class cost: "$208 total ($26/class for 8 weeks)"
- [ ] Payment plan as secondary option, not emphasized
- [ ] "Most families pay in full" social proof messaging
- [ ] Quick checkout for returning families

#### 3.4 Cart Recovery (Timing Optimized)
**Insight:** 92.3% register Mon-Fri during work hours

- [ ] Abandoned cart detection
- [ ] Evening recovery emails (6-8 PM) - when parents have time
- [ ] Multi-touch recovery sequences
- [ ] Progress auto-save after each field
- [ ] "Continue registration" deep links

#### 3.5 Sibling Discounts (NBC Benchmarked)
**Insight:** $50-60 sibling discount standard (25% off second child)

- [ ] Auto-detect multi-child families
- [ ] Auto-apply sibling discount (25% off 2nd+ child)
- [ ] "You're saving $56!" celebration message
- [ ] "Add another child?" prompt after first completion

#### 3.6 Re-enrollment
- [ ] Re-enrollment reminders
- [ ] One-click re-enroll with previous preferences
- [ ] Returning family loyalty discount (5%)

---

### Stage 3.5: Preschool Partnership Module (PLANNED)
**Priority:** HIGH - Represents 74.8% of revenue in NBC data

**Business Context:** NBC Sports Engine data shows preschool partnerships generate
74.8% of registration revenue vs 25.2% from community programs.

**Key Features:**
- [ ] Preschool partner portal (admin access for school contacts)
- [ ] Bulk enrollment support (school submits roster)
- [ ] Partner-specific agreement management
- [ ] Enrollment deadline reminders to school contacts
- [ ] Partner billing and invoicing
- [ ] Background registration (parent completes, class during school hours)
- [ ] School-specific discount codes
- [ ] Partner performance dashboard
- [ ] Class naming convention: "Venue Name | Program | Season Year"

**Top Partner Types (from NBC data):**
- Montessori schools (significant segment)
- Private preschools
- Church-affiliated programs
- Community centers

---

### Stage 4: Business Intelligence (PLANNED)
**Goals:** Analytics, reporting, predictive insights, proactive interventions
**Updated:** January 2026 with customer feedback enhancements

**Key Features:**

#### 4.1 Core Analytics
- [ ] Conversion funnel visualization
- [ ] Abandoned cart analytics
- [ ] Source/device tracking
- [ ] Drop-off analysis
- [ ] Revenue forecasting

#### 4.2 Proactive Kai Chat Intervention (Priority: HIGH) - NEW Jan 2026
**Customer Question:** Can we collect behavioral data and make recommendations on when to insert a chat popup?

**Behavioral Analytics:**
- [ ] Track registration drop-off points (where users abandon)
- [ ] Identify consistent abandonment patterns across users
- [ ] Time-on-page analysis per registration step
- [ ] Mouse/touch inactivity detection
- [ ] Form field error patterns

**AI Recommendation Engine:**
- [ ] AI analyzes drop-off patterns and recommends popup placement
- [ ] Suggest chat intervention at identified friction points
- [ ] Auto-insert Kai chat at high-abandonment steps
- [ ] Contextual help based on where user is stuck

**Testing & Optimization:**
- [ ] A/B testing for popup effectiveness
- [ ] Measure intervention success rates
- [ ] Dashboard showing conversion lift from interventions
- [ ] Manual override for popup placement
- [ ] Popup frequency controls (don't annoy users)

#### 4.3 Intelligent Churn Prevention & Retention (Priority: HIGH) - ENHANCED Jan 2026
**Customer Request:** Automations that learn from experience and automatically help reduce churn with auto-initiated retention campaigns

**Churn Risk Scoring:**
- [ ] Churn risk scoring algorithm (learns from historical data)
- [ ] Risk factors: engagement, attendance, payment issues, time since last interaction
- [ ] Family risk level indicators (Low, Medium, High, Critical)
- [ ] Predictive alerts before families leave

**Auto-Retention Campaigns:**
- [ ] Auto-initiated retention campaigns for at-risk families
- [ ] Personalized messaging based on risk factors
- [ ] Multi-channel outreach (email, SMS, push)
- [ ] Escalation paths for non-responsive families

**Campaign Coordination Engine (Critical):**
- [ ] Integration with seasonal re-enrollment campaigns
- [ ] Communication frequency caps per family (prevent over-inundation)
- [ ] Channel preference learning (email vs. SMS)
- [ ] De-duplication: Don't send retention + re-enrollment at same time
- [ ] Smart scheduling to avoid inbox fatigue
- [ ] Campaign effectiveness tracking
- [ ] Manual campaign pause/override

**Learning & Optimization:**
- [ ] Track which interventions work for which family types
- [ ] Continuous improvement of messaging
- [ ] ROI tracking per campaign type

---

### Stage 5: Staff & Coach Tools (PLANNED)
**Goals:** Coach mobile app, curriculum management, internal communications
**Priority:** HIGH - Critical features identified in December 10, 2025 feedback
**Updated:** January 2026 with customer feedback enhancements

**Key Features:**

#### 5.1 Quick Parent Communication (Priority: HIGH)
- [ ] One-tap curriculum update messages to parents
- [ ] Video message recording featuring children in class
- [ ] Photo sharing from sessions
- [ ] Bulk messaging to class roster
- [ ] Template library for common updates

#### 5.2 In-Company Messaging - Slack/Connecteam Replacement (Priority: HIGH)
**Business Value:** Eliminates third-party tool costs (Slack, Connecteam), justifies premium pricing tier
**Customer Note:** This IS a key selling point - customers can eliminate these tools and costs when switching to Kairo

- [ ] Location-specific group channels
- [ ] All-staff company-wide channel
- [ ] Direct messaging between coaches
- [ ] Admin/management channels
- [ ] Push notifications for urgent messages
- [ ] Message read receipts
- [ ] File and media sharing
- [ ] Searchable message history

#### 5.3 Mobile-Friendly Attendance (Priority: HIGH)
**Problem Solved:** Current systems have small touch targets causing accidental multi-taps

- [ ] Large touch-friendly attendance buttons (minimum 64px)
- [ ] Visual spacing to prevent accidental selections
- [ ] Quick roster view with photos
- [ ] One-tap present/absent marking
- [ ] Bulk attendance actions
- [ ] Offline attendance with sync
- [ ] Attendance history and reporting

#### 5.4 Incident Report System (Priority: HIGH) - ENHANCED Jan 2026
**Customer Requirement:** Standardized incident reporting with supervisor review workflow

**Template & Fields:**
- [ ] Standard incident report template
- [ ] Custom template upload capability for business owners
- [ ] Primarily toggle (yes/no) and dropdown-based fields
- [ ] Comments section titled "What I observed" (specific wording required)
- [ ] Minimal free-text fields for consistency

**Workflow & Notifications:**
- [ ] 90-minute delay before auto-send to school (NOT 6 hours)
- [ ] Immediate editable attachment sent to coach's direct supervisor
- [ ] SMS alert to supervisor: "ALERT: Incident Report Filed by [name] at [location]"
- [ ] Supervisor review window during 90-minute delay
- [ ] Supervisor can manually PAUSE the send timer
- [ ] Supervisor can manually SEND EARLY before timer expires
- [ ] Auto-send to school after 90 minutes if no action taken
- [ ] Audit trail of all actions and modifications

#### 5.5 Coach Mobile App Core
- [ ] Native-like PWA experience
- [ ] Offline mode for poor connectivity
- [ ] Class schedule and calendar view
- [ ] Student roster with parent contact info
- [ ] Lesson plan library access
- [ ] Substitute instructor support
- [ ] Background check status tracking

#### 5.6 Curriculum Timer System (Priority: MEDIUM-HIGH) - NEW Jan 2026
**Customer Context:** One of the hardest things for new coaches is managing class timing. They often spend too much time on early sections and miss the scrimmage at the end.

**Timer Features:**
- [ ] Timer integration with lesson plan view (7 sections per lesson)
- [ ] Running timer per section
- [ ] Visual time indicators:
  - Normal: Default color
  - Yellow: Time approaching limit (warning)
  - Red: Section time expired
- [ ] Auto-advance to next section when timer expires
- [ ] Next section timer starts automatically
- [ ] Audio/haptic notification at section transitions
- [ ] Pause/resume functionality
- [ ] Time remaining display per section

**Configuration:**
- [ ] Enable/disable toggle at organization level (business owner)
- [ ] Enable/disable toggle at coach level (optional for individual coaches)
- [ ] Business owner sets time allotted for each section
- [ ] Different time lengths per section (e.g., rule review vs. scrimmage)
- [ ] Per-curriculum time configuration

---

### Stage 6: Advanced Scheduling (PLANNED)
**Goals:** Schedule creation, optimization, conflict detection, smart coach assignment
**Updated:** January 2026 with customer feedback enhancements

**Key Features:**

#### 6.1 Scheduling Manager (Admin Tool)
- [ ] Drag-and-drop schedule builder
- [ ] Visual calendar interface
- [ ] Conflict detection and warnings
- [ ] Bulk session creation
- [ ] Recurring schedule templates
- [ ] Coach availability integration

#### 6.2 AI Schedule Optimizer
**Uses data to maximize enrollment and revenue**

- [ ] Revenue potential analysis per time slot
- [ ] Waitlist demand analysis
- [ ] Historical enrollment patterns
- [ ] Suggested schedule changes
- [ ] Capacity optimization recommendations
- [ ] Counter-proposal generation for underfilled classes
- [ ] Geographic demand mapping

#### 6.3 Smart Coach Assignment with Ranking Filters (Priority: HIGH) - NEW Jan 2026
**Customer Requirement:** Sophisticated coach ranking and scheduling system with customizable filters

**Filter Management:**
- [ ] Drag-and-drop filter prioritization (reorder importance)
- [ ] Toggle individual filters on/off per organization
- [ ] Weighted scoring based on filter priority order

**Distance Filters:**
- [ ] Distance from coach's home address
- [ ] Distance from last class coached (schedule-aware routing)
- [ ] System understands coach schedule to determine origin (home vs. previous class)
- [ ] Real-time distance calculation

**Rating Filters:**
- [ ] Owner-assigned coach ranking (1-5 scale, internal)
- [ ] Parent ratings collection (internal use only, NOT customer-facing)
- [ ] Park classes only option for parent ratings
  - Preschool parents don't see coaches, so exclude from rating eligibility
  - Park/community classes include parent observations
- [ ] Parent rating as optional filter (can be toggled off)

**Assignment Features:**
- [ ] Optimal coach suggestion based on weighted filter scores
- [ ] Manual override capability for admins
- [ ] Coach availability integration
- [ ] Conflict detection with existing assignments
- [ ] Substitute coach recommendations when primary unavailable

---

### Stage 7: Upselling & Engagement (PLANNED)
**Goals:** Revenue maximization, lifecycle communications, coach recognition
**Updated:** January 2026 with customer feedback enhancements

**Key Features:**

#### 7.1 Season-End Feedback & Tipping System (Priority: MEDIUM) - NEW Jan 2026
**Customer Requirement:** Automated end-of-season feedback collection and coach tipping

**Feedback Collection (SMS #1):**
- [ ] Automated end-of-season SMS trigger
- [ ] Customizable feedback questionnaire
- [ ] Coach rating collection (internal use only, NOT public-facing)
- [ ] Review request with optional public posting link
- [ ] Fully editable message wording per organization
- [ ] Organization voice/values customization

**Tipping System (SMS #2):**
- [ ] Separate tip request message (sent after feedback SMS)
- [ ] Conditional send options:
  - Send to ALL respondents (toggle option)
  - Send only to positive ratings above threshold (toggle option)
  - Business owner configures rating threshold (e.g., 4+ stars)
- [ ] Coach payment link storage (Venmo, PayPal, CashApp, etc.)
- [ ] Tip tracking and reporting dashboard
- [ ] Fully editable tip request wording per organization
- [ ] Integration with coach profile for payout info

**Configuration:**
- [ ] Toggle: Enable/disable tipping feature
- [ ] Toggle: Send tips to all vs. positive only
- [ ] Rating threshold configuration
- [ ] Message template editor
- [ ] Preview before sending

---

### Stage 8: Multi-Location & Franchise (PLANNED)
**Goals:** Multi-location operators, franchise support

---

### Stage 8.5: Benchmarking Intelligence Dashboard (PLANNED) - NEW Jan 2026
**Goals:** Anonymous peer comparison, industry benchmarks, AI-powered recommendations
**Priority:** HIGH - Unique competitive advantage and premium revenue opportunity
**AI Model:** Google Gemini 2.5 Flash (`gemini-2.5-flash`)

**Business Context:** Youth sports business owners lack visibility into how their performance compares to similar businesses. This feature provides anonymous, aggregated benchmarking data with AI-powered recommendations to identify growth opportunities.

#### 8.5.1 Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Base (Essentials/Premium) | Included | View own data only, no peer comparison |
| Benchmarking Add-on | +$99-149/mo | Anonymous peer comparisons, industry benchmarks |
| Intelligence Add-on | +$199-299/mo | AI recommendations, opportunity identification, predictive insights |

**Tier Access Control:**
- [ ] Subscription tier detection
- [ ] Feature gating by tier
- [ ] Upgrade prompts for locked features
- [ ] Seamless in-app upgrade flow

#### 8.5.2 Data Anonymization & Privacy (CRITICAL)

**Minimum Aggregation Rules:**
- [ ] Minimum 5 businesses required before showing any peer data
- [ ] Geographic aggregation (state/region level minimum)
- [ ] No individual business identification possible
- [ ] Percentile ranges instead of exact values when N < 10
- [ ] Suppress outlier data that could identify specific businesses

**Privacy Controls:**
- [ ] Opt-in/opt-out toggle for data contribution
- [ ] Clear disclosure of what data is shared
- [ ] GDPR/CCPA compliant data handling
- [ ] Data retention policies clearly documented
- [ ] Right to be forgotten implementation

#### 8.5.3 Filter Controls

**Geography Filters:**
- [ ] State/Province selection
- [ ] Region selection (Northeast, Southeast, Midwest, etc.)
- [ ] Metropolitan area groupings
- [ ] National view (when sufficient data)

**Business Attributes:**
- [ ] Sport/Activity type (Soccer, Swim, Dance, Martial Arts, etc.)
- [ ] Business size (by revenue bands: <$100K, $100K-500K, $500K-1M, $1M+)
- [ ] Number of locations (1, 2-5, 6-20, 20+)
- [ ] Years in business (0-2, 3-5, 6-10, 10+)

**Time Period:**
- [ ] Current season vs. previous season
- [ ] Year-over-year comparison
- [ ] Quarter-over-quarter
- [ ] Custom date ranges

**Program Type:**
- [ ] Community programs only
- [ ] Preschool partnerships only
- [ ] All programs combined

#### 8.5.4 Benchmarking Metrics

**Enrollment Metrics:**
- [ ] Enrollment rate (% of capacity filled)
- [ ] Trial-to-paid conversion rate
- [ ] Re-enrollment rate (returning families)
- [ ] Sibling enrollment rate
- [ ] Waitlist conversion rate
- [ ] Cart abandonment rate

**Revenue Metrics:**
- [ ] Revenue per enrolled child
- [ ] Average transaction value
- [ ] Pay-in-full vs. payment plan ratio
- [ ] Revenue per location
- [ ] Revenue per session/class

**Operational Metrics:**
- [ ] Class fill rate by time of day
- [ ] Class fill rate by day of week
- [ ] Coach utilization rate
- [ ] Cancellation/refund rate
- [ ] Average class size

#### 8.5.5 AI Recommendations Engine (Gemini 2.5 Flash)

**Model Configuration:**
- [ ] Use Gemini 2.5 Flash (`gemini-2.5-flash`) via API
- [ ] Structured prompt with business context
- [ ] JSON response mode for reliable parsing
- [ ] Rate limiting and cost controls

**Recommendation Categories:**
- [ ] Revenue opportunity identification ("You're 15% below peer average on re-enrollment - here's how to improve")
- [ ] Pricing optimization suggestions
- [ ] Schedule optimization (underperforming time slots)
- [ ] Marketing focus areas
- [ ] Operational efficiency improvements

**Recommendation Display:**
- [ ] Priority ranking (High/Medium/Low impact)
- [ ] Estimated revenue opportunity ($X potential)
- [ ] Action steps to implement
- [ ] Success metrics to track
- [ ] Link to relevant Kairo features

#### 8.5.6 Dashboard UI Requirements

**Main Dashboard View:**
- [ ] Summary scorecard (your metrics vs. peer average)
- [ ] Visual indicators (above/below/at benchmark)
- [ ] Trend arrows (improving/declining)
- [ ] Quick filter bar at top

**Comparison Charts:**
- [ ] Bar charts: Your value vs. peer 25th/50th/75th percentiles
- [ ] Trend lines: Your performance over time vs. peer average
- [ ] Distribution charts: Where you fall in the peer distribution

**AI Insights Panel:**
- [ ] Featured recommendation card
- [ ] AI-generated summary of top opportunities
- [ ] "Ask AI" interface for custom questions
- [ ] Recommendation history and tracking

**Tiger Tank Capabilities:**
- Compare enrollment rate to peer businesses in same sport/region
- See where you rank vs. 50th and 75th percentile benchmarks
- Get AI recommendations for revenue opportunities
- Filter by business size, geography, and sport type
- Track your benchmark position over time
- Identify underperforming areas vs. peers

---

### Stage 9: Marketing Automation (PLANNED)
**Goals:** Social media, advertising, lead generation, ROI optimization
**Business Value:** Potentially eliminates need for dedicated marketing director
**Updated:** January 2026 with customer feedback enhancements

**Key Features:**

#### 9.1 Ad Platform Integration (Clarified Scope) - ENHANCED Jan 2026
**Customer Question:** Can owners control ad spend directly from the dashboard? Is this tracking or the actual ad platform?

**Answer:** Kairo connects TO existing ad platforms via API, not replacing them.

**API Integrations:**
- [ ] Facebook Ads API integration (read spend, adjust budgets)
- [ ] Google Ads API integration
- [ ] Instagram Ads API integration
- [ ] Unified dashboard for cross-platform view

**Direct Control Features:**
- [ ] Direct budget adjustment from Kairo dashboard
- [ ] Increase or decrease spend per campaign
- [ ] Pause/resume campaigns
- [ ] Media/creative upload for ad assets

**AI Optimization:**
- [ ] AI-powered budget optimization
- [ ] Automatic A/B testing
- [ ] Campaign performance comparison
- [ ] Audience sync from registration data

**Note:** This does NOT fully replace Facebook Ads Manager - advanced campaign creation still uses native tools. Kairo provides unified view + optimization.

#### 9.2 Actionable ROI Feedback
**Critical feature from December 10, 2025 feedback**

- [ ] Real-time spend tracking across platforms
- [ ] Cost per registration calculation
- [ ] Campaign performance comparison
- [ ] ROI visualization dashboard
- [ ] Performance alerts and notifications

#### 9.3 Automated Funding Decisions
**AI-powered budget optimization**

- [ ] Automatic budget reallocation based on performance
- [ ] Pause underperforming campaigns
- [ ] Scale successful campaigns
- [ ] A/B test automation
- [ ] Recommended budget by campaign type
- [ ] Seasonal adjustment recommendations

#### 9.4 Lead Generation & Nurturing
- [ ] Landing page builder
- [ ] Lead capture forms
- [ ] Automated follow-up sequences
- [ ] Lead scoring
- [ ] Customer referral program management

#### 9.5 Employee Referral System (Priority: MEDIUM) - NEW Jan 2026
**Customer Requirement:** Incentivize employees (coaches) to bring new families into the program

**Unique Codes:**
- [ ] Unique coupon code per coach/employee
- [ ] Code tied to employee record in system
- [ ] QR code generation for easy sharing
- [ ] Custom code naming (e.g., COACH-MIKE-2026)

**Tracking & Attribution:**
- [ ] Real-time usage tracking dashboard
- [ ] Attribution to specific employee
- [ ] Track: code used, family enrolled, revenue generated
- [ ] Referral performance leaderboard

**Payouts:**
- [ ] Automatic payout calculation per referral
- [ ] Configurable payout amount ($X per enrollment)
- [ ] Payout report generation for payroll
- [ ] Integration with payroll export (optional)
- [ ] Payout threshold before disbursement (optional)

**Management:**
- [ ] Code expiration management
- [ ] Disable/enable individual codes
- [ ] Bulk code generation
- [ ] Performance analytics per employee

#### 9.6 Communications Infrastructure (In-House) - Clarification Jan 2026
**Customer Question:** Do users need to connect external platforms like Mailchimp?

**Answer:** NO - Kairo handles all communications in-house. No external tools required.

**Built-in Capabilities:**
- [ ] Email delivery (SendGrid integration)
- [ ] SMS delivery (Twilio integration)
- [ ] Push notifications (native PWA)
- [ ] Template management and editor
- [ ] Automation workflows
- [ ] Scheduled sending
- [ ] Delivery tracking and analytics

---

### Stage 10: White-Label & API (PLANNED)
**Goals:** Deep customization, third-party integrations, voice personalization

**Key Features:**

#### 10.1 Brand Customization
- [ ] Custom colors and themes
- [ ] Logo placement and sizing
- [ ] Custom domain support
- [ ] Email template branding
- [ ] SMS sender ID customization

#### 10.2 AI Agent Personalization
- [ ] Custom agent name (Kai -> "Splash", "Striker", etc.)
- [ ] Custom welcome messages
- [ ] Brand-specific personality tuning
- [ ] Custom quick reply options

#### 10.3 Voice Customization
**Feature from December 10, 2025 feedback - improves customer engagement**

- [ ] Regional accent options
  - British accent (ideal for soccer/football entities)
  - Latin American Spanish accent (ideal for Miami market)
  - Standard American English
  - Additional accents based on market demand
- [ ] Language selection (English, Spanish)
- [ ] Voice speed adjustment
- [ ] Voice gender selection

#### 10.4 API & Integrations
- [ ] Public REST API
- [ ] Webhook notifications
- [ ] Third-party calendar sync
- [ ] CRM integrations
- [ ] Accounting software integration

---

### Stage 11: Data & Compliance (PLANNED)
**Goals:** COPPA/GDPR compliance, data portability

---

### Stage 12: Advanced AI & Optimization (PLANNED)
**Goals:** Predictive models, optimization algorithms

---

### Stage 13: Internal Operations Dashboard (PLANNED) - NEW Jan 2026
**Goals:** B2B SaaS operations monitoring, customer health tracking, revenue protection
**Priority:** HIGH - Critical for kAIro Pro LLC internal operations
**Philosophy:** Health = Transaction Activity, NOT Admin Login Frequency

**Business Context:** kAIro Pro LLC needs internal dashboards to monitor their B2B customers (youth sports organizations). A customer processing 500 registrations with zero logins is healthier than a customer logging in daily but processing 10 registrations.

#### 13.1 Dashboard Architecture

**Two-Dashboard System:**

| Dashboard | Audience | Purpose | Update Frequency |
|-----------|----------|---------|------------------|
| CEO Strategic View | CEO, Founders | "How's my business?" in 60 seconds | Real-time + Daily rollup |
| EA Operational View | Executive Assistant, CS Team | "What needs attention RIGHT NOW?" | Real-time |

#### 13.2 CEO Strategic View Dashboard

**Revenue & Growth Scorecard:**
- [ ] Current MRR/ARR with sparkline trends (week/month)
- [ ] Active customers by tier (processing transactions, not just subscribed)
- [ ] Transaction volume trends (registrations processed)
- [ ] Gross Payment Volume (GPV) through platform
- [ ] Take rate (kAIro revenue as % of GPV)
- [ ] ARPA (Average Revenue Per Account)

**Platform Performance - The kAIro Advantage:**
- [ ] Registration completion rate: 95%+ (vs industry 50-60%)
- [ ] Cart abandonment: <5% (vs industry 40-50%)
- [ ] Average registration time: <3-5 minutes (vs industry 15-20min)
- [ ] Payment success rate: 95%+
- [ ] Total registrations processed (all-time credibility)
- [ ] Platform uptime: 99.9% target
- [ ] AI agents operational status (KAI, DATABOT, PAYPAL, COMMBOT, SOLVO)

**Customer Health Overview (Transaction-Based):**
- [ ] High Risk customers count with MRR at risk
- [ ] Medium Risk customers requiring proactive outreach
- [ ] Healthy customers count
- [ ] Visual distribution chart

**Investor Metrics (PE/VC Ready):**
- [ ] Net Revenue Retention (NRR) - target 120%+
- [ ] Gross Payment Volume growth
- [ ] Take rate trends
- [ ] Platform stickiness (% using multiple features)
- [ ] LTV:CAC ratio (target 3:1 minimum, 5:1+ excellent)
- [ ] Gross margin (target 75-90%)
- [ ] Customer concentration (largest customer <10% of revenue)

**L10 Weekly Snapshot:**
- [ ] MRR with week-over-week change
- [ ] Active Processing Customers count
- [ ] Registrations This Week
- [ ] GPV This Week
- [ ] At-Risk Customers (by transaction decline)
- [ ] Platform Success Rate
- [ ] System Health indicator (Green/Yellow/Red)

#### 13.3 EA Operational View Dashboard

**Priority Action List (Transaction-Based):**

🔴 URGENT - Do Now:
- [ ] Customers with >50% registration volume decline
- [ ] Payment expiring in <7 days (high MRR customers first)
- [ ] Multiple failed parent transactions today
- [ ] Data export requests (churn signal)
- [ ] Support tickets mentioning competitors

🟡 IMPORTANT - Do Today:
- [ ] No registrations this week (unexpected for season)
- [ ] Credit card expires in 8-14 days
- [ ] Customers below expected registration volume
- [ ] Bulk check-in queue

🟢 MONITOR - As Time Allows:
- [ ] New feature adoption opportunities
- [ ] Slightly elevated cart abandonment
- [ ] Seasonal reminders

**Customer Health Detail Table:**
- [ ] Customer name with tier badge
- [ ] MRR value
- [ ] This week's registrations vs. average
- [ ] Transaction success rate
- [ ] Health score (calculated)
- [ ] Recommended action
- [ ] Sortable/filterable by all columns

**Transaction Monitoring:**
- [ ] Live registration feed (real-time)
- [ ] Failed transactions requiring attention
- [ ] Payment processing errors by organization
- [ ] Cart abandonment spikes by customer
- [ ] API response time by customer (integration health)

**Parent Experience by Customer:**
- [ ] Registration completion rates by organization
- [ ] Average time to complete by organization
- [ ] Common abandonment points
- [ ] Payment method preferences

**Revenue Protection Center:**
- [ ] Expiring payment methods (7/14/30 day views)
- [ ] Failed subscription charges (retry status)
- [ ] Pending downgrades/cancellations
- [ ] Credit card expiration calendar
- [ ] Customers >30% below seasonal norm
- [ ] Year-over-year volume comparisons

**Expansion Opportunities (Usage-Based):**
- [ ] Approaching registration volume limits
- [ ] Using workarounds due to tier limitations
- [ ] Multiple locations needing multi-site features
- [ ] High parent satisfaction scores (NPS)
- [ ] Upsell trigger alerts with estimated value

**Support Context Dashboard:**
- [ ] Ticket sentiment analysis (complaint vs question)
- [ ] Customer's current transaction volume (context)
- [ ] Recent platform activity
- [ ] Historical issue patterns
- [ ] Suggested resolution based on issue type

#### 13.4 Risk Definitions & Alert Logic

**High Risk (Immediate Action):**
| Signal | Threshold | Action |
|--------|-----------|--------|
| Transaction Volume Collapse | >40% decline from normal | Immediate call |
| Payment Method Expiring | <7 days | Update payment |
| Subscription Payment Failed | Any | Retry + contact |
| Data Export Requested | Any | Retention call |
| Competitor Mentioned | In ticket | Priority response |
| Integration Broken | Multiple failed transactions | Technical support |

**Medium Risk (Proactive Outreach):**
| Signal | Threshold | Action |
|--------|-----------|--------|
| Volume Decline | 20-40% below normal | Check-in call |
| Seasonal Anomaly | Missing expected sport season | Verify status |
| Experience Degradation | Success rates dropping | Technical review |
| Payment Expiring | 8-30 days out | Reminder email |
| Below-average Feature Adoption | For their tier | Training offer |

**Healthy (No Action Needed):**
| Signal | Threshold |
|--------|-----------|
| Consistent Volume | Within 20% of normal patterns |
| Smooth Processing | >95% transaction success |
| Seasonal Match | Following expected patterns |
| Parents Happy | High completion rates |

#### 13.5 Alert Distribution

**CEO Alerts (Critical Only):**
- [ ] Customer processing volume drops >40%
- [ ] Major customer payment failure (>$500/mo MRR)
- [ ] Multiple customers with same issue pattern
- [ ] GPV declining week-over-week
- [ ] Take rate changes significantly
- [ ] System-wide incidents

**EA Alerts (Operational):**
- [ ] Individual payment method expiring
- [ ] Customer below seasonal expectations
- [ ] Failed transactions spike
- [ ] Support ticket with "cancel" or "competitor"
- [ ] Data export request
- [ ] New customer onboarding tasks

#### 13.6 Key Metrics Philosophy

**Old (Login-Based) vs. New (Transaction-Based):**

| Old Metric (Don't Use) | New Metric (Use This) |
|------------------------|----------------------|
| "Days since login" | "Registration volume vs. normal" |
| "Session duration" | "Transaction success rate" |
| "Page views" | "Features actively processing data" |
| "User engaged" | "Parents completing registrations" |
| "Active user" | "Processing transactions this week" |

#### 13.7 Glossary Integration

**Key Terms for Dashboard:**
- **MRR** - Monthly Recurring Revenue from B2B subscriptions
- **ARR** - Annual Recurring Revenue (MRR × 12)
- **GPV** - Gross Payment Volume through platform
- **Take Rate** - kAIro revenue as % of GPV
- **NRR** - Net Revenue Retention (target 120%+)
- **LTV:CAC** - Lifetime Value to Customer Acquisition Cost ratio
- **Health Score** - Calculated from transaction volume, payment status, engagement
- **SOLVO** - AI support agent that auto-resolves tickets

**Customer Tiers:**
- **Essentials** - Entry-level tier
- **Most Popular** - Mid-tier with common features
- **Pro+** - Advanced tier with multi-location
- **Custom** - Enterprise à la carte

#### 13.8 Success Criteria

**CEO Dashboard:**
- [ ] Instantly see transaction trends
- [ ] Identify revenue at risk from volume decline
- [ ] Prove platform value with success metrics
- [ ] Track actual business health, not vanity metrics
- [ ] PE/VC ready metrics at a glance

**EA Dashboard:**
- [ ] Prevent churn by catching volume drops early
- [ ] Fix payment issues before they cause failures
- [ ] Support customers based on actual problems
- [ ] Drive expansion based on usage patterns
- [ ] Prioritized action list with MRR impact

---

## Feature Gaps Identified (iClassPro Analysis - Dec 8, 2025)

Based on competitive analysis of iClassPro platform, the following features should be added:

### Critical Gaps (Must Add)

#### 1. Makeup Class System (Priority: HIGH)
**Add to Stage 3 or 5**
- Allow parents to request makeup for missed classes
- Track makeup eligibility per policy
- Suggest available makeup times conversationally
- "Connor missed Wednesday's class. Can we make it up?"

#### 2. Class Transfer Workflow (Priority: HIGH)
**Add to SOLVOBOT responsibilities**
- Handle requests like "Can we move Connor to Thursday instead?"
- Check availability, handle prorating
- Auto-update calendar
- Parent notification of change

#### 3. Trial Enrollment Tracking (Priority: MEDIUM-HIGH)
**Add to data model**
- Flag trial vs. paid enrollments
- Track trial-to-paid conversion rates
- Automated follow-up for trial participants
- Conversion analytics in dashboard

#### 4. Data Completeness Indicators (Priority: MEDIUM)
**Add to Admin Dashboard**
- Visual flags for incomplete family profiles
- "No payment method" warnings
- "Missing email/phone" alerts
- Admin reminders for follow-up

#### 5. Substitute Instructor Support (Priority: MEDIUM)
**Add to STAFF module**
- Track when coaches are unavailable
- Automated substitute assignment
- Parent notifications of instructor changes

### Optional Features (Market-Dependent)

| Feature | Priority | Notes |
|---------|----------|-------|
| Skill Progression Module | MEDIUM | Critical for swim/martial arts markets |
| Private Lesson Booking | MEDIUM | Phase 2 if swim school demand validates |
| Waitlist Priority Groups | LOW | Start FIFO; add if fairness concerns |
| Camp-Specific Features | MEDIUM-HIGH | Extended day, daily schedules |
| Party Bookings | LOW | Phase 2/3 revenue opportunity |
| Geographic ZIP Analysis | LOW | Marketing enhancement for Phase 2 |

### Features to Avoid (Out of Scope)

- Time Clock/Payroll - Not related to registration problem
- Point of Sale - Focus on activities, not retail
- Check-in Kiosk - Parents check in via app
- Mailing Labels - Outdated; digital communication standard

---

## N8N Workflow Architecture

### Overview

N8N serves as the **primary AI intelligence layer** for all conversational registration flows. The workflow receives user messages, queries the Supabase database, builds AI prompts with context, calls Gemini, and returns structured responses.

### Webhook Endpoint

**URL:** `https://healthrocket.app.n8n.cloud/webhook/kai-conversation`
**Method:** POST
**Authentication:** Optional API key via `X-N8N-API-Key` header

### Request Format

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

### Response Format

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

### N8N Workflow Nodes

The workflow consists of 7 main nodes:

1. **Webhook Trigger** - Receives POST requests
2. **Pattern Extraction** (Code) - Extract name, age, days, time, program from message
3. **Supabase Query** (HTTP) - Call `get_matching_sessions()` RPC function
4. **Build Prompt** (Code) - Construct system prompt with context and sessions
5. **Gemini API** (HTTP) - Call Gemini with JSON response mode
6. **Process Response** (Code) - Parse and normalize AI response
7. **Return Response** (Respond to Webhook) - Send JSON response

### Database Functions for N8N

N8N calls these Supabase RPC functions:

| Function | Purpose |
|----------|---------|
| `get_matching_sessions()` | Find sessions by age, day, program, location |
| `get_alternative_sessions()` | Find alternatives with match scoring |
| `get_session_by_id()` | Get full session details |
| `add_to_waitlist_with_position()` | Waitlist management |
| `check_session_availability()` | Quick availability check |
| `get_organization_context()` | Get organization settings |

### Database Views for N8N

| View | Purpose |
|------|---------|
| `available_sessions_view` | Pre-joined session data with availability |
| `session_recommendations_view` | Sessions with ratings and urgency levels |
| `full_session_details_view` | Complete session information |
| `organization_settings_view` | Organization config for AI agent |

---

## Environment Variables Setup

### Frontend Environment Variables (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tatunnfxwfsyoiqoaenb.supabase.co
VITE_SUPABASE_ANON_KEY=[your anon key]

# N8N Webhook Configuration (Required for AI Agent)
VITE_N8N_WEBHOOK_URL=https://healthrocket.app.n8n.cloud/webhook/kai-conversation
VITE_N8N_WEBHOOK_KEY=[optional api key]

# Feature Flags
VITE_ENABLE_VOICE=true
VITE_ENABLE_SPANISH=false
```

### N8N Environment Variables

Configure these in your n8n instance (Settings > Environment Variables):

```env
# Supabase (for database queries)
SUPABASE_URL=https://tatunnfxwfsyoiqoaenb.supabase.co
SUPABASE_SERVICE_KEY=[your service role key]

# Gemini AI
GEMINI_API_KEY=[your gemini api key]
```

### Legacy Edge Function Variables (Deprecated)

These were used for the previous Edge Function approach and are no longer needed:

```env
# No longer required - Edge Functions deprecated
# GEMINI_API_KEY was configured via Supabase Dashboard > Edge Functions > Secrets
```

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Page Load (Mobile 4G) | < 3 seconds | > 5 seconds |
| Voice Response Latency | < 500ms | > 1 second |
| Kai Response Time | < 3 seconds | > 5 seconds |
| Registration Completion | < 5 minutes | > 8 minutes |
| Payment Processing | < 3 seconds | > 5 seconds |
| N8N Workflow Execution | < 3 seconds | > 5 seconds |

---

## Testing Strategy

### Stage 1 Testing (Completed)
- [x] Database schema creation
- [x] RLS policy verification
- [x] Seed data insertion
- [x] TypeScript compilation
- [x] Build success

### Stage 2 Testing (In Progress)
- [x] N8N webhook integration
- [x] Database views and functions
- [ ] Full AI conversation flow (happy path)
- [ ] Error handling and fallback
- [ ] Voice input/output
- [ ] Session recommendations accuracy
- [ ] Waitlist prevention logic
- [ ] Mobile device testing (iOS Safari, Chrome)
- [ ] One-handed operation verification
- [ ] Network interruption handling

### Testing N8N Webhook

```bash
curl -X POST https://healthrocket.app.n8n.cloud/webhook/kai-conversation \
  -H "Content-Type: application/json" \
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

---

## Development Principles

### S.C.A.T.E. Framework
Every development task follows:
- **S**cope - Precise boundaries
- **C**ontext - Why this matters
- **A**ction - Clear imperatives
- **T**echnology - Specific tools
- **E**xpectation - Definition of done

### Preservation Philosophy
- Protect existing working code
- Default to minimal changes
- Extend, don't replace
- Explicit preservation instructions

### Mobile-First Always
- 48px+ touch targets
- One-handed operation
- Works offline where possible
- Fast on 4G networks

---

## Quick Reference

### Demo Credentials
- Organization: Soccer Shots Demo
- Slug: `soccer-shots-demo`
- Organization ID: `00000000-0000-0000-0000-000000000001`

### Test Data Summary (Updated Dec 8, 2025)

| Entity | Count | Details |
|--------|-------|---------|
| Organizations | 1 | Soccer Shots Demo |
| Locations | 5 | Lincoln Park, Riverside Park, Downtown Center, Westside Park, East Valley Sports Complex |
| Programs | 8 | Mini Soccer, Junior Soccer, Premier Soccer, Swim Lessons, Dance Academy, Martial Arts, Basketball Basics, Toddler Play |
| Staff/Coaches | 10 | Various ratings (3.9-4.9), multiple roles |
| Sessions | 34 | Various days, times, capacities (including full classes) |
| Families | 25 | Complete, single-parent, multi-child, incomplete, payment issues |
| Children | 45 | Ages 2-14, various scenarios |
| Registrations | 41 | Active, pending, failed payments |
| Waitlist | 8 | Full class scenarios |

### Test Scenario Coverage
- Happy path registration (Roberts family)
- Multi-child sibling enrollment (Martinez, Thompson families)
- Single parent workflow (Johnson, Wilson families)
- Payment failure recovery (Anderson family)
- Incomplete data validation (Smith, Davis families)
- Returning high-value customer (Williams, Garcia families)
- Trial enrollment (Trial families)
- Cart abandonment (Cart Abandoner families)
- Special characters in names (O'Brien-Smith family)
- Waitlist with alternatives

### Key Commands
```bash
# Development
npm run dev

# Build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Database Access
```bash
# Via Supabase Dashboard
https://tatunnfxwfsyoiqoaenb.supabase.co

# Via code
import { supabase } from './lib/supabase'
```

---

## Next Immediate Steps

1. **Build N8N Workflow** - Follow N8N_INTEGRATION.md guide
2. **Configure N8N Environment** - Add Supabase and Gemini credentials
3. **Test Webhook Integration** - Verify end-to-end conversation flow
4. **Add Voice Input** - Web Speech API integration (Section 2.4)
5. **Full Registration Flow Test** - From greeting to confirmation

---

## Notes & Decisions Log

### December 2, 2025 - Morning
- Completed Stage 1 foundation
- Database schema with 13 tables
- RLS policies implemented
- Basic chat UI built
- Decision: Use Gemini Flash for AI (speed + cost)
- Decision: Mobile-first development approach

### December 2, 2025 - Afternoon
- Kai conversation Edge Function deployed
- Gemini Flash API integration (`gemini-flash-latest`)
- SystemInstruction for consistent Kai personality
- Data extraction logic (name, age, preferences)
- Conversation state machine (greeting -> confirmation)
- Error handling with fallback to forms
- **Decision: Supabase Edge Functions for initial implementation**

### December 4, 2025
- Comprehensive test data added (12 programs, 8 coaches, 64 sessions)
- Full age coverage 2-18 across all activity types
- Section 2.2 (Smart Recommendations) completed
- Section 2.3 (Waitlist Prevention) backend complete
- `find-alternatives` Edge Function deployed

### December 8, 2025
- iClassPro Feature Analysis completed
- Test Data Specifications document created
- Comprehensive test data migration applied
- Build Plan Review - Section 2.3 Confirmed Complete

### December 10, 2025 - Architecture Migration
- **MAJOR DECISION: Migrated from Supabase Edge Functions to N8N Workflow**

  **Rationale:**
  - Visual workflow management for easier iteration
  - No code deployments needed for AI prompt changes
  - Better debugging with step-by-step execution logs
  - Centralized AI logic in one manageable location
  - Easy integration with future services (Twilio, SendGrid)
  - More flexibility for routing to different AI models

  **Changes Made:**
  - Created `src/services/ai/n8nWebhook.ts` - New frontend service
  - Updated `src/hooks/useConversation.ts` - Now uses n8n webhook
  - Created database views for optimized n8n queries:
    - `available_sessions_view`
    - `session_recommendations_view`
    - `full_session_details_view`
    - `organization_settings_view`
  - Created database functions for n8n RPC calls:
    - `get_matching_sessions()`
    - `get_alternative_sessions()`
    - `get_session_by_id()`
    - `add_to_waitlist_with_position()`
    - `check_session_availability()`
    - `get_organization_context()`
  - Updated environment variables (`.env`, `.env.example`)
  - Rewrote `N8N_INTEGRATION.md` with complete workflow guide

  **Edge Functions Status:** Deprecated but retained in codebase

  **Next Step:** Build n8n workflow following N8N_INTEGRATION.md

### December 10, 2025 - Feedback Session Updates
- **Meeting Participants:** JoBen Barkey, Clay Speakman, Marshall Briggs
- **Build Plan Version:** Updated to 2.4

  **Key Decisions from Feedback:**

  1. **Timeline Established:**
     - Full platform capability target: February 2026
     - Adjustments and enhancements: March 2026
     - Entrepreneur feedback session: After January 8, 2026

  2. **Quality Philosophy Confirmed:**
     - No MVP approach - platform must be production-ready
     - Critical for family business livelihoods

  3. **Accuracy Target Set:**
     - Previous architecture: 80-90% accuracy
     - New architecture target: 99% accuracy

  4. **Stage 5 (Coach Tools) Enhanced:**
     - Quick parent communication (curriculum updates, video messages)
     - In-company messaging (Slack replacement) - justifies premium pricing
     - Mobile-friendly attendance (larger touch targets)

  5. **Stage 6 (Scheduling) Enhanced:**
     - AI Optimizer feature using revenue potential, waitlists, demand data

  6. **Stage 9 (Marketing) Enhanced:**
     - Actionable ROI feedback on ad spending
     - Automated funding decisions
     - Goal: eliminate need for dedicated marketing director

  7. **Stage 10 (White-Label) Enhanced:**
     - Regional accent options (British for soccer, Latin American for Miami)
     - Language selection support

  8. **Data Integration Priority:**
     - iClass: Complete
     - Configio: URGENT (being sunset)
     - NBC Sports Engine: After Configio

  9. **Competitor Pricing Research:**
     - Analyze iClass, Configio, NBC Sports Engine pricing
     - Inform tiered pricing model (Starter, Essentials, Premium, Add-ons)

  10. **Payment Processing:**
      - Decision: Use Stripe (technical friendliness)

### December 17, 2025 - NBC Sports Engine Data Analysis
- **Data Source:** 661 registrations from Soccer Shots OC via NBC Sports Engine
- **Build Plan Version:** Updated to 2.5

  **Key Insights Integrated:**

  1. **Preschool Partnerships = 74.8% of Revenue:**
     - Added Stage 3.5: Preschool Partnership Module
     - Prioritized partner portal features

  2. **Payment Psychology (86.4% Pay in Full):**
     - Updated Stage 3 with payment display psychology
     - Default to pay-in-full, plans secondary
     - Per-class cost display recommended

  3. **Registration Timing (92.3% Weekday):**
     - Validates mobile-first approach
     - Evening cart recovery (6-8 PM) recommended

  4. **Sibling Discounts ($50-60 standard):**
     - 25% off second child benchmark
     - Auto-apply with celebration message

  5. **Smart Defaults Added:**
     - Age → Program suggestion
     - Age → Shirt size default
     - Zip code → Nearest venues

  6. **NBC Integration Priority Elevated:**
     - Changed from "Medium" to "HIGH"
     - Critical insights for product decisions

### January 5, 2026 - Customer Feedback Integration
- **Build Plan Version:** Updated to 2.6

  **Major Feature Additions/Enhancements:**

  1. **Coach App Enhancements (Stage 5):**
     - Incident Report System: 90-minute delay (not 6 hours), supervisor pause/send controls, custom templates
     - Curriculum Timer System: Visual timers with yellow/red indicators, auto-advance, configurable per section
     - Clarified Slack/Connecteam replacement as key selling point

  2. **Smart Coach Assignment (Stage 6):**
     - Drag-and-drop filter prioritization
     - Distance from home and last class (schedule-aware)
     - Owner-assigned rankings (1-5 scale)
     - Parent ratings (internal only, park classes only option)

  3. **Payment Plans (Stage 3):**
     - Plan Type 1: Divided payments with configurable intervals
     - Plan Type 2: Subscription/monthly with withdrawal notice
     - Plan Type 3: Two-payment split (registration + halfway)
     - Fee options: Flat dollar and percentage markups
     - Biometric authentication (Face ID, Touch ID)

  4. **Business Intelligence (Stage 4):**
     - Proactive Kai Chat Intervention at drop-off points
     - AI recommendation engine for popup placement
     - Churn prevention with auto-retention campaigns
     - Campaign coordination engine (prevent over-communication)

  5. **Marketing (Stage 9):**
     - Ad Platform Integration clarified (API connection, not replacement)
     - Direct budget control from Kairo dashboard
     - Employee Referral System with unique codes and payouts
     - Communications infrastructure clarified (in-house, no Mailchimp needed)

  6. **Engagement (Stage 7):**
     - Season-End Feedback & Tipping System
     - Conditional tip requests (all vs. positive reviews only)
     - Coach payment link integration (Venmo, PayPal, etc.)

  **Customer Questions Answered:**
  - Q: Is chat a Slack replacement? A: YES, eliminates Slack/Connecteam costs
  - Q: Can we do Apple Pay? A: YES, already planned
  - Q: Face recognition login? A: Added biometric authentication
  - Q: Can owners control ad spend? A: YES, via API integration
  - Q: Do users need Mailchimp? A: NO, all in-house

### January 5, 2026 - Benchmarking Intelligence Dashboard
- **Build Plan Version:** Updated to 2.7
- **Priority:** HIGH - Unique competitive advantage and premium revenue opportunity

  **New Stage Added: Stage 8.5 - Benchmarking Intelligence Dashboard**

  1. **Subscription Tiers:**
     - Base tier: View own data only (included in Essentials/Premium)
     - Benchmarking Add-on: +$99-149/mo for anonymous peer comparisons
     - Intelligence Add-on: +$199-299/mo for AI recommendations

  2. **Data Anonymization & Privacy:**
     - Minimum 5 businesses required before showing peer data
     - Geographic aggregation at state/region level minimum
     - Percentile ranges instead of exact values when N < 10
     - GDPR/CCPA compliant with opt-in/opt-out controls

  3. **Filter Controls:**
     - Geography (state, region, metropolitan area)
     - Sport/Activity type
     - Business size (revenue bands)
     - Number of locations
     - Years in business
     - Time period comparisons

  4. **Benchmarking Metrics:**
     - Enrollment: rate, trial-to-paid, re-enrollment, sibling, waitlist, cart abandonment
     - Revenue: per child, transaction value, pay-in-full ratio, per location, per session
     - Operations: class fill rate, coach utilization, cancellation rate, average class size

  5. **AI Recommendations Engine:**
     - Powered by Gemini 2.5 Flash (`gemini-2.5-flash`)
     - Revenue opportunity identification with estimated dollar values
     - Priority ranking (High/Medium/Low impact)
     - Action steps and success metrics

  6. **Demo Implementation:**
     - DemoBenchmarking.tsx component created
     - Added to Demo.tsx as Stage 8.5 with "NEW" badge
     - Includes simulated filter controls, benchmark cards, percentile visualizations
     - AI recommendations panel with locked/unlocked tier states

### January 5, 2026 - Internal Operations Dashboard
- **Build Plan Version:** Updated to 2.8
- **Priority:** HIGH - Critical for kAIro Pro LLC internal operations

  **New Stage Added: Stage 13 - Internal Operations Dashboard**

  **Key Philosophy:** Health = Transaction Activity, NOT Admin Login Frequency

  A customer processing 500 registrations with zero logins is healthier than a customer logging in daily but processing 10 registrations.

  1. **Two-Dashboard System:**
     - CEO Strategic View: "How's my business?" in 60 seconds
     - EA Operational View: "What needs attention RIGHT NOW?"

  2. **CEO Dashboard Features:**
     - Revenue & Growth Scorecard (MRR, ARR, GPV, Take Rate, ARPA)
     - Platform Performance vs. Industry (96% completion vs 50-60% industry)
     - Customer Health Overview (transaction-based, not login-based)
     - Investor Metrics (NRR, LTV:CAC, Gross Margin)
     - L10 Weekly Snapshot for EOS meetings

  3. **EA Dashboard Features:**
     - Priority Action List (Urgent/Important/Monitor)
     - Customer Health Detail Table with Health Scores
     - Transaction Monitoring (live feed, failed transactions)
     - Revenue Protection Center (expiring payments, volume declines)
     - Expansion Opportunities (usage-based upsell triggers)

  4. **Risk Definitions:**
     - High Risk: >40% volume decline, payment expiring <7 days, data export requests
     - Medium Risk: 20-40% volume decline, seasonal anomalies, payment expiring 8-30 days
     - Healthy: Within 20% of normal, >95% success rate

  5. **Key Metrics Philosophy Change:**
     - OLD (Don't Use): "Days since login", "Session duration", "Page views"
     - NEW (Use This): "Registration volume vs. normal", "Transaction success rate", "Features actively processing data"

  6. **Demo Implementation:**
     - DemoInternalDashboard.tsx component created with CEO/EA toggle
     - Added to Demo.tsx as Stage 13 with "NEW" badge
     - CEO view with revenue scorecard, platform performance, customer health, investor metrics
     - EA view with priority actions, customer table, transactions, revenue protection, expansion

---

**Document Owner:** Development Team
**Review Frequency:** After each stage completion
**Last Reviewed:** January 5, 2026
