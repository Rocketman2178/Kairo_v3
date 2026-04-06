# Kairo Development Updates

Changelog of all significant development milestones. New entries go at the **TOP**.
Format: `## [Month Year] - Title | Category | Description`

---

## [April 6, 2026] - Installment Start Date Control, Children Profiles Portal & Mid-Season Proration | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.1.0 (payment plan start/end date control NBC Priority 1), Stage 3.9 (parent portal children management), and Stage 3.1.0 (proration display NBC Priority 3)

**Description:**
Three registration and parent portal improvements. Installment Start Date Control adds a per-organization `installment_start_mode` setting ('registration' | 'class_start') that controls when installment billing schedules begin. When set to 'class_start' and the session is in the future, the divided-payments schedule labels the first installment "At class start — [date]" instead of "Due today", subsequent payments spread forward from class start, the monthly subscription schedule also anchors to class start, and `PaymentPlanSelector` shows an indigo info callout: "Installment billing begins on [class start date]." The org's setting is now returned by `get_pending_registration()` and propagated from `Register.tsx` → `PaymentForm` → `PaymentPlanSelector`. Children Profiles Panel adds a fifth "Children" tab to the Parent Portal dashboard — a `ChildrenPanel` component fetches all children linked to the family and renders individual `ChildCard` components with inline edit (name, last name, skill level) and an `AddChildForm` (first name, last name, DOB, skill level) for adding new children. The tab bar was reorganized into two rows to accommodate five tabs. Mid-Season Proration Indicator adds a `computeProration()` helper to `PaymentSummary.tsx` that detects when a session has already started (start_date < today), calculates remaining weeks, and shows a "Prorated — X of Y weeks remaining" indigo line item with the original price struck through. `Register.tsx` step 0 also shows an amber "Mid-season enrollment" warning banner when the class is in progress, stating how many weeks remain.

### Feature 1: Installment Start Date Control (Stage 3.1.0 — NBC Priority 1)
- `supabase/migrations/20260406000001_add_installment_start_mode_and_proration.sql`
  - `organizations.installment_start_mode` TEXT NOT NULL DEFAULT 'registration' CHECK IN ('registration', 'class_start')
  - Replaces `get_pending_registration()` to also return `organization.installment_start_mode`
- `src/utils/paymentPlans.ts`:
  - New `InstallmentStartMode` type exported
  - `buildDividedSchedule()` gains optional `scheduleStartDate` param; when set, first payment labeled "At class start — [date]"; subsequent 2-week intervals anchored to `scheduleStartDate`
  - `calculatePaymentPlans()` gains `installmentStartMode` param; computes `scheduleStartDate` when mode is 'class_start' and session is in the future; updates divided + subscription descriptions/schedules; `scheduleStartDate` used for subscription monthly anchoring
- `src/components/registration/PaymentPlanSelector.tsx`:
  - New `installmentStartMode` prop + `Info` icon import
  - `showClassStartNotice` flag; indigo callout shown when class_start mode is active and session is future
  - Passes `installmentStartMode` to `calculatePaymentPlans()`
- `src/components/registration/PaymentForm.tsx`:
  - New `installmentStartMode` prop (type `InstallmentStartMode`) forwarded to `PaymentPlanSelector`
- `src/pages/Register.tsx`:
  - `PendingRegistration.organization` sub-type added with `installmentStartMode`
  - `loadPendingRegistration` mapper reads `data.organization.installment_start_mode`
  - `PaymentForm` receives `installmentStartMode={registration?.organization.installmentStartMode ?? 'registration'}`
- `src/types/database.ts`: `organizations` Row/Insert/Update extended with `installment_start_mode`

### Feature 2: Children Profiles Panel in Parent Portal (Stage 3.9)
- `src/pages/ParentPortal.tsx`:
  - New `ChildProfile` interface (`id`, `firstName`, `lastName`, `dateOfBirth`, `skillLevel`)
  - New `ChildCard` component — displays child name, computed age, DOB badge, skill level badge; inline edit mode for name + skill level with save/cancel
  - New `AddChildForm` component — form for first name, last name, DOB (required), skill level; inserts to `children` table
  - New `ChildrenPanel` component — loads children by `family_id`, renders `ChildCard` list + `AddChildForm` toggle
  - `PortalDashboard.tab` type extended to include `'children'`
  - Tab bar reorganized to 2-row layout (row 1: Current / History / Waitlist; row 2: Tokens / Children)
  - Children tab renders `<ChildrenPanel familyId={family.id} />`

### Feature 3: Mid-Season Proration Indicator (Stage 3.1.0 — NBC Priority 3)
- `src/components/registration/PaymentSummary.tsx`:
  - New `computeProration(startDateStr, totalWeeks, totalPriceCents)` function — calculates `remainingWeeks` and `proratedCents` when session start < today
  - New `CalendarClock` icon import
  - `proration` computed at render time; when non-null: original price shows with line-through; "Prorated — X of Y weeks remaining" indigo line item shown with prorated amount
- `src/pages/Register.tsx`:
  - `Info` icon added to lucide-react imports
  - Step 0: inline IIFE computes `weeksElapsed` and `remaining`; renders amber "Mid-season enrollment" banner with remaining week count when session is in progress

**Files Changed:**
- `supabase/migrations/20260406000001_add_installment_start_mode_and_proration.sql` — **NEW**
- `src/utils/paymentPlans.ts` — `InstallmentStartMode` type; `buildDividedSchedule` `scheduleStartDate` param; `calculatePaymentPlans` `installmentStartMode` param
- `src/components/registration/PaymentPlanSelector.tsx` — `installmentStartMode` prop; class-start notice callout
- `src/components/registration/PaymentForm.tsx` — `installmentStartMode` prop forwarded
- `src/components/registration/PaymentSummary.tsx` — `computeProration()`; prorated line item; `CalendarClock` icon
- `src/pages/Register.tsx` — `PendingRegistration.organization`; mapper update; `Info` icon; mid-season banner; `installmentStartMode` passed to `PaymentForm`
- `src/pages/ParentPortal.tsx` — `ChildProfile`, `ChildCard`, `AddChildForm`, `ChildrenPanel`; 'children' tab; 2-row tab bar
- `src/types/database.ts` — `organizations.installment_start_mode`

**DB Migration Applied:**
- `add_installment_start_mode_and_proration` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓

**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [April 4, 2026] - Declined Waitlist History, Recurring Payment Billing Schedule & Pre-Checkout Session Details | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.6.1 (don't delete declined waitlist registrations NBC Priority 2), Stage 3.1.0 (recurring payment display clarity NBC Priority 2), and Stage 3.0 (confirmation screen detail overhaul NBC Priority 2)

**Description:**
Three registration and parent portal improvements. Declined Waitlist History preserves waitlist records when families turn down a spot notification — a `declined_at` timestamp is added and status transitions to `'declined'` (never deleted); the Parent Portal Waitlist tab now shows declined entries in a separate grayed-out "Declined" section with a `XCircle` "Spot Declined" badge and the date the spot was turned down. Also normalizes legacy `'active'` → `'pending'` and `'promoted'` → `'notified'` status values so the DB constraint matches frontend expectations; updates `add_to_waitlist_with_position` RPC to insert `'pending'` with a duplicate-family guard. Recurring Payment Billing Schedule adds a prominent amber "Recurring charges will apply" notice to the `RegistrationConfirmation` screen whenever an installment plan was selected — the notice shows each upcoming charge date and amount drawn from the `calculatePaymentPlans()` billing schedule; the first payment label changes from "Amount Paid" to "First Payment" for clarity; `paymentPlan` state is now properly used in `Register.tsx` (was discarded via `, setPaymentPlan`) and passed as `paymentPlanType` + `sessionWeeks` to `RegistrationConfirmation`. Pre-Checkout Session Details enhances step 0 of the registration flow — start date, end date, and class count are displayed in a new blue info row below the session grid; per-class cost is shown in the Program tile ("$X/class"); the `get_pending_registration` RPC now returns `end_date` and `duration_weeks` from the programs table; `PendingRegistration.session` type extended with `endDate` and `durationWeeks`; hardcoded `sessionWeeks={9}` in `PaymentForm` and `RegistrationConfirmation` replaced with actual `durationWeeks` from the registration data.

### Feature 1: Declined Waitlist History (Stage 3.6.1 — NBC Priority 2)
- `supabase/migrations/20260404000001_add_waitlist_declined_status.sql`
  - Drops old `valid_waitlist_status` CHECK constraint (`'active', 'promoted', 'cancelled'`)
  - Normalizes: `'active'` → `'pending'`, `'promoted'` → `'notified'` in existing rows
  - New constraint: `status IN ('pending', 'notified', 'enrolled', 'cancelled', 'declined')`
  - `waitlist.declined_at TIMESTAMPTZ` — populated when spot is declined
  - Replaces `add_to_waitlist_with_position()`: inserts `'pending'`, adds duplicate-family guard, uses fully-qualified table names, `SET search_path = ''`
- `src/pages/ParentPortal.tsx`:
  - `WaitlistRecord` extended with `declinedAt: string | null`
  - Query now fetches `declined_at` and includes `'declined'` in `.in('status', [...])`
  - `WaitlistPanel` splits entries into `activeEntries` and `declinedEntries`
  - `WaitlistEntryCard` inner component handles all three states (pending, notified, declined)
  - Declined entries: gray bg/border, `XCircle` "Spot Declined" badge, `declinedAt` date footer
  - Empty active list now shows inline empty state rather than full-page empty
- `src/types/database.ts`: `waitlist` Row/Insert/Update all extended with `declined_at`

### Feature 2: Recurring Payment Billing Schedule on Confirmation (Stage 3.1.0 — NBC Priority 2)
- `src/pages/Register.tsx`:
  - `const [, setPaymentPlan]` → `const [paymentPlan, setPaymentPlan]` (was discarding state)
  - `paymentPlanType={paymentPlan}` and `sessionWeeks={registration?.session.durationWeeks ?? 9}` now passed to `RegistrationConfirmation`
  - `sessionWeeks` on `PaymentForm` also uses actual `durationWeeks`
- `src/components/registration/RegistrationConfirmation.tsx`:
  - New props: `paymentPlanType?: PlanType`, `sessionWeeks?: number` (defaults: `'full'`, `9`)
  - Imports `calculatePaymentPlans` from `../../utils/paymentPlans`
  - Imports `CreditCard`, `AlertCircle` from lucide-react
  - `isInstallmentPlan` flag; `billingSchedule` computed from `calculatePaymentPlans()` when plan ≠ `'full'`
  - "Amount Paid" label changes to "First Payment" for installment plans
  - Amber "Recurring charges will apply" callout with per-installment charge cards shown when `isInstallmentPlan && billingSchedule.length > 0`

### Feature 3: Pre-Checkout Session Detail Enhancement (Stage 3.0 — NBC Priority 2)
- `supabase/migrations/20260404000002_enhance_pending_registration_details.sql`
  - Replaces `get_pending_registration()` to also select `s.end_date` and `p.duration_weeks`
  - JSON response now includes `end_date` and `duration_weeks` in the `session` object
  - Uses fully-qualified table names, `SET search_path = ''`
- `src/pages/Register.tsx`:
  - `PendingRegistration.session` extended: `endDate: string`, `durationWeeks: number | null`
  - `loadPendingRegistration` maps `data.session.end_date` and `data.session.duration_weeks`
  - Step 0 Program tile: per-class cost label `($X/class)` shown when `durationWeeks > 0`
  - New blue season details row below the 2×2 grid: start date → end date + class count
  - Start/end dates formatted as "Apr 15, 2026"; class count shown as "X classes total"

**Files Changed:**
- `supabase/migrations/20260404000001_add_waitlist_declined_status.sql` — **NEW**
- `supabase/migrations/20260404000002_enhance_pending_registration_details.sql` — **NEW**
- `src/types/database.ts` — `waitlist` Row/Insert/Update: `declined_at`
- `src/pages/ParentPortal.tsx` — `WaitlistRecord.declinedAt`; `XCircle` icon import; `declined_at` in query; `WaitlistEntryCard` component; active/declined split; updated empty state
- `src/pages/Register.tsx` — `paymentPlan` state active; `PendingRegistration.session.endDate + durationWeeks`; `loadPendingRegistration` mapper updated; step 0 per-class cost + season details row; `paymentPlanType`/`sessionWeeks` passed to `RegistrationConfirmation`; `sessionWeeks` on `PaymentForm` uses real `durationWeeks`
- `src/components/registration/RegistrationConfirmation.tsx` — `paymentPlanType`/`sessionWeeks` props; `calculatePaymentPlans` import; `CreditCard`/`AlertCircle` imports; billing schedule notice; "First Payment" label

**DB Migrations Applied:**
- `add_waitlist_declined_status` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓
- `enhance_pending_registration_details` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓

**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [April 3, 2026] - Custom Class Questions, External Registration Link-Out & Waitlist Claim Your Spot | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.6.1 (custom class questions NBC Priority 2, external registration link-out NBC Priority 1) and Stage 3.9 (waitlist-to-registration continuity NBC Priority 1)

**Description:**
Three registration and parent portal improvements implemented. Custom Class Questions adds a `custom_questions` JSONB column to sessions and `custom_answers` JSONB to registrations — organizations define per-session intake questions (text, select, textarea, checkbox) with required/optional flags; Register.tsx step 1 loads the session's questions after the pending registration is fetched, renders them under a "{Program} Questions" section with appropriate inputs, validates required answers before advancing to payment, and saves answers via UPDATE after `confirm_registration` succeeds. Demo Soccer Shots sessions seeded with "Youth Shirt Size" (required select) and "Allergies or Medical Notes" (optional textarea). External Registration Link-Out adds `external_registration_url` (text, nullable) to sessions — when set, the Sessions page "Register Now" button becomes "Register Externally →" (ExternalLink icon, opens in new tab, `noopener,noreferrer`); waitlist entries on full externally-linked sessions also link out instead of showing Notify Me; the `isExternal` flag is computed in `SessionBrowseCard`. Waitlist Claim Your Spot adds a `registration_data` JSONB column to the waitlist table for future data continuity (when a spot opens, form data can pre-populate the registration form), and updates the `notified` waitlist entries in the Parent Portal — the existing "Contact the organization" text is replaced with a "Claim Your Spot" amber button linking to `/?session={session_id}` to start a fresh Kai conversation for that specific class; the WaitlistRecord type and query now include `sessions.id`.

### Feature 1: Custom Class Questions (Stage 3.6.1 — NBC Priority 2)
- `supabase/migrations/20260403000001_add_custom_questions_external_url_waitlist_data.sql`
  - `sessions.custom_questions` JSONB, default `[]` — array of `{id, label, type, required, options?, placeholder?}` objects
  - `registrations.custom_answers` JSONB, default `{}` — key/value answers matching question IDs
  - Demo seed: 2 questions (shirt_size select, allergy_notes textarea) applied to Soccer Shots sessions via `ILIKE '%Soccer%'`
- `Register.tsx`:
  - `CustomQuestion` interface: `{id, label, type, required, options?, placeholder?}`
  - `customQuestions: CustomQuestion[]` state + `customAnswers: Record<string, string>` state
  - `useEffect` fetches `sessions.custom_questions` after `registration` loads (by session ID)
  - `handleCustomAnswerChange(questionId, value)` handler updates `customAnswers` map
  - `validateStep2()` extended: loops `customQuestions`, errors on any `required` question with no answer
  - Step 1 renders a "{Program} Questions" section (only when `customQuestions.length > 0`) with:
    - `select` → `<select>` with option list
    - `textarea` → `<textarea>`
    - `checkbox` → `<input type="checkbox">`
    - default → `<input type="text">`
  - `handleDemoPayment` saves `custom_answers` via `supabase.from('registrations').update({ custom_answers })` after successful `confirm_registration`

### Feature 2: External Registration Link-Out (Stage 3.6.1 — NBC Priority 1)
- `supabase/migrations/20260403000001_...` — `sessions.external_registration_url` TEXT, nullable
- `Sessions.tsx`:
  - `external_registration_url: string | null` added to `SessionRow` interface
  - Both Supabase queries (main + direct-session fallback) select `external_registration_url`
  - `ExternalLink` icon added to lucide-react imports
  - `isExternal` computed: `Boolean(session.external_registration_url)`
  - `handleRegister()` updated: external → `window.open(url, '_blank', 'noopener,noreferrer')`; internal → `navigate('/?session=...')`
  - Register Now button shows `ExternalLink` icon + "Register Externally" label when `isExternal`
  - Full sessions: Notify Me button hidden when `isExternal`; Waitlist button → "Register Externally" when `isExternal`

### Feature 3: Waitlist Claim Your Spot + Data Continuity (Stage 3.9 — NBC Priority 1)
- `supabase/migrations/20260403000001_...` — `waitlist.registration_data` JSONB, default `{}`
- `ParentPortal.tsx`:
  - `WaitlistRecord.session` extended with `id: string`
  - `WaitlistPanel` query: `sessions!inner` now selects `id` in addition to existing fields
  - Mapper updated: `session.id = sess.id`
  - Notified waitlist entry callout updated:
    - "Contact the organization" text replaced with "Act quickly — spots are held for a limited time."
    - New `<a href="/?session={entry.session.id}">` "Claim Your Spot" amber button with `BellRing` + `ChevronRight` icons

**Files Changed:**
- `supabase/migrations/20260403000001_add_custom_questions_external_url_waitlist_data.sql` — **NEW**
- `src/types/database.ts` — `sessions` Row/Insert/Update: `custom_questions`, `external_registration_url`; `registrations` Row/Insert/Update: `custom_answers`; `waitlist` Row/Insert/Update: `registration_data`
- `src/pages/Register.tsx` — `CustomQuestion` interface; `customQuestions`/`customAnswers` state; fetch useEffect; `handleCustomAnswerChange`; custom questions section in step 1; required-question validation; `custom_answers` UPDATE after confirm
- `src/pages/Sessions.tsx` — `external_registration_url` in `SessionRow`; added to both queries; `ExternalLink` import; `isExternal` flag; updated `handleRegister`; updated CTA buttons
- `src/pages/ParentPortal.tsx` — `WaitlistRecord.session.id`; query includes `sessions.id`; mapper includes `sess.id`; "Claim Your Spot" CTA on notified entries

**DB Migration Applied:** `add_custom_questions_external_url_waitlist_data` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓
**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [April 1, 2026] - Location/Program Combinable Filters, Age Half-Precision & Waitlist Portal Tab | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.6.1 (combinable filters NBC Priority 1, age precision NBC Priority 2) and Stage 3.9 (waitlist visible from member view NBC Priority 2)

**Description:**
Three registration discovery and parent portal improvements implemented. Location + Program Type Combinable Filters adds two new dropdown filters to the Sessions page browse experience — a Location dropdown (unique location names derived from loaded sessions) and a Sport/Program dropdown (unique program names) — both combining via AND logic with the existing keyword, day-of-week, and zip filters; URL params `?location=` and `?program=` make filtered views shareable. Age in Years & Months replaces the free-text age Min/Max inputs with select dropdowns offering half-year precision (1, 1.5, 2, 2.5, … 18 yrs) using human-readable labels ("3 yrs 6 mo"), with the filter logic updated to `parseFloat` so fractional ages work correctly. Waitlist Portal Tab adds a fourth "Waitlist" tab to the Parent Portal dashboard that queries active (pending + notified) waitlist entries for the family and displays each entry's class name, child name, position in queue, day/time, location, and date added; entries with `status='notified'` show an amber "Spot Available" callout with the notification date and instructions to confirm enrollment.

### Feature 1: Location + Program Type Combinable Filters (Stage 3.6.1 — NBC Priority 1)
- `FilterState` extended with `location` and `program` fields; URL params `?location=` and `?program=`
- `uniqueLocations` and `uniquePrograms` useMemo hooks derive sorted option lists from all loaded sessions
- Filter panel: two new dropdowns (Location, Sport/Program) in the first filter row (3-column grid)
- Filter logic: `if (filters.location && loc?.name !== filters.location) return false` + same for program
- `activeFilterCount` updated to include `location` and `program`
- First filter row reorganized: Location | Sport/Program | Zip (3-column); second row: Day | Min Age | Max Age (3-column)

### Feature 2: Age in Years & Months with Half-Year Precision (Stage 3.6.1 — NBC Priority 2)
- `AGE_OPTIONS` constant: generates `{ value, label }` pairs from 1 to 18 in 0.5-year steps
  - Whole years: "1 yr", "2 yrs", …, "18 yrs"
  - Half years: "1 yrs 6 mo", "2 yrs 6 mo", etc.
- Min Age and Max Age inputs replaced with `<select>` dropdowns using `AGE_OPTIONS`
- Age filter logic updated: `parseInt` → `parseFloat` so "3.5" correctly includes classes for ages 3–5
- Label accuracy: "3.5" in URL renders as "3 yrs 6 mo" in the dropdown

### Feature 3: Waitlist Tab on Parent Portal (Stage 3.9 — NBC Priority 2)
- New `WaitlistRecord` interface: id, position, status, createdAt, notifiedAt, childFirstName, childLastName, session (dayOfWeek, startTime, startDate, programName, locationName)
- New `WaitlistPanel` component: queries `waitlist` table with `children` + `sessions!inner(programs, locations)` join, filtered to `family_id` + `status IN ('pending', 'notified')`, ordered by created_at desc
- Each entry card shows: status badge (position in line vs. "Spot Available"), program name, child name + day/time, location with MapPin icon, date added
- `status='notified'` entries: amber border/background, BellRing icon badge, notification date footer
- Tab bar in `PortalDashboard` updated: Current | History | Waitlist | Tokens (4 tabs)
- `tab` state type widened: `'upcoming' | 'history' | 'waitlist' | 'tokens'`
- New icons imported: `ListOrdered`, `BellRing` from lucide-react

**Files Changed:**
- `src/pages/Sessions.tsx` — FilterState extended with `location`/`program`; `AGE_OPTIONS` constant; `uniqueLocations`/`uniquePrograms` useMemos; filter panel redesigned (2 grids: 3-col each); filter logic for location + program; age filter uses `parseFloat`
- `src/pages/ParentPortal.tsx` — `WaitlistRecord` interface; `WaitlistPanel` component; `WaitlistPanelProps`; `ListOrdered`/`BellRing` icons; tab type widened; Waitlist tab button + render in PortalDashboard

**No DB migrations required (client-side filter logic + queries against existing schema).**
**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [April 1, 2026] - Zip/Postal Code Filter, Notify Me Interest Capture & Session Class Count | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.6.1 (zip code filter NBC Priority 1, notify me NBC Priority 3, class count NBC Enhancement)

**Description:**
Three session discovery and UX improvements implemented. Zip/Postal Code Filter adds a `zip_code` column to the locations table (all 20 demo locations seeded), a new Zip/Postal Code input in the Sessions page filter panel, and client-side proximity sorting that ranks "In your area" (exact match) above "Nearby" (same 3-digit prefix) above distant classes — with a proximity banner and URL-persisted `?zip=` parameter. Canadian postal codes are supported via the "Zip / Postal Code" label and the same prefix-matching approach. The Notify Me feature adds a `session_interest` table (public INSERT, service_role managed) and a modal that captures a parent's name and email for full classes — a duplicate-safe INSERT stores the request and shows a confirmation state, giving orgs a lead list for when spots open. Session Class Count adds a `# X classes` badge to every session card, computed from `duration_weeks` (primary) or derived by counting weekly occurrences between `start_date` and `end_date` (fallback), so families understand the commitment before registering.

### Feature 1: Zip / Postal Code Proximity Filter (Stage 3.6.1 — NBC Priority 1)
- New `supabase/migrations/20260401000001_add_zip_code_and_session_interest.sql`
  - `locations.zip_code` (text, nullable) — stores US zip or Canadian postal code
  - All 20 demo locations seeded with correct zip codes from existing addresses
  - `idx_locations_zip_code` partial index
- `Sessions.tsx` — `zip_code` added to `LocationRow` type and Supabase select query
- `FilterState` extended with `zip` field; URL param `?zip=`
- Filter panel: new "Zip / Postal Code" input with `MapPin` icon and inline clear button
- `zipProximityLabel()` helper: returns `'exact'` (same zip), `'nearby'` (same 3-char prefix), or `null`
- Client-side filter: sessions at unmatched locations excluded; sessions with no zip pass through
- Sort: when `?zip=` is active, results sorted exact → nearby within each day group
- `SessionBrowseCard`: "In your area" (green) and "Nearby" (blue) proximity badges on cards
- Proximity banner displayed above results when zip filter is active with clear button
- No-results copy updated to explain zip filter and suggest widening the search

### Feature 2: "Notify Me" Interest Capture for Full Classes (Stage 3.6.1 — NBC Priority 3)
- `session_interest` table in same migration — `session_id`, `organization_id`, `email`, `name`, `notify_on`, `notified_at`, `created_at`
- Unique index on `(session_id, lower(email))` prevents duplicate interest entries
- RLS: `public` INSERT only; `service_role` full access for notification dispatch
- New `NotifyMeModal` component in `Sessions.tsx`
  - Displays class name, day/time, and location + "Class is currently full" indicator
  - Optional name field + required email with inline validation
  - On submit: upsert to `session_interest`; unique constraint violations treated as success (idempotent)
  - Success state: confirmation with enrolled email displayed
  - Accessible: `role="dialog"`, Escape to dismiss, auto-focus email input, backdrop click to close
- `SessionBrowseCard`: full sessions now show both a "Notify Me" button (indigo) and "Waitlist" button (amber) side by side
- Waitlist button label shortened to "Waitlist" (was "Join Waitlist") to fit alongside Notify Me

### Feature 3: Session Class Count Display (Stage 3.6.1 — NBC Enhancement)
- `computeClassCount()` helper in `Sessions.tsx`
  - Primary: returns `programs.duration_weeks` directly
  - Fallback: counts weekly occurrences of `session.day_of_week` between `start_date` and `end_date`
- `SessionBrowseCard`: `# X classes` badge rendered below price using `Hash` Lucide icon
- Shows on all cards where a count can be computed; hidden if neither source is available

**Files Changed:**
- `supabase/migrations/20260401000001_add_zip_code_and_session_interest.sql` — **NEW** — `locations.zip_code`; `session_interest` table with RLS
- `src/pages/Sessions.tsx` — `zip_code` in LocationRow; `zip` in FilterState; zip filter input; proximity sorting; proximity badges; NotifyMeModal component; Notify Me button on full sessions; `computeClassCount()` helper; class count badge; `useRef`/`useCallback` imports added
- `src/types/database.ts` — `zip_code` added to `locations` Row/Insert/Update; `session_interest` table types added

**DB Migration Applied:** `add_zip_code_and_session_interest` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓
**zip_code populated for all 20 demo locations via follow-up SQL.**
**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [March 25, 2026] - Hidden/Unlisted Classes, Suggested Classes During Checkout & Marketing Opt-Ins | Core Feature | High

**Category:** Core Feature
**Impact:** High — Advances Stage 3.6.1 (hidden classes NBC Priority 1, suggested classes NBC Priority 1, marketing opt-ins NBC Enhancement)

**Description:**
Three registration and discovery features implemented. Hidden/Unlisted Classes adds `is_hidden` and `direct_link_token` to the sessions table; the public `/sessions` page filters these out automatically but still loads the session if a direct `?session={id}` link is shared, showing a "Private" badge. Suggested Classes During Checkout shows up to 3 other available sessions on registration step 0 in a "Registering for another time?" card, giving families an easy way to switch to a different time slot without abandoning the flow. Marketing Opt-In Checkboxes adds explicit email and SMS consent checkboxes to the registration form step 1 (Your Information) — email defaults on, SMS defaults off — and persists both preferences to the `families` table for use in communications pipelines.

### Feature 1: Hidden/Unlisted Classes (Stage 3.6.1 — NBC Priority 1)
- New `supabase/migrations/20260325000001_add_hidden_sessions_and_marketing_optins.sql`
  - `sessions.is_hidden` (boolean, default false) — hides session from public `/sessions` listing
  - `sessions.direct_link_token` (text, unique, nullable) — future admin-generated shareable token for private class links
  - Indexes on `is_hidden` (partial, where false) and `direct_link_token` (partial, where not null)
- `Sessions.tsx` — `is_hidden` added to `SessionRow` type; Supabase query now filters `.eq('is_hidden', false)` for general listing
- Direct link handling: if `?session={id}` references a hidden session, a second targeted query fetches just that session and appends it to the list — direct links to private classes work correctly
- `EyeOff` badge with "Private" label shown on hidden session cards when accessed via direct link

### Feature 2: Suggested Classes During Checkout (Stage 3.6.1 — NBC Priority 1)
- `Register.tsx` — new `SuggestedSession` interface and `suggestedSessions` state
- `useEffect` fires when registration loads: fetches up to 3 non-hidden active/full sessions excluding the current one, ordered by start date
- Step 0 (Confirm Session) renders a "Registering for another time?" section below the Continue button when suggestions exist
- Each suggestion card shows: program name, day + time + location, spots remaining (or Full badge)
- Clicking a suggestion navigates to `/?session={id}` to start a fresh Kai chat for that class
- `Sparkles` icon, hover states, and arrow cues make the section discoverable but non-intrusive

### Feature 3: Marketing Opt-In Checkboxes (Stage 3.6.1 — NBC Enhancement)
- `families.email_opt_in` (boolean, default true) and `families.sms_opt_in` (boolean, default false) added via same migration
- `FormData` interface in `Register.tsx` extended with `emailOptIn` and `smsOptIn` fields
- Step 1 (Your Information) now includes a "Communication Preferences" section with two labeled checkboxes:
  - Email updates (defaulted on): class reminders, schedule changes, seasonal announcements
  - SMS alerts (defaulted off): urgent notifications; includes "Msg & data rates may apply" CAN-SPAM/TCPA disclosure
- Both checkboxes use existing `handleInputChange` (type=checkbox branch); values persisted to `families` table in `createFamilyAndChild` and `handleDemoPayment`
- `Mail` and `MessageSquare` Lucide icons used for visual distinction between channels

**Files Changed:**
- `supabase/migrations/20260325000001_add_hidden_sessions_and_marketing_optins.sql` — **NEW** — `is_hidden`, `direct_link_token` on sessions; `email_opt_in`, `sms_opt_in` on families
- `src/pages/Sessions.tsx` — `is_hidden` in SessionRow type; filtered query; direct-link fallback fetch; EyeOff Private badge; EyeOff import
- `src/pages/Register.tsx` — SuggestedSession type; suggestedSessions state; fetch useEffect; step 0 suggestions card; emailOptIn/smsOptIn in FormData; opt-in checkboxes in step 1; opt-ins saved to families insert; Mail/MessageSquare/Sparkles imports

**DB Migration Applied:** `add_hidden_sessions_and_marketing_optins` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓
**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [March 24, 2026] - Session Browse Page, Proactive Kai Chat Intervention & Makeup Token System | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes Stage 3.6.1 (session browse/search), advances Stage 4.2 (proactive intervention), and launches Stage 3.7 Phase 1 (makeup tokens)

**Description:**
Three features implemented across customer discovery, behavioral retention, and class cancellation UX. The Session Browse Page gives families a searchable, filterable directory of all available classes at `/sessions` with shareable filter URLs and per-class share links. The Proactive Kai Chat Intervention adds a behavioral analytics hook that tracks inactivity and time-on-step, surfacing a contextual Kai chat popup when abandonment risk is detected on the registration flow. The Makeup Token System Phase 1 establishes the full database schema for tokens with RLS, three DB functions (`issue_makeup_token`, `use_makeup_token`, `get_family_tokens`), and a Tokens tab in the Parent Portal showing active token status with expiry urgency indicators.

### Feature 1: Session Browse Page (Stage 3.6.1)
- New `src/pages/Sessions.tsx` — browsable session directory at `/sessions`
- Keyword search: queries program name, description, location, address, day of week
- Filter panel: day of week (quick-pill day selector + dropdown), min/max age range
- URL-based shareable filters (`?q=soccer&day=Monday&ageMin=4`) — filters stored in URL params, persist on share/bookmark
- Per-class "Share" button: copies direct class link (`/sessions?session={id}`) to clipboard with visual confirmation
- Direct link highlighting: `?session={id}` param highlights the linked class with a ring
- Grouped display by day of week with session count per day
- Mobile-first responsive grid (1-col mobile, 2-col desktop)
- Register button navigates to `/?session={id}` (starts Kai chat); Waitlist button for full classes
- "Chat with Kai" footer CTA for users who want personalized recommendations
- "Browse Classes" link added to Home.tsx header nav
- Route `/sessions` added to App.tsx

### Feature 2: Proactive Kai Chat Intervention (Stage 4.2)
- New `src/hooks/useProactiveTrigger.ts` — behavioral analytics hook
  - Tracks inactivity: fires after 35 seconds of no mouse/keyboard/touch/scroll activity
  - Tracks time-on-step: fires after 75 seconds of lingering on a single registration step
  - Both timers reset when user advances to the next step
  - Per-step dismiss memory: once dismissed on a step, does not re-trigger for that step
  - No PII captured — timing-only events, all in-memory
- New `src/components/registration/ProactiveChatPopup.tsx` — contextual popup component
  - Step-contextual messages: different headline/subtext per step (session choice, info form, payment)
  - Special "Don't lose your spot!" message for inactivity triggers
  - Mobile: slides up from bottom with backdrop; desktop: slides in from bottom-right corner
  - Accessible: `role="dialog"`, Escape key to dismiss, auto-focus CTA button
  - "Chat with Kai" CTA navigates to `/` (home chat); "Not now" dismisses
- Integrated into `Register.tsx`: hook active on steps 0–2 (not on confirmation step 3)

### Feature 3: Makeup Token System Phase 1 (Stage 3.7)
- New `supabase/migrations/20260324000001_add_makeup_token_system.sql`
  - `makeup_tokens` table: org/family/child scoped, skill-level locked, expiry-tracked, status lifecycle (`active`/`used`/`expired`/`cancelled`/`forfeited`)
  - Indexes: family, child, (status, expires_at) partial, organization
  - `updated_at` trigger with `SET search_path = ''`
  - RLS: families see own tokens; staff see org tokens; service_role has full access
  - `issue_makeup_token()` — creates token with configurable expiry (default 12 months) and optional fee
  - `use_makeup_token()` — atomic redemption with FOR UPDATE lock; returns error for expired/used tokens
  - `get_family_tokens()` — auto-expires stale active tokens, returns counts + active token list with child/program info and expiry urgency labels (`urgent` <7 days, `warning` <30 days, `ok`)
  - Permissions: `issue_makeup_token` → service_role only; `use_makeup_token` → authenticated+service_role; `get_family_tokens` → authenticated+anon
- `MakeupTokensPanel` component added to `src/pages/ParentPortal.tsx`
  - Active/Used/Expired counts summary row
  - "How tokens work" info card explaining level-lock and expiry
  - Per-token card: child name, source program, skill level, days until expiry with urgency color (red/amber/none), makeup fee badge if applicable
  - "Browse available makeup slots" link → `/sessions`
  - Empty state with explanation when no tokens exist
- **Tokens** tab added to Parent Portal tab bar alongside Current/History

**Files Changed:**
- `src/pages/Sessions.tsx` — **NEW** — Browsable session directory with search/filter
- `src/pages/ParentPortal.tsx` — Tokens tab + MakeupTokensPanel component + MakeupToken/TokenSummary types
- `src/hooks/useProactiveTrigger.ts` — **NEW** — Behavioral analytics hook for abandonment detection
- `src/components/registration/ProactiveChatPopup.tsx` — **NEW** — Contextual Kai popup for at-risk users
- `src/pages/Register.tsx` — useProactiveTrigger hook + ProactiveChatPopup render
- `src/pages/Home.tsx` — "Browse Classes" link added to header nav
- `src/App.tsx` — `/sessions` route added
- `supabase/migrations/20260324000001_add_makeup_token_system.sql` — **NEW** — makeup_tokens table + 3 RPC functions

**DB Migration Applied:** `add_makeup_token_system` → Kairo (`tatunnfxwfsyoiqoaenb`) ✓
**No new Edge Functions deployed.**
**No n8n workflow changes.**

---

## [March 24, 2026] - Parent Portal, Reporting Engine & Churn Prevention Dashboard | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes Stage 3.9 (parent portal), Stage 4.2.5 (reporting engine), Stage 4.3 (churn prevention)

**Description:**
Three features implemented across family-facing UX, business intelligence, and retention tooling. The Parent Portal gives families a self-service view of their registrations, schedule, and account info at `/portal` — accessed by email lookup, no auth account required. The Reporting Engine provides admins with enrollment tables (filterable + CSV export), revenue-by-program breakdown, and a printable class schedule view at `/reports`. The Churn Prevention Dashboard at `/retention` computes a risk score per family based on days since last activity, abandoned carts, and engagement score — showing at-risk families with one-click email outreach templates. All three are accessible from the Analytics dashboard.

### Feature 1: Parent Portal (Stage 3.9)
- New `src/pages/ParentPortal.tsx` — family self-service portal at `/portal`
- Email-gate landing screen: family enters registration email → looks up their `families` record
- Supports `?email=` URL param for pre-fill from confirmation email links
- **PortalDashboard** component: stats row (active, total, paid), tab bar (Current / History)
- **RegistrationCard** component: program name, child name+age, day/time/location, status badge, amount, enrolled date
- **ContactEditor** component: inline edit for `primary_contact_name` and `phone`; email shown as read-only; saves directly to `families` table via Supabase
- Registrations joined from: `sessions → programs`, `sessions → locations`, `children`
- Filters out `pending_registration` status rows — shows only actionable records
- Re-enrollment CTA card at bottom links back to home chat flow with sibling discount messaging
- Mobile-first, 44px min tap targets throughout

### Feature 2: Reporting Engine (Stage 4.2.5)
- New `src/pages/Reports.tsx` — admin reporting at `/reports`
- Three report tabs: **Enrollment**, **Revenue**, **Schedule**
- **Enrollment Report**: joins registrations + families + children + sessions + programs + locations; search by child/parent/program name; status filter dropdown; mobile card view + desktop table; summary bar (total, confirmed, revenue); CSV export
- **Revenue Report**: confirmed+paid registrations aggregated by program; horizontal bar chart by revenue share; per-program stats (registrations, avg amount); total revenue + count cards; CSV export
- **Schedule Report**: active sessions with enrolled student lists; filter by day of week; capacity fill indicator (green/amber/red); student name chips; coach/location/time metadata; print button (`window.print()`); CSV export with one row per student per class
- `exportCsv()` utility: generates downloadable `.csv` files client-side
- Date range selector (7d/30d/90d/all) on Enrollment and Revenue tabs
- Navigation: accessible from Analytics dashboard via quick-link card

### Feature 3: Churn Prevention Dashboard (Stage 4.3)
- New `src/pages/Retention.tsx` — at-risk family scoring at `/retention`
- `computeRisk()` function: weighted scoring (0–100) across 4 factors:
  - Days since last confirmed registration (most weighted: up to 40 pts)
  - Unrecovered abandoned carts (up to 30 pts)
  - Low engagement score from `families.engagement_score` (up to 20 pts)
  - Single-registration status / no loyalty signal (10 pts)
- Risk levels: **Critical** (≥60), **High** (≥40), **Medium** (≥20), **Low** (<20)
- **FamilyRiskCard** component: risk score bar, risk factor list, stats row, email outreach button (pre-fills subject + body with personalized template), phone call link
- Filter tabs by risk level with counts; CSV export of at-risk list
- Insight card: surfaces total unrecovered abandoned carts with action prompt
- Risk methodology card: explains scoring factors to admins
- Navigation: accessible from Analytics dashboard via quick-link card

**Files Changed:**
- `src/pages/ParentPortal.tsx` — **NEW** — Family self-service portal
- `src/pages/Reports.tsx` — **NEW** — Admin reporting engine (enrollment, revenue, schedule)
- `src/pages/Retention.tsx` — **NEW** — Churn prevention at-risk dashboard
- `src/App.tsx` — `/portal`, `/reports`, `/retention` routes added
- `src/pages/Analytics.tsx` — Quick-link cards to Reports and Retention added

**No new DB migrations** — all features use existing schema.
**No new Edge Functions** — all data fetched client-side via Supabase.

---

## [March 23, 2026] - Saved Payment Methods, Re-enrollment Reminders & Analytics Dashboard | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes Stage 3.1/3.3 (saved cards + quick checkout), Stage 3.6 (reenrollment reminders), and starts Stage 4.1 (analytics dashboard)

**Description:**
Three features implemented across payment UX, lifecycle communications, and business intelligence. Saved Payment Methods + Quick Checkout completes the returning-family registration experience by auto-saving cards via Stripe Customers and enabling one-click re-registration. Re-enrollment Reminders adds an edge function that detects families whose season ended 14–35 days ago and triggers personalized n8n email campaigns to bring them back. The Analytics Dashboard (Stage 4.1) is a live-data page at `/analytics` showing conversion funnel, revenue by program, abandoned cart drop-off points, and recovery rate.

### Feature 1: Saved Payment Methods + Quick Checkout (Stage 3.1 + 3.3)
- DB migration: `families.stripe_customer_id` (text, indexed) — stores Stripe Customer ID after first payment
- `create-payment-intent` edge function updated (v3):
  - Looks up or creates a Stripe Customer when `email`/`familyId` provided
  - Saves `stripe_customer_id` back to families table on creation
  - Adds `setup_future_usage: 'off_session'` to PaymentIntent — card saved automatically after payment
  - Returns `stripeCustomerId` in response
- New `list-payment-methods` edge function (v1, JWT disabled):
  - Validates access via `registrationToken` + `email` pair
  - Returns masked card data (brand, last4, expiry, isDefault) from Stripe
  - Returns empty array gracefully when Stripe unconfigured
- New `quick-checkout` edge function (v1, JWT disabled):
  - Creates and confirms a PaymentIntent server-side using a saved payment method
  - Verifies payment method belongs to the family's Stripe Customer (ownership check)
  - Handles 3DS by returning `requiresAction: true` + `clientSecret` for frontend handling
  - Calls `confirm_registration` RPC on successful payment
- New `useSavedPaymentMethods` hook — fetches saved cards from `list-payment-methods` edge function; enabled only on step 2 for returning families
- New `SavedPaymentMethods` component:
  - Shows saved cards with brand, last4, expiry
  - Card selection with default indicator
  - "Quick Pay with saved card" button
  - "or pay with a new card" divider below
- `PaymentForm.tsx` updated: accepts `savedCards`, `savedCardsLoading`, `onQuickPay`, `quickPayProcessing`, `quickPayMethodId` props; renders `SavedPaymentMethods` above Stripe Elements for returning families
- `Register.tsx` updated:
  - Imports and calls `useSavedPaymentMethods` hook (enabled on step 2 + isReturningFamily)
  - `handleQuickPay` — calls quick-checkout edge function, handles 3DS fallback, marks recovered on success
  - Passes `familyId` to `create-payment-intent` so Stripe Customer is linked to the known family record
  - Wires all new props to `PaymentForm`

### Feature 2: Re-enrollment Reminders Edge Function (Stage 3.6)
- DB migration: `registrations.reenrollment_reminder_sent_at` (timestamptz, partial index on NULL) — prevents duplicate reminder sends
- New `trigger-reenrollment-reminders` edge function (v1, JWT disabled, webhook key auth):
  - `sweep` mode: finds up to 50 confirmed registrations with sessions ending 14–35 days ago that haven't had a reminder sent
  - `single` mode: targets one registration by ID (for manual triggers)
  - Triggers n8n webhook with `reenrollment_reminder` intent including family, child, program, session, and pricing data
  - Marks `reenrollment_reminder_sent_at` after successful n8n trigger to prevent duplicates
  - Authentication: `X-Webhook-Key` header validated against `REENROLLMENT_WEBHOOK_KEY` secret

### Feature 3: Analytics Dashboard — Core Analytics (Stage 4.1)
- New `src/pages/Analytics.tsx` — live analytics page at `/analytics`
- Real Supabase data queries (no mock data):
  - Confirmed registrations + total revenue (filtered by time range)
  - Conversations count for top-of-funnel (conversion rate = confirmed / conversations)
  - Abandoned carts count + recovery rate
  - Average registration amount
- **Conversion Funnel** component: 5 stages (Chat started → Session selected → Info submitted → Payment initiated → Complete) with percentage bars
- **Drop-off Points** panel: abandoned carts broken down by step_abandoned with percentage distribution
- **Revenue by Program** chart: bar chart of top 6 programs by revenue, with registration count
- Time range selector: 7d / 30d / 90d / All time
- Refresh button + last-updated timestamp
- Mobile-first layout: 2-col on mobile → 6-col metric grid on desktop, 2-col charts on large screens
- Source/device tracking placeholder card noting upcoming Stage 4.1 additions
- Route `/analytics` added to `App.tsx`

**Files Changed:**
- `supabase/migrations/20260323000001_add_stripe_customer_id_and_reenrollment.sql` — **NEW** — DB columns for saved cards + reenrollment tracking
- `supabase/functions/create-payment-intent/index.ts` — Updated (v3) — Stripe Customer creation/reuse, setup_future_usage
- `supabase/functions/list-payment-methods/index.ts` — **NEW** (v1) — List saved Stripe cards for returning family
- `supabase/functions/quick-checkout/index.ts` — **NEW** (v1) — Server-side confirmation with saved card
- `supabase/functions/trigger-reenrollment-reminders/index.ts` — **NEW** (v1) — Reenrollment reminder sweep/single trigger
- `src/hooks/useSavedPaymentMethods.ts` — **NEW** — Hook to fetch saved cards from edge function
- `src/components/registration/SavedPaymentMethods.tsx` — **NEW** — Saved cards UI + Quick Pay button
- `src/components/registration/PaymentForm.tsx` — saved cards props + SavedPaymentMethods render
- `src/pages/Register.tsx` — useSavedPaymentMethods hook, handleQuickPay, familyId in payment intent
- `src/pages/Analytics.tsx` — **NEW** — Live analytics dashboard page
- `src/App.tsx` — `/analytics` route added

**DB Migrations Applied:** `add_stripe_customer_id_and_reenrollment` → Kairo (`tatunnfxwfsyoiqoaenb`)

**Edge Functions Deployed:**
- `create-payment-intent` — version 3, ACTIVE (Stripe Customer + setup_future_usage)
- `list-payment-methods` — version 1, ACTIVE, JWT disabled
- `quick-checkout` — version 1, ACTIVE, JWT disabled
- `trigger-reenrollment-reminders` — version 1, ACTIVE, JWT disabled (webhook key auth)

---

## [March 19, 2026] - Multi-Language Support, Failed Payment Recovery & Text-to-Speech | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes 3 Stage 2B/3 items: Spanish language support for the registration flow, contextual payment failure recovery UI, and TTS so Kai can read responses aloud.

**Description:**
Three features implemented across the registration experience. Multi-Language Support (Stage 2B.2) adds a language service with full English/Spanish translations, a language toggle in the Kai chat header, and automatic browser-language detection persisted to localStorage. Failed Payment Recovery (Stage 3.1) adds a full-screen recovery panel when a Stripe payment fails — maps decline codes to friendly messages and offers "Try Again", "Use Different Card", and "Contact Support" actions without losing the user's registration data. Text-to-Speech (Stage 2B.1) completes the voice experience by allowing Kai to read responses aloud using the Web Speech API, with a speaker toggle in the chat header.

### Feature 1: Multi-Language Support — English & Spanish (Stage 2B.2)
- New `src/services/ai/languageService.ts` — language service with full EN/ES translation strings for all registration UI copy
- `getStoredLanguage()` — reads preference from localStorage, falls back to browser `navigator.language`
- `setStoredLanguage()` — persists language selection to localStorage
- `getStrings(lang)` — returns the full `LanguageStrings` interface for the given language
- `t(template, vars)` — interpolates variables into translation strings (e.g. `{childName}`)
- `LANGUAGE_LOCALE` map — BCP-47 tags for Speech API (`en-US`, `es-US`)
- `ChatInterface.tsx` updated — language toggle button (EN/ES) added to the header; all UI strings (placeholder, buttons, fallback form, messages) now use translations; Kai greeting is sent in the selected language on first message; resetting language triggers a fresh greeting
- Language preference is per-session (localStorage) and survives page refresh

### Feature 2: Failed Payment Recovery UI (Stage 3.1)
- New `src/components/registration/PaymentFailedRecovery.tsx` — full recovery panel component
  - Maps `PaymentFailureReason` enum to contextual headlines, descriptions, and tips
  - Recovery actions: "Try Again" (same card), "Use Different Card" (resets PaymentIntent), "Contact Support" (mailto), "Start New Registration" (back to home)
  - "Use Different Card" path calls `createPaymentIntent()` to issue a fresh PaymentIntent
  - Reassurance note: "Your spot is still reserved. No charge was made."
  - "Try Again" button hidden for reasons where retrying same details won't help (expired card, insufficient funds)
- `PaymentForm.tsx` updated:
  - New `PaymentFailureReason` exported type (`card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`, `processing_error`, `authentication_required`, `generic`)
  - `classifyStripeError(code)` — maps Stripe decline/error codes to `PaymentFailureReason`
  - New `onPaymentFailed?: (reason, stripeMessage?) => void` prop — fires on any Stripe error from card payment, express checkout, and 3DS flows
- `Register.tsx` updated:
  - `paymentFailure` state tracks `{ reason, stripeMessage }` when payment fails
  - Step 2 header and PaymentForm/recovery panel swap based on failure state

### Feature 3: Text-to-Speech Kai Responses (Stage 2B.1)
- New `src/hooks/useTtsOutput.ts` — Web Speech API SpeechSynthesis wrapper hook
  - `speak(text)` — cancels any current speech, strips markdown, speaks the text in the current language
  - `stop()` — cancels ongoing speech
  - `isSupported` — feature detection
  - `isSpeaking` — live speaking state
  - Language-aware: uses `LANGUAGE_LOCALE` to set `utterance.lang` so TTS engine uses the correct voice
  - Markdown stripping: removes `**bold**`, `*italic*`, `[links](url)`, inline code, headings for clean speech
- `ChatInterface.tsx` updated:
  - TTS hook integrated; speaker button added to the header (only shown when `isSupported`)
  - When TTS is enabled, each new assistant message is auto-spoken after it arrives (last spoken message tracked to prevent repeats)
  - Speaker button shows `VolumeX` while speaking (allows stop), `Volume2` otherwise
  - TTS disabled/stopped on language change to prevent language mismatch mid-sentence

**Files Changed:**
- `src/services/ai/languageService.ts` — **NEW** — Language service with EN/ES translations
- `src/hooks/useTtsOutput.ts` — **NEW** — Web Speech API TTS hook
- `src/components/registration/PaymentFailedRecovery.tsx` — **NEW** — Payment failure recovery panel
- `src/components/registration/ChatInterface.tsx` — language toggle, TTS toggle, all strings from languageService
- `src/components/registration/PaymentForm.tsx` — `PaymentFailureReason` type, `onPaymentFailed` prop, `classifyStripeError` helper
- `src/pages/Register.tsx` — `paymentFailure` state, PaymentFailedRecovery integration

**No new DB migrations** — all changes are frontend/UI layer.

---

## [March 18, 2026] - Voice Registration, Apple Pay / Google Pay & Biometric Settings UI | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes 3 Stage 2B/3 items: voice input for the Kai chat, express checkout via Apple Pay / Google Pay, and a settings UI to manage biometric login

**Description:**
Three features implemented across the registration experience. Voice Registration (Stage 2B.1) adds a Web Speech API microphone button to the Kai chat interface — users can speak their answers instead of typing. Apple Pay / Google Pay (Stage 3.1) shows a Payment Request Button above the card form when the browser supports it, enabling one-tap express checkout. Biometric Settings (Stage 3.1.1) adds a toggle panel on the RegistrationConfirmation page so users can enable or disable Face ID / Touch ID after completing a registration, completing the biometric management lifecycle.

### Feature 1: Voice Registration — Web Speech API (Stage 2B.1)
- New `useVoiceInput` hook — wraps the Web Speech API (SpeechRecognition / webkitSpeechRecognition)
- Handles webkit prefix automatically for cross-browser support (Chrome, Safari, Edge)
- `startListening()` opens the microphone; interim transcripts update live
- `stopListening()` finalises recognition and fires `onFinalTranscript(text)` callback
- On final transcript: auto-sends the text into the Kai conversation (no manual tap needed)
- Friendly error messages for each failure case: no-speech, not-allowed, network, etc.
- New `VoiceIndicator` overlay component: animated emerald pulse rings, live transcript preview, tap-to-stop mic button, cancel option
- `ChatInterface.tsx` updated: mic button added between text input and send button
  - Button only shown when `isSupported` (browser has Web Speech API)
  - Mic button turns red and pulses while listening; tapping it stops recognition
  - `VoiceIndicator` overlay covers the phone frame during recording
  - Voice disabled state respects `isLoading`, `!isReady`, and `sessionEnded` flags

### Feature 2: Apple Pay / Google Pay — Payment Request Button (Stage 3.1)
- `PaymentForm.tsx` updated: imports `PaymentRequestButtonElement` from `@stripe/react-stripe-js`
- `useEffect` creates a Stripe `paymentRequest` object when stripe + clientSecret are ready
- `canMakePayment()` check ensures button only renders on supported devices/browsers
- Express Checkout section appears above the card form with an "or pay with card" divider
- `paymentmethod` event handler confirms via `stripe.confirmCardPayment()` (handleActions: false)
- Handles 3DS required: completes ev with 'success', then re-confirms to handle the action
- On success: redirects to the standard confirmation URL (same as card payment flow)
- Button theme: dark, 48px height, type 'buy'
- Amount reflects final price after discounts (sibling, returning family, early bird)

### Feature 3: Biometric Settings UI (Stage 3.1.1)
- New `BiometricSettings` component — toggle switch panel for managing Face ID / Touch ID
- Shows current status (enabled / disabled) and allows toggling on/off via `useBiometricAuth`
- Enable path: calls `register(email, name)` to create a new WebAuthn credential
- Disable path: calls `clear()` to remove the stored credential ID from localStorage
- Toggle button is disabled if biometrics cannot be enabled (no email/name provided)
- `RegistrationConfirmation.tsx` updated: after user dismisses or completes `BiometricSetupPrompt`, `BiometricSettings` panel is shown — provides ongoing management UI

**Files Changed:**
- `src/hooks/useVoiceInput.ts` — **NEW** — Web Speech API voice input hook
- `src/components/registration/VoiceIndicator.tsx` — **NEW** — Voice recording overlay component
- `src/components/registration/ChatInterface.tsx` — mic button + VoiceIndicator integration
- `src/components/registration/BiometricSettings.tsx` — **NEW** — Biometric toggle settings panel
- `src/components/registration/RegistrationConfirmation.tsx` — BiometricSettings integrated after setup prompt
- `src/components/registration/PaymentForm.tsx` — Apple Pay / Google Pay Payment Request Button

**No new DB migrations** — all changes are frontend/UI layer.

---

## [March 17, 2026] - Stripe Payment Intent Function, Biometric Auth & Cart Recovery Emails | Core Feature | High

**Category:** Core Feature
**Impact:** High — Closes 3 critical Stage 3 gaps: real Stripe payment processing, Face ID/Touch ID for returning families, and automated cart recovery email triggering

**Description:**
Three Stage 3 features implemented. The `create-payment-intent` edge function completes the real Stripe payment path (was previously always falling back to demo mode). Biometric authentication (WebAuthn/Face ID/Touch ID) is introduced as a new hook, UI component, and integrated into the registration payment step for returning families and the confirmation screen for new users. The `trigger-cart-recovery` edge function enables automated 3-touch email sequences for abandoned carts routed through n8n.

### Feature 1: Stripe `create-payment-intent` Edge Function (Stage 3.1)
- New `create-payment-intent` edge function handles the full Stripe PaymentIntent creation flow for the anonymous registration path
- JWT verification deliberately disabled — flow uses registration token auth (anonymous user completing payment)
- Amount is always read from the database (`registrations.amount_cents`) — never trusted from the client
- Supports all 4 plan types: `full`, `divided`, `two_payment`, `subscription` — each charges the correct first-installment amount
- On success: updates `registrations.status` to `awaiting_payment` and stores `payment_intent_id`
- Returns `{ demo: true }` gracefully when `STRIPE_SECRET_KEY` is not set (backward-compatible with demo mode)
- Deployed to Kairo Supabase project (`tatunnfxwfsyoiqoaenb`), version 2, ACTIVE

### Feature 2: Biometric Authentication — Face ID / Touch ID (Stage 3.1.1)
- New `useBiometricAuth` hook — WebAuthn platform authenticator (Face ID, Touch ID, Android fingerprint)
- No biometric data is ever sent to or stored on the server — device-level security only
- `register()` — creates a WebAuthn credential and stores credential ID in localStorage
- `authenticate()` — presents native biometric prompt, returns `true`/`false` result
- `clear()` — removes stored credential (logout / user disables biometrics)
- Handles all DOMException error cases with user-friendly messages; auto-clears stale credentials on `InvalidStateError`
- New `BiometricAuthPrompt` component — shown on the payment step for returning families who have a credential stored
  - Gradient indigo card with Fingerprint icon, dismiss button, personalized email display
  - Integrates `BiometricSuccess` indicator when auth completes
- New `BiometricSetupPrompt` component (exported from same file) — opt-in prompt shown on RegistrationConfirmation for new users
  - Purple gradient card with "Enable Biometrics" + "Maybe later" buttons
- `PaymentForm.tsx` — integrated `BiometricAuthPrompt` for returning families; shows `BiometricSuccess` state after auth
- `RegistrationConfirmation.tsx` — integrated `BiometricSetupPrompt`; accepts new `parentEmail` and `parentName` props
- `Register.tsx` — passes `parentEmail` to `PaymentForm` and `parentEmail`/`parentName` to `RegistrationConfirmation`

### Feature 3: Cart Recovery Email Edge Function (Stage 3.4)
- New `trigger-cart-recovery` edge function handles the backend email trigger for abandoned carts
- Two modes: `sweep` (cron-style, finds all eligible carts) and `single` (target one cart by ID)
- 3-touch recovery sequence with timing windows based on NBC data (92.3% Mon-Fri registrations):
  - Touch 1: 30 min – 2 hours after abandonment
  - Touch 2: 20–28 hours after abandonment
  - Third touch: 68–76 hours after abandonment
  - No emails sent after 7 days
- Authentication: optional `X-Webhook-Key` header validated against `CART_RECOVERY_WEBHOOK_KEY` secret
- Triggers n8n via `cart_recovery_email` intent with: cartId, registrationToken, email, childName, programName, amountCents, stepAbandoned, recoveryAttempt, deepLinkUrl
- Increments `abandoned_carts.recovery_attempts` on successful n8n trigger
- `useCartAbandonment.ts` updated — when a cart is abandoned with an email present, immediately calls the edge function (single mode) so timing window tracking starts
- Deployed to Kairo Supabase project (`tatunnfxwfsyoiqoaenb`), version 1, ACTIVE

**Files Changed:**
- `supabase/functions/create-payment-intent/index.ts` — **NEW** — Stripe PaymentIntent edge function
- `supabase/functions/trigger-cart-recovery/index.ts` — **NEW** — Cart recovery email trigger edge function
- `src/hooks/useBiometricAuth.ts` — **NEW** — WebAuthn biometric auth hook
- `src/components/registration/BiometricAuthPrompt.tsx` — **NEW** — BiometricAuthPrompt + BiometricSetupPrompt + BiometricSuccess components
- `src/components/registration/PaymentForm.tsx` — integrated BiometricAuthPrompt for returning families, added `parentEmail` prop
- `src/components/registration/RegistrationConfirmation.tsx` — integrated BiometricSetupPrompt, added `parentEmail`/`parentName` props
- `src/pages/Register.tsx` — passes `parentEmail`/`parentName` to PaymentForm and RegistrationConfirmation
- `src/hooks/useCartAbandonment.ts` — triggers cart recovery edge function on abandonment when email is known

**Edge Functions Deployed:**
- `create-payment-intent` — version 2, ACTIVE, JWT disabled (anonymous flow)
- `trigger-cart-recovery` — version 1, ACTIVE, JWT disabled (webhook key auth)

**No new DB migrations** — all changes use existing schema.

---

## [March 16, 2026] - Payment Plan Types, Fee Transparency & Cart Recovery Deep Links | Core Feature | High

**Category:** Core Feature
**Impact:** High — Addresses 3 Stage 3 items (3.2, 3.4) bringing payment plans to full spec and closing the cart recovery loop

**Description:**
Three Stage 3 features implemented: the full payment plan model per the build spec (3 installment plan types replacing bi-weekly/monthly), fee transparency in the order summary, and a cart recovery deep link system that surfaces an actionable banner when users return after abandoning a registration.

### Feature 1: Proper 3 Payment Plan Types (Stage 3.2)
- Replaced generic "Monthly Payments" + "Bi-Weekly Payments" with the correct 3 plan types defined in the spec
- **Divided Payments**: N equal payments (default 3) spaced 2 weeks apart — schedule preview shown when selected
- **Two-Payment Split**: 50% due today, 50% at season midpoint with actual date label
- **Subscription Model**: Monthly recurring with 30-day cancellation notice, N months based on session length
- Each installment plan shows its full billing schedule when selected (expandable)
- `PlanType` union type (`'full' | 'divided' | 'subscription' | 'two_payment'`) replaces `'full' | 'monthly' | 'biweekly'`
- `PaymentFeeConfig` interface added for future org-configurable fees

### Feature 2: Payment Fees & Markup Transparency (Stage 3.2)
- `PaymentSummary.tsx` now renders registration fee and processing fee as separate line items (when configured via `PaymentFeeConfig`)
- Installment plans show per-payment schedule below the total — each payment date and amount listed
- `PaymentSummary` accepts `feeConfig` and `sessionStartDate` props and calls `calculatePaymentPlans` to derive actual due amounts
- Fee waiver for pay-in-full (configurable via `payInFullFeeWaived` flag)
- All amounts derived from single source of truth in `paymentPlans.ts` — no duplication

### Feature 3: Cart Recovery Deep Links (Stage 3.4)
- New `useCartRecovery` hook reads/writes cart state to localStorage with 24-hour TTL
- `saveCartRecovery()` / `clearCartRecovery()` / `readCartRecovery()` utilities exported for use anywhere
- `useCartAbandonment` hook now automatically syncs recovery data to localStorage on every cart change
- `markRecovered()` calls `clearCartRecovery()` so the banner disappears after completing registration
- New `CartRecoveryBanner` component: desktop top bar + mobile sticky bottom sheet
  - Shows child name, program name, amount, and which step was abandoned
  - "Continue" deep-links directly to `/register?token=<token>`
  - Dismiss button removes the localStorage entry
- `Home.tsx` updated to render `CartRecoveryBanner` when recovery data exists

**Files Changed:**
- `src/utils/paymentPlans.ts` — full rewrite with 3 plan types, `PaymentFeeConfig`, billing schedules
- `src/components/registration/PaymentPlanSelector.tsx` — updated for new `PlanType`, schedule preview, fee labels
- `src/components/registration/PaymentForm.tsx` — updated to `PlanType`, passes `sessionStartDate` + `feeConfig`
- `src/components/registration/PaymentSummary.tsx` — fee line items, installment schedule, `feeConfig` prop
- `src/pages/Register.tsx` — updated `PlanType` import, typed `setPaymentPlan` state
- `src/hooks/useCartAbandonment.ts` — localStorage sync via `saveCartRecovery`/`clearCartRecovery`
- `src/hooks/useCartRecovery.ts` — **NEW** — localStorage-based cart recovery hook + utilities
- `src/components/registration/CartRecoveryBanner.tsx` — **NEW** — dual-mode recovery banner component
- `src/pages/Home.tsx` — `useCartRecovery` integration + `CartRecoveryBanner` render

**No new DB migrations** — all changes are frontend/utility layer.

---

## [March 13, 2026] - Payment Psychology, Sibling Discounts & Re-enrollment | Core Feature | High

**Category:** Core Feature
**Impact:** High — Addresses 3 critical Stage 3 items (3.3, 3.5, 3.6)

**Description:**
Three Stage 3 features implemented to improve payment UX, sibling discount accuracy, and returning family experience.

### Feature 1: Payment Display Psychology (Stage 3.3)
- Added per-class cost display: "$26/class for 9 weeks" shown below total in Order Summary
- Updated "86% of families pay in full" text to styled "Most families pay in full" chip in PaymentPlanSelector
- `PaymentSummary.tsx` now accepts `sessionWeeks` prop and calculates per-class cost
- `PaymentForm.tsx` passes `sessionWeeks` to `PaymentSummary`

### Feature 2: Sibling Discount Auto-Detection Enhancement (Stage 3.5)
- Updated sibling discount from 10% → **25%** to match NBC Sports Engine benchmark ($50–60 savings on $200–250 programs)
- `Register.tsx` now performs debounced email lookup when parent enters their email
- If existing family found: pre-fills parent name and phone, shows "Welcome back!" banner with 5% returning family discount
- If family has active registrations: shows green "Sibling discount applied!" banner with 25% savings
- `hasOtherRegistrations` and `isReturningFamily` states properly passed to `PaymentForm` (were hardcoded `false`)
- Returning families reuse existing `family_id` instead of creating duplicate records

### Feature 3: Re-enrollment Flow (Stage 3.6)
- `RegistrationConfirmation.tsx` accepts new `onAddAnotherChild?: () => void` prop
- When `onAddAnotherChild` is provided, shows "Register another child? Save 25% with sibling discount" CTA card
- `Register.tsx` passes `onAddAnotherChild` handler routing back to home/chat
- Family record reuse in `createFamilyAndChild()` — returning families skip duplicate family creation
- `handleDemoPayment` also updated to reuse existing family ID

**Files Changed:**
- `src/components/registration/PaymentSummary.tsx` — per-class cost display, `sessionWeeks` prop
- `src/components/registration/PaymentPlanSelector.tsx` — "Most families pay in full" styled chip
- `src/components/registration/PaymentForm.tsx` — passes `sessionWeeks` to PaymentSummary
- `src/components/registration/RegistrationConfirmation.tsx` — `onAddAnotherChild` prop + sibling CTA
- `src/utils/discountCalculator.ts` — sibling discount 10% → 25%
- `src/pages/Register.tsx` — email lookup, returning family detection, pre-fill, banner UI, family reuse

**No new DB migrations** — all changes are frontend/utility layer.

---

## [March 2026] - Stage 3 Payments & Registration Flow - Active Development

**Category:** Core Feature
**Impact:** Critical Path to V1 Beta
**Status:** In Progress

**Changes in Progress:**
- Anonymous-to-registered user conversion flow architecture
- Stripe payment integration
- Three payment plan models (Divided, Subscription, Two-Payment Split)
- Cart abandonment detection and recovery emails
- Payment display psychology (pay-in-full primary, plans secondary)
- Sibling discount auto-detection and application
- Biometric authentication (Face ID, Touch ID)
- Re-enrollment automation with one-click return flow

---

## [January 2026] - Tiger Tank Feedback Integration

**Category:** Strategy / Requirements
**Impact:** High — Reshaped V1 beta scope and priority ordering

**Description:**
Session with 25-30 industry veterans from 15 organizations (avg pain score 8.5/10). Identified critical gaps required before beta. 83% would recommend KAIRO if conditions met.

**Key Changes to Roadmap:**
- Added Migration Toolkit as CRITICAL pre-beta requirement
- Added Reporting Engine (deal-breaker for 7/12 reviewers)
- Added Compliance Documentation (legal blocker for franchise)
- Added Multi-Language Support — Cantonese, Spanish identified from call data
- Added Incident Report System with 90-minute delay workflow
- Added Proactive Kai Chat Intervention for behavioral analytics
- Revised beta target to March 15, 2026 (5 pilot customers)
- Confirmed messaging: "Platform transition is painful — KAIRO makes switching risk-free"

---

## [January 9, 2026] - Stage 2 Complete: Kai Intelligence

**Category:** AI / Core Feature
**Impact:** Critical — Primary product differentiator shipped

**Description:**
Full AI-powered conversational registration via Kai. Achieved 99% accuracy target (14/14 tests passed across all categories).

**Changes:**
- N8N webhook integration as primary AI orchestration layer (`n8nWebhook.ts`)
- `useConversation.ts` hook updated to use N8N webhook
- Four AI Code Tools implemented: Search Sessions, Get Alternatives, Check Availability, Add to Waitlist
- Window Buffer Memory for context preservation across conversation turns
- Age validation (2–18 years)
- Conversation state machine with error handling and fallback to guided forms
- Database views: `available_sessions_view`, `session_recommendations_view`, `full_session_details_view`
- Database RPC functions: `get_matching_sessions()`, `get_alternative_sessions()`, `get_session_by_id()`, `add_to_waitlist_with_position()`, `check_session_availability()`
- Production configuration: Gemini Flash, temp 0.2, webhook `kai-conversation`

**Test Results:**
| Category | Tests | Passed |
|---|---|---|
| Basic Functionality | 3 | 3 |
| Complex Scenarios | 5 | 5 |
| Edge Cases | 2 | 2 |
| Registration Flow | 4 | 4 |
| **Total** | **14** | **14** |

---

## [January 2026] - Smart Recommendations & Waitlist Prevention

**Category:** AI / UX
**Impact:** High — Core differentiator vs legacy platforms

**Description:**
Intelligent session recommendation engine and waitlist prevention system designed to funnel customers to available classes before they fixate on full ones.

**Changes:**
- Age-based class filtering with schedule compatibility matching
- Real-time availability checking with spots-remaining urgency indicators
- Session quality scoring — up to 3 top recommendations shown
- Coach rating display in SessionCard UI
- Adjacent day suggestions (e.g., Wed full → Tue/Thu)
- Alternative time slots and locations
- Match scoring algorithm (90 for adjacent days, 85 for alt times, etc.)
- Waitlist as last resort (<20% target)
- `get_alternative_sessions()` database function

---

## [December 10, 2025] - Architecture Migration: N8N + Gemini

**Category:** Architecture
**Impact:** Critical — Replaced Edge Function architecture for better performance and maintainability

**Description:**
Migrated AI orchestration from Supabase Edge Functions to N8N workflow architecture. Improved accuracy from 80–90% to 99% target.

**Changes:**
- New architecture: Frontend → N8N Webhook → Gemini → Supabase
- N8N workflow `K45jpp5o2D1cqjLu` deployed at `healthrocket.app.n8n.cloud`
- `src/services/ai/n8nWebhook.ts` — new frontend service layer
- Database views and functions optimized for N8N queries
- Deprecated: `kai-conversation` Edge Function, `session-recommendations` Edge Function, `find-alternatives` Edge Function, `kaiAgent.ts` service
- `N8N_INTEGRATION.md` and `N8N_WORKFLOW_COMPLETE_SPECIFICATION.md` created

---

## [December 8, 2025] - NBC Sports Engine Data Analysis

**Category:** Research / Strategy
**Impact:** High — Data-driven defaults and UX decisions

**Description:**
Analysis of 661 registrations from Soccer Shots OC (NBC Sports Engine export) revealed critical patterns now informing Kairo's UX and business logic defaults.

**Key Insights Applied:**
- 74.8% of revenue from preschool partnerships → Added Stage 3.5 Preschool Partnership Module
- 86.4% pay in full → Pay-in-full as primary payment option with savings indicator
- 92.3% register Mon–Fri → Cart recovery emails targeted to evenings (6–8 PM)
- Age 3–5 = 65% of registrations → Age-based smart defaults for program suggestions
- Price sweet spot $200–$250 → Standardized around this range
- Sibling families = 8.1% → $50–60 sibling discount as standard

---

## [December 2, 2025] - Stage 1 Complete: Foundation

**Category:** Foundation
**Impact:** Critical — All core infrastructure shipped

**Description:**
Complete database schema, authentication, core UI components, and basic Kai chat interface. First working demo with Soccer Shots seed data.

**Changes:**
- 13-table Supabase PostgreSQL schema: organizations, locations, programs, sessions, staff, families, children, registrations, conversations, waitlist, payments, abandoned_carts, communications
- Row Level Security policies applied to all tables
- Multi-tenant architecture at organization level
- `src/lib/supabase.ts` — Supabase client
- `src/contexts/AuthContext.tsx` — Authentication management
- `src/types/` — Full TypeScript types for database, conversations, and registrations
- `src/components/common/` — Mobile-first reusable UI: Button, Input, Card, Modal
- `src/components/registration/ChatInterface.tsx` — Main Kai chat UI
- `src/components/registration/MessageBubble.tsx` — Message display
- Demo seed data: Soccer Shots Demo organization with real session data
