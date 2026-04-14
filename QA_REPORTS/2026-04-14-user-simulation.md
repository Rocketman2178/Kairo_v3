# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-14  
**Tester:** Automated (Claude Code scheduled task `kairo-user-simulation`)  
**Branch:** main  
**App URL:** http://localhost:5174 (Vite dev server)  
**Supabase project:** `tatunnfxwfsyoiqoaenb` (us-west-2)

---

## Executive Summary

Six simulated parent user sessions were conducted across the full Kairo v3 app. Two **critical** bugs were found that block core user paths: the payment step crashes the entire app (white screen), and Kai AI loses conversation context mid-flow. Four additional high/medium severity issues were found. Three features (cart recovery, language toggle, test scenarios, day filtering) performed well.

---

## Bug Report

### CRITICAL — P0

#### BUG-01: PaymentForm crashes entire app (white screen, no error boundary)
- **Affected path:** Registration flow → Step 3 (Payment)
- **Symptom:** Navigating from Step 2 → Step 3 produces a full white screen. The entire React tree unmounts. No error message shown to user.
- **Root cause:** `PaymentForm.tsx:77` calls `useStripe()` which requires a `<Elements>` provider ancestor. The `Register.tsx` page renders `<PaymentForm>` outside any `<Elements>` wrapper, causing an uncaught exception: `Error: Could not find Elements context; You need to wrap the part of your app that calls useStripe() in an <Elements> provider`
- **Impact:** 100% of users are blocked from completing registration. No Stripe payment can be processed.
- **Reproduction:** Start any registration flow → complete Step 1 (session) → complete Step 2 (your info, including Terms checkbox) → click Continue → white screen.
- **Fix:** Wrap the Step 3 render in `Register.tsx` with `<Elements stripe={stripePromise}>...</Elements>`. The `stripePromise` should already be initialized via `loadStripe(key)`.

#### BUG-02: Kai AI loses conversation context — re-asks for already-provided child info
- **Affected path:** Kai chat → any multi-turn registration conversation
- **Symptom:** After the user provides child name and age, Kai asks for them again in subsequent turns. `currentState` in the n8n context payload never advances beyond `collecting_preferences` regardless of how much info has been given.
- **Root cause:** The n8n workflow (`K45jpp5o2D1cqjLu`) receives the full `messages` array each turn but never extracts child name/age into structured `context` fields. The `currentState` field is never updated by the workflow — it remains `collecting_preferences` indefinitely. Because the frontend reads state from the webhook response's context, every turn starts from scratch.
- **Impact:** Every registration conversation requires the user to repeat themselves. Practical registration via Kai is not possible for multi-turn flows.
- **Fix:** In the n8n workflow, add logic to parse child name and age from recent messages and write them back into the response's `context.childName`, `context.childAge`, and advance `context.currentState` to `session_selection` once collected.

---

### HIGH — P1

#### BUG-03: Search box captures only last character typed
- **Affected path:** Browse Classes (`/sessions`) → search input
- **Symptom:** Typing "basketball" results in URL `?query=l` (only the final `l`). The input visually resets to blank after each keystroke. No search results filter.
- **Root cause:** Key mismatch between write and read paths:
  - `onChange` calls `setFilter('query', e.target.value)` → sets URL param `?query=...`
  - `filters.query` reads from `searchParams.get('q') ?? ''` → reads URL param `?q=...`
  - These are **different keys**. Each keystroke sets `?query=<single char>`, then re-render reads `q` (undefined → `''`), resetting the controlled input to blank. The next keystroke fires with only the new character.
- **File:** `src/pages/Sessions.tsx:798` (`searchParams.get('q')`) and `Sessions.tsx:807` (`setFilter` key `'query'`)
- **Fix (one-liner):** Change `searchParams.get('q')` to `searchParams.get('query')` on line 798. Or rename the filter key from `'query'` to `'q'` everywhere it appears.

#### BUG-04: Registration Step 2 form content clipped — Terms checkbox and Continue button unreachable
- **Affected path:** Registration flow → Step 2 (Your Info)
- **Symptom:** Content below "Youth Shirt Size" (medical notes field, Terms & Conditions checkbox, Continue button) is visually clipped and cannot be scrolled to or clicked. The form container has `overflow: hidden` with a fixed height, causing content to disappear below approximately 900px viewport height on standard desktop.
- **Root cause:** The form wrapper `div` in `src/pages/Register.tsx` has `overflow: hidden` combined with a hardcoded height (~1399px). On viewports shorter than the full form height the lower portion is inaccessible.
- **Impact:** Users on standard laptop screens cannot accept Terms or click Continue without JS intervention.
- **Workaround used during testing:** JavaScript `nativeInputValueSetter` trick to force React checkbox state programmatically.
- **Fix:** Remove `overflow: hidden` from the Step 2 container, or replace fixed height with `min-height` and allow the container to grow with content.

---

### MEDIUM — P2

#### BUG-05: Large blank space (~200px) at top of viewport on all pages
- **Affected path:** Home (`/`), Sessions (`/sessions`), Test Scenarios (`/test-scenarios`), Register (`/register`)
- **Symptom:** After dismissing the cart recovery banner, and on pages where no banner is present, there is a ~200px empty gap between the navigation bar and the page content. Confirmed on all tested routes.
- **Likely cause:** The layout reserves space for the cart recovery banner using a fixed-height placeholder even when no banner is shown, or the banner dismissal leaves a ghost element in the DOM.
- **Impact:** Poor visual quality; wastes prime viewport real estate on every page.

#### BUG-06: Kai response language does not switch when UI language toggled
- **Affected path:** Kai widget → EN/ES language toggle
- **Symptom:** Toggling EN → ES correctly localizes all UI chrome (input placeholder → "Escribe tu mensaje...", footer → "Desarrollado por Kairo", badge → "ES"). However, Kai's conversation responses remain in English.
- **Root cause:** The language preference likely isn't being passed to the n8n webhook, or the n8n workflow doesn't include a language instruction in its system prompt when `language != 'en'`.
- **Impact:** Spanish-speaking parents see a split-language experience (Spanish UI, English chatbot responses).

---

### LOW — P3

#### BUG-07: All pending_registration tokens expired (24hr TTL too short for demo/testing)
- **Affected path:** Registration form (`/register?token=...`)
- **Symptom:** During session setup, all existing `pending_registration` rows in the DB had `expires_at` in the past. The `get_pending_registration()` RPC enforces `expires_at > NOW()`, so every direct token URL returned "registration not found."
- **Impact:** Testing and demo flows require manual DB intervention to extend token expiry. Not a production bug (tokens are generated fresh per user), but creates friction in QA/demo environments.
- **Workaround:** `UPDATE registrations SET expires_at = NOW() + INTERVAL '2 hours' WHERE registration_token = '...'`

---

## Session Results

### Session 1 — New Parent, First Registration
**Persona:** First-time parent, no prior context  
**Path:** Home → Kai chat → "I want to sign up my 6-year-old for soccer"  
**Result:**
- ✅ Kai greeted correctly, asked for child name and age
- ✅ Responded to child info ("Sofia, 6") with session recommendations
- ❌ Kai asked for child name/age again on follow-up turn (BUG-02)
- ✅ Session selection card rendered correctly with program details
- ⚠️ Registration token was expired — required DB intervention to proceed

### Session 2 — Returning Parent
**Persona:** Parent who has registered before, knows what they want  
**Path:** Direct URL to `/register?token=...` → Steps 1–3  
**Result:**
- ✅ Step 1 (Confirm Session): child name, schedule, location, price all pre-populated correctly
- ✅ Alternative sessions cross-sell shown at bottom of Step 1
- ✅ Step 2 (Your Info): form renders with all fields; progress through parent contact fields
- ❌ Terms checkbox and Continue unreachable due to overflow:hidden clipping (BUG-04)
- ❌ White screen on advancing to Step 3 — PaymentForm crash (BUG-01)

### Session 3 — Multi-Child Registration
**Persona:** Parent registering two children  
**Path:** Kai chat → register child 1 (Sofia) → attempt child 2 (Marco)  
**Result:**
- ✅ Kai started conversation correctly
- ❌ After providing Sofia's details, Kai re-asked for name and age (BUG-02)
- ✅ localStorage `kairo_cart_recovery` was correctly written with Sofia's in-progress registration
- ✅ Conversation ID persisted in `kairo_conversation_id`

### Session 4 — Confused/Impatient User
**Persona:** Parent asking vague questions, switching topics  
**Path:** Kai chat with unclear/incomplete prompts  
**Result:**
- ✅ Kai handled "what do you have for kids?" gracefully — asked for clarifying age
- ✅ Kai did not error on partial/incomplete input
- ❌ Context still not carried between turns — re-asked for age after it was given (BUG-02)

### Session 5 — Cart Recovery Test
**Persona:** Returning user who abandoned registration mid-flow  
**Path:** Home page (with `kairo_cart_recovery` in localStorage from Session 3)  
**Result:**
- ✅ Cart recovery banner appeared correctly: "You left off entering your details for Sofia — Classic Soccer · $299"
- ✅ Banner copy adapts to step: "entering your details" vs "reviewing your session" depending on abandonment point
- ✅ "Continue →" button navigated to `/register?token=<token>` and restored Step 1 with full context
- ✅ Step 1 showed correct child (Sofia, 6 yrs), schedule (Sundays 9:00 AM), location (Beacon Park), price ($299)
- ✅ Dismiss (✕) button removed banner AND cleared `kairo_cart_recovery` from localStorage
- ✅ Banner does not reappear after dismiss

### Session 6 — Feature-Specific Testing
**Tested features and results:**

| Feature | Result | Notes |
|---|---|---|
| Browse Classes page load | ✅ Pass | 112 classes loaded, grouped by day |
| Search box | ❌ Fail | Only captures last char (BUG-03) |
| Day filter (Sun) | ✅ Pass | 112 → 18 classes; filter badge shows count |
| Filter "Clear all" link | ✅ Pass | Appears when filters active, resets URL params |
| "Register Now" from session list | ✅ Pass | Routes to `/?session=<id>`; Kai contextualizes session |
| Language toggle EN → ES | ✅ Partial | UI localizes; Kai still responds in English (BUG-06) |
| TTS button toggle | ✅ Pass | Speaker icon changes state on click |
| Test Scenarios page | ✅ Pass | 41 scenarios, 9 categories, live Supabase data |
| Scenario expand → copy prompts | ✅ Pass | Per-prompt copy + "Copy All Prompts" work |
| Scenario expected behavior | ✅ Pass | Shows correct session recommendations with spot count |
| Blank space at viewport top | ❌ Fail | ~200px gap on all pages (BUG-05) |

---

## Positive Findings

1. **Cart recovery is well-implemented** — banner UX, copy, continue flow, and dismiss-to-clear all work correctly. This is a strong conversion feature.
2. **Test Scenarios page is production-quality** — live data, structured prompts, expected behavior, copy-to-clipboard. Excellent internal QA tooling.
3. **Session list filters work** — day-of-week filter correctly narrows results; filter badge and clear-all work.
4. **Session `?session=` URL param context** — Kai correctly picks up a pre-selected session from the URL and starts the conversation with that context rather than the generic intro.
5. **TTS and language toggles have good UI affordances** — both provide clear visual state feedback.
6. **Alternative sessions cross-sell on Step 1** — "Registering for another time?" section shows other available slots, which is a good conversion opportunity.

---

## Recommended Fix Priority

| Priority | Bug | Effort |
|---|---|---|
| P0 | BUG-01: PaymentForm `<Elements>` wrapper missing | Low (1 file, wrap component) |
| P0 | BUG-02: Kai n8n context not persisted | Medium (n8n workflow update) |
| P1 | BUG-03: Search `query` vs `q` param mismatch | Low (1-line fix in Sessions.tsx) |
| P1 | BUG-04: Step 2 overflow:hidden clipping | Low (CSS fix in Register.tsx) |
| P2 | BUG-05: Blank space at viewport top | Low-Medium (layout investigation) |
| P2 | BUG-06: Kai language not switching | Medium (n8n webhook + language param) |
| P3 | BUG-07: Short token TTL for QA/demo | Low (seed script or env config) |

---

## Environment Notes
- Stripe: test mode key in use; actual payment processing not tested (blocked by BUG-01)
- SMS phone verification: not tested in this run (no real phone number available in simulation)
- Perpetual enrollment: not tested (no perpetual-type org sessions in current seed data)
- Makeup token booking: not tested
- Class transfer request flow: not tested
