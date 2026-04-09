# User Simulation QA Report — 2026-04-09

**Tester:** Automated user simulation (Claude)
**App URL:** http://localhost:5174
**Server:** kairo-dev (Vite, port 5174)
**Supabase Project:** Kairo (`tatunnfxwfsyoiqoaenb`)
**Recent commits tested:** Voice Mode (April 8), class transfer, product upsells, payment CTA, WaitlistJoinModal portal fix, cart recovery welcome message

---

## Session Narratives

### Session 1 — First Visit, Casual Browser

Landed on the homepage. The chat interface launches immediately — "Hi there! I'm Kai, your registration assistant for Soccer Stars." Clear branding, helpful tagline ("Registration Reimagined / Built for Busy Parents"). The nav has "Browse Classes" and "Platform Demo" links which are obvious entry points.

Clicked **Browse Classes**. 112 classes load in a grouped list. The Filters panel is well-stocked (location, sport/program, zip code, day of week, min/max age — good). Tried typing "soccer" in the search box — the text did not visually appear in the field and the class list remained unfiltered at 112. **Finding: search input may not be accepting keyboard input** (could not confirm definitively in preview environment; needs manual browser verification).

Class cards display clearly: program name, ages, description, price, session count, schedule, location, enrollment/spots, Share + Register Now buttons.

**Enrollment count inconsistency**: Classic Soccer showed "Enrolled 0/12, 12 spots left" during the Sessions browse — but the same session showed "6/12 enrolled" a few minutes earlier (after coming from the Kai chat flow). Likely a stale React render or cache issue, not a data bug.

### Session 2 — Parent Ready to Register (Sofia, age 6)

Navigated from "Register Now" on the Browse Classes page → correctly redirected to `/?session=<id>` with a session ID in the URL.

**Finding: no class context acknowledgment**. The chat opens with the generic Kai greeting rather than "I see you're interested in Classic Soccer on Sundays at 9 AM." A parent who clicked "Register Now" on a specific class would expect to see that class reflected in the conversation immediately.

Sent: "Hi! I want to sign my 6-year-old daughter Sofia up for soccer. What do you have available?"

Kai responded: "Great! Let's find a soccer program for Sofia. To help me find the best fit, what days of the week or times of day work best for your schedule?" — **Natural, correctly extracted child name and age.**

Sent: "Weekends work best for us, preferably mornings"

Kai responded: "I found 5 great options for Sofia! Take a look and let me know which one works best." — Showed 5 session cards (Classic Soccer, Junior Soccer variants at weekend morning times). Filtering by day+time+age worked correctly. "Show alternatives" and "Change preferences" buttons present.

Clicked **Select** on Classic Soccer (Sundays 9 AM, Beacon Park, $299). Navigated to `/register?token=<id>`. Step 1 (Confirm Session) showed:
- "Review the details for Sofia" — child name pre-populated ✓
- Session details: Sundays 9:00 AM, Beacon Park, Classic Soccer, $299.00 ($33.22/class), Jan 15–Mar 16 2028, 9 classes, 12 spots remaining ✓
- Alternative class options shown at bottom ✓

Clicked **Continue**. Step 2 (Your Information): form loaded with Parent/Guardian fields, Child Details (Sofia pre-filled ✓), Emergency Contact, custom questions (Youth Shirt Size dropdown), communication preferences, and Terms checkbox. Good form structure.

Filled in all fields and clicked **Continue to Payment**.

**🔴 CRITICAL: React tree crashed. Blank white page.** Console error: `Failed to create family/child: [object Object]`. Network: `POST https://tatunnfxwfsyoiqoaenb.supabase.co/rest/v1/families?select=* → 401 Unauthorized`. Root cause: `families` table INSERT policy requires `{authenticated}` role, but the registration flow uses the anon key. The entire React app unmounts — user sees a completely blank white screen with no error message, no retry button, nothing. **This is a registration-blocking bug.**

### Session 3 — Parent with Multiple Kids

Not separately tested — same registration path as Session 2. Since the PaymentForm crashes before completing any registration, multi-child flow cannot be assessed. The chat-side multi-child conversation would work (Kai can handle multiple children in conversation), but the registration cannot be completed for any child.

### Session 4 — Confused/Impatient User

Tested the **"New" conversation button**. Clicking it resets the chat to the initial Kai greeting cleanly. No prior messages visible, "New" button disappears (correct — no history to show). Good behavior.

Cart recovery banners **persisted** after clicking "New" — the banners correctly stay until explicitly dismissed (the ✕ button on each), since the registration token is still valid.

Navigated back and forth between pages without issues. The back button works correctly. No unexpected crashes from navigation.

### Session 5 — Cart Recovery (Returning User)

After the PaymentForm crash, navigated back to `/`. 

**Cart recovery IS working** — two banners appeared immediately:
1. Small banner: "🛒 You left off entering your details for Sofia / Classic Soccer · $299 / Continue ✕"
2. Larger card: "🛒 Continue your registration for Sofia / Classic Soccer · $299 / Pick up where you left off → ✕"

**🟡 MEDIUM: Duplicate cart recovery banners.** Two separate recovery UI components are showing simultaneously. This is redundant and visually cluttered for a parent. One should be shown.

The full conversation history was restored (Sofia, soccer, weekend mornings, 5 recommendations) ✓

**Welcome-back message IS present** in the chat — the April 8 fix for "Welcome back! I can see where we left off" is working ✓

Clicking "Continue" on the recovery banner navigated back to `/register?token=...` Step 2 (Your Information) correctly.

### Session 6 — Feature-Specific Testing

#### Waitlist (WaitlistJoinModal — April 7 fix)

On the Sessions page, found a full Junior Soccer class (12/12 enrolled). Buttons shown: "Share", "Notify Me", "Waitlist". Clicked **Waitlist**.

WaitlistJoinModal opened via `createPortal` ✓ — the April 7 portal fix is working. Modal content:
- "Join Waitlist" heading
- Session info: Junior Soccer, Sundays 10:00 AM, North Field Location
- "Class is currently full" label
- Description with confirmation email promise
- Child's First Name (optional) + Email Address (required)
- "Join Waitlist" + "We'll notify you immediately when a spot opens — no spam."

Filled in name "Lucas" + email. Submitted. Success state: **"You're #4 in line. We'll email [address] when a spot opens. A confirmation email is on its way."** ✓ Queue position displayed correctly.

#### Voice Mode (April 8 — newest feature)

Clicked the "Voice conversation mode" button in the chat toolbar. **Voice Mode modal opened** with:
- "Talk to Kai — Find the perfect sports program with a quick voice conversation"
- Voice: Puck
- "Tap to start a voice conversation" + "Start Conversation" button

Clicked "Start Conversation" → received "Microphone access denied. Please allow microphone access in your browser settings. / Try Again" ✓ Graceful error handling for mic-denied state. The UI design is clean.

#### Parent Portal

Navigated to `/portal`. Email gate displays correctly. Tested with `jennifer.johnson@example.com` (has 4 confirmed registrations in DB). Family found and displayed (name, email, phone) ✓.

**🔴 CRITICAL: Portal shows 0 registrations for all families.** Tabs show "Current (0) History (0)" — no enrollments visible. DB confirms jennifer.johnson has 4 confirmed registrations. Root cause: `registrations` table RLS policies all require `{authenticated}` role (`auth.uid()` check). The portal uses the anon key (email-based gate, not Supabase Auth). The query returns empty results silently — no error is thrown, no message shown to the user.

Same result for `maria.martinez@email.com` (also 4 confirmed registrations in DB).

**Portal tabs present:** Contact Information, Current, History, Waitlist, Tokens, Children, Transfers — correct 6-tab structure ✓. Edit, Sign Out work. Contact info (name, email, phone) loads correctly via anon key (families table has `anon` SELECT policy for email lookup).

---

## Console Errors Observed

| Severity | Message | Context |
|----------|---------|---------|
| ERROR | `Failed to create family/child: [object Object]` | PaymentForm on Step 3 load |
| ERROR | React tree crash: `The above error occurred in the <PaymentForm> component` | After clicking Continue to Payment |
| NOTE | All console.log entries appear duplicated | Likely React Strict Mode double-invoke in dev — not a prod bug |

---

## Failed Network Requests

| Status | Method | URL | When |
|--------|--------|-----|------|
| 401 | POST | `https://tatunnfxwfsyoiqoaenb.supabase.co/rest/v1/families?select=*` | PaymentForm mount (Step 3) |
| (silent empty) | GET | `registrations` query via Supabase client | Parent Portal load — RLS returns 0 rows without error |

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|----------|-------------|-------------|-------------------|----------|
| 1 | payment | PaymentForm crashes entire React tree with blank page | `/register?token=...` Step 3 (Payment) | 1. Complete Kai chat → select session → fill Step 2 form → click "Continue to Payment". 2. PaymentForm mounts and attempts `POST /rest/v1/families` with anon key. 3. Supabase returns 401 (families INSERT requires `{authenticated}`). 4. Unhandled error crashes React. User sees blank white page. | Critical |
| 2 | portal | Parent Portal shows 0 registrations for all families | `/portal` → any family email | 1. Navigate to `/portal`. 2. Enter any family email with confirmed registrations. 3. Family found, portal loads. 4. Current and History tabs show 0 registrations. Root cause: `registrations` RLS requires `authenticated` role; portal uses anon key. | Critical |
| 3 | ui | Two cart recovery banners shown simultaneously | `/` (home) after incomplete registration | 1. Start a registration via Kai chat. 2. Navigate away before completing (or crash). 3. Return to home page. 4. Both a small toast banner AND a larger persistent card appear with the same "left off" message. | Medium |
| 4 | ui | "Register Now" from Browse Classes opens Kai with generic greeting, no class context | `/sessions` → click "Register Now" | 1. Browse Classes → click "Register Now" on a specific class. 2. Navigates to `/?session=<id>`. 3. Kai shows generic greeting instead of acknowledging the specific class. Parent must re-state their intent. | Low |
| 5 | ui | Enrollment count shows stale data on Browse Classes page | `/sessions` | 1. Use Kai to select a session (creates pending registration). 2. Navigate to Browse Classes. 3. Classic Soccer shows "Enrolled 0/12" even though prior view showed 6/12. | Low |

---

## Overall User Experience

### Would a real parent complete registration?
**No.** The registration flow crashes with a blank white page at the payment step. There is no error message, no way to retry, no navigation — the app is completely unusable at that point. This is a regression that blocks 100% of registrations.

### Biggest friction point
The `PaymentForm` 401 crash is an absolute blocker. Before that, the flow is excellent — Kai is conversational, friendly, and accurate. The session recommendations are well-matched. The form pre-fills the child's name. The step progress is clear. Everything up to clicking "Continue to Payment" on Step 2 works well.

### Most impressive features
1. **Kai's context extraction** — correctly parsed "6-year-old daughter Sofia", "weekends", "mornings" from a single natural message and returned perfectly-matched sessions.
2. **WaitlistJoinModal queue position** — telling a parent they're "#4 in line" is excellent UX.
3. **Cart recovery** — session and full conversation restored on return. The "Welcome back" message is a nice touch.
4. **Voice Mode UI** — clean modal design, graceful mic-denied handling.

### Rating: 4/10

The pre-payment experience (Kai chat → session selection → info form) is genuinely impressive — probably a 9/10 on its own. But the registration flow crashes before completing and the parent portal is non-functional. Two critical infrastructure bugs (both RLS/auth) make the app unusable for its core purpose today.

### Root cause summary
Both critical bugs share the same root cause: **Supabase RLS policies require `{authenticated}` role but the app uses the anon key** throughout the registration and portal flows. The `families` table has anon SELECT (email lookup) but requires auth for INSERT. The `registrations` table requires auth for all operations. The portal needs either an anon SELECT policy on registrations filtered by family email, or the registration flow needs to move family/child creation to an edge function with the service role key.
