# User Simulation QA Report — 2026-04-10

**Tester:** Automated User Simulation (Claude)
**Dev Server:** `http://localhost:5174` (port 5173 was in use)
**Branch:** main
**Recent commits tested:** `6834e48` (2026-04-10), `9a8f308`, `55c5aa5` (2026-04-09)
**Features under test:** Registration form DOB fix, Makeup Token Booking Flow, SMS Phone Verification, Perpetual Enrollment Type

---

## Session 1 — First Visit, Casual Browser

### Narrative
Landed on the homepage. The navigation shows "Test Scenarios," "Browse Classes," and "Platform Demo" — the first two feel developer-focused to a first-time parent visitor. "Browse Classes" is the most natural call-to-action but it's styled identically to the dev tools buttons. The right side shows "Registration Reimagined / Built for Busy Parents" which is good branding copy.

Below the nav is a phone mockup showing Kai's chat interface for "Soccer Stars / Youth Soccer Programs" — clean, immediately communicates the product concept. The opening message is inviting.

**Issue discovered:** When I pressed Tab to navigate and clicked the first button in the DOM, it triggered the language toggle (ES), switching the entire interface to Spanish. The tab/focus order appears to route through the `ES` button before visible action buttons, meaning a keyboard user or anyone who fat-fingers navigation could accidentally switch languages with no obvious way to reset (other than finding and pressing `ES` again, which now reads as the toggle to switch back).

**Positive:** Homepage communicates the product clearly. Phone mockup immediately shows what the product does.

---

## Session 2 — Parent Ready to Register Sofia (Age 6)

### Narrative
Clicked "Browse Classes" from the nav — navigated cleanly to `/sessions`. Page shows 112 classes with a search bar and Filters button. First two cards visible: Classic Soccer ($299, Ages 4-7) and Mini Basketball ($185, Ages 3-4). Session dates show "Starts Jan 14, 2028" and "Starts Jan 16, 2027" — these are test data dates 1-2 years in the future which would alarm a real parent.

Opened the Filters panel: Location, Sport/Program, Zip/Postal Code, Day of Week, Min/Max Age, and day-of-week chips. The filter panel is clean and comprehensive.

Tried filtering for "Min Age: 6 yrs" — filtered to 88 classes, showed a blue badge "Filters 1" and "Clear all" link. However the results include classes for Ages 7-10 which a 6-year-old cannot join. The Min Age filter appears to mean "show classes where min_age ≥ this value" rather than "show classes appropriate for a child this age." This is confusing label semantics.

Clicked "Register Now" on Classic Soccer — redirected to `/?session=<uuid>`. Initially Kai showed the Spanish greeting (language was still ES from session 1). After toggling EN, Kai correctly greeted with **"Hi! I see you're interested in Classic Soccer — great choice!"** — session context passed correctly from the Browse page.

Typed "Hi! I want to sign up my daughter Sofia, she's 6 years old. Is this class right for her?" — Kai responded perfectly: "Great! Sofia is the perfect age for soccer. It's a wonderful way for 6-year-olds to stay active and learn teamwork. To find the right fit, what days or times usually work best for your schedule?"

Typed "Sundays work great for us!" — Kai replied: "I found 3 great Sunday soccer options for Sofia!" and presented a rich class card with price/month breakdown, "Popular weekend slot" badge, coach name with star rating (4.9★), capacity bar, and spots count.

Clicked "Select" → redirected to `/register?token=<hex>`.

**Registration Step 1:** Showed "Confirm Session — Review the details for Sofia" with child name, schedule (Sundays 9:00 AM), location, program, price, date range, spots. Note: the class shown (Classic Soccer at Beacon Park, 9:00 AM) differs from what Kai just recommended (Junior Soccer at Oakwood, 9:45 AM) — the original session token from Browse Classes was preserved, not Kai's recommended class. This is a workflow disconnect.

Clicked Continue to **Step 2 (Your Info):** Clean stepper, pre-filled "Sofia" in child name field. Form has Parent/Guardian info, child DOB dropdowns, Emergency Contact (now split First/Last Name — good fix from yesterday), communication preferences with TCPA-compliant SMS copy, and Terms agreement.

Filled out all fields successfully. Clicked "Continue to Payment" → **blank white page / app crash.**

Console error: `PaymentForm` component throws an unhandled error at `PaymentForm.tsx:54` which unmounts the entire React tree. No error boundary catches it. The page shows completely blank — no error message, no back button, parent is completely stuck.

**This is a registration-ending, critical blocker. No parent can complete payment.**

---

## Session 3 — Multiple Kids (Not Fully Tested)

Could not complete — the Payment step crash in Session 2 blocks all multi-child testing as well. The issue would be the same for all registrations. Sibling discount/multi-child handling could not be evaluated.

---

## Session 4 — Confused/Impatient User

### Narrative
Observed that the chat interface messages display invisibly immediately after sending. Messages exist in the DOM but the chat scroll container renders them at `top: -244px` above the visible window. Scrolling the page to the top after sending makes them appear. This is not a programmatic scroll-to-bottom working correctly — it's a page scroll state issue.

Also confirmed: every console.log fires exactly 4 times (quadruple logging), suggesting a React strict mode or component remounting issue causing excessive re-renders. This likely has performance implications under load.

Language toggle accidentally switches to Spanish on first interaction — a confused user who tabs through or clicks rapidly could end up in the wrong language with no obvious path back.

The "Cancel" button at the top of the registration form is the first button in DOM order, so clicking it via automation or tab+enter exits registration unexpectedly.

---

## Session 5 — Returning User / Cart Recovery

### Narrative
Returned to `http://localhost:5174/` without clearing state. **The cart recovery banner worked perfectly:**

An amber banner appeared at the top: *"You left off entering your details for Sofia — Classic Soccer · $299 — Continue →"*

The Kai conversation was also restored with all prior messages. This is genuinely impressive behavior — a parent who walks away mid-registration and comes back will immediately see where they left off. The "New" button also appeared in the Kai header for resetting.

**This is the standout feature of the build. Best-in-class cart recovery.**

---

## Session 6 — Feature-Specific Testing (New Features from DEV_UPDATES)

### SMS Phone Verification
Could not reach the checkout step where SMS verification appears (Payment step crashes). Unable to test.

### Makeup Token Booking Flow
Requires a logged-in parent with existing tokens in the Parent Portal. Portal login requires a real registered email — could not test with available test data emails (`sarah.johnson@email.com`, `test@example.com` not found).

### Perpetual Enrollment Type
Sessions page (`/sessions`) shows no enrollment type banner — no org in the test data appears to have `enrollment_type` set to `perpetual` or `hybrid`. Could not test the violet banner UI.

### Parent Portal
Portal login page is clean — "Family Portal / View your registrations and account details" with email field and "View My Account" button. Error handling is excellent: shows attempt count ("2 attempts left", "1 attempt remaining before a temporary lockout").

---

## Console Errors Observed

| Error | Location | Severity |
|---|---|---|
| `PaymentForm` component crash — unhandled error, unmounts React tree | `PaymentForm.tsx:54`, render phase | Critical |
| All console logs firing 4× (quadruple) | Throughout app | Medium |

---

## Failed Network Requests

No HTTP 4xx/5xx network failures observed during testing.

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|---|---|---|---|---|
| 1 | **payment** | `PaymentForm` component crashes with unhandled error, rendering blank white page — no error boundary catches it | `/register?token=*` Step 3 (Payment) | Fill out steps 1 and 2 of registration, click "Continue to Payment" | **Critical** |
| 2 | **ui** | Chat messages appear invisible/off-screen until user scrolls page to top — new messages push scroll position below visible area | Home chat (`/`) | Send a message to Kai; messages are in DOM but at negative top offset | **High** |
| 3 | **ui** | Console logs fire 4× for every event — React component re-rendering 4 times per interaction | Throughout app | Open console, send any message to Kai | **Medium** |
| 4 | **navigation** | Language toggle (ES/EN button) is first in DOM tab order — easy to accidentally trigger, and language state persists even when navigating back to chat | Home page nav | Press Tab key on homepage; first focused element is the ES language button, not a nav link | **Medium** |
| 5 | **filter** | Min Age filter label is misleading — "Min Age: 6 yrs" shows classes for ages 7-10 that a 6-year-old can't join. Filter appears to show classes *with min_age ≥ N* rather than classes *appropriate for a child aged N* | `/sessions` filter panel | Open Filters, set Min Age to "6 yrs", observe classes with age range 7-10 in results | **Medium** |
| 6 | **kai** | When navigating from Browse Classes with session context, then switching language, Kai re-greets with context (good), but the original language switch initially showed generic greeting — creates confusing experience if parent toggles language during chat | Home chat after Register Now click | From /sessions, click Register Now; observe Spanish generic greeting; switch to EN; Kai shows contextualized greeting | **Low** |
| 7 | **registration** | Class shown in Step 1 confirmation is the original Browse Classes selection, not the class Kai recommended — if parent changed class via Kai conversation, the registration form still uses the original session token | `/register?token=*` Step 1 | Browse → select class → talk to Kai → Kai recommends different class → click Select on Kai's card → Step 1 shows original class | **Medium** |
| 8 | **ui** | Test data session start dates are 1-2 years in the future (Jan 2027, Jan 2028) — would confuse real parents and makes the platform look broken | `/sessions` class cards, `/register` Step 1 | Open /sessions, observe "Starts Jan 14, 2028" on class cards | **Low (test data)** |
| 9 | **navigation** | No error boundary in registration flow — PaymentForm crash leaves parent on a completely blank white page with no recovery path | `/register` step 3 | Proceed to payment step; entire app unmounts | **Critical** |

---

## Overall User Experience

### Would a real parent complete registration?
**No.** The registration flow breaks at the Payment step (Step 3) with a blank white crash. No parent can complete registration in the current build.

### Biggest friction point
The `PaymentForm` component crash is a complete registration blocker. Before that, the invisible chat messages (scroll issue) is disorienting — after sending a message the chat appears blank until the parent manually scrolls up.

### Most impressive feature
**Cart recovery.** The amber banner "You left off entering your details for Sofia — Classic Soccer · $299 — Continue →" is polished, contextual, and would genuinely prevent abandonment. This is better than most production-grade registration systems.

Close second: Kai's conversational intelligence — correctly extracting Sofia's name and age, presenting rich session cards with payment plan breakdowns, coach ratings, and capacity indicators. The conversation flow is natural and impressive.

### Rating: **4/10**
The bones of a world-class registration platform are visible. The Kai conversation, Browse Classes filtering, cart recovery, and registration form UX are all strong. However the Payment step crash is a complete blocker — no one can finish registration — dropping the rating significantly. Fix the PaymentForm crash and the invisible-messages scroll bug, and this becomes a 7-8/10 easily.

---

*Report generated by automated user simulation task on 2026-04-10*
