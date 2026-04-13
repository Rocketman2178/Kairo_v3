# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-13
**Tester:** Automated user simulation (Claude)
**App URL:** http://localhost:5174
**Dev Server:** Vite v5.4.8 (port 5174, 5173 already in use)
**Recent Commits Tested:** fa98e39 through 192c270 (April 10 features: custom session fields, email gate lockout, waitlist spot-available email)

---

## Summary of Sessions

### Session 1 — First Visit, Casual Browser

**First impression:** Landing on the homepage, I see a dark-themed page with "Kairo Pro" in the header and a mobile phone mockup showing the Kai chat widget for "Soccer Stars — Youth Soccer Programs." The header nav shows three options: Test Scenarios, Browse Classes, Platform Demo. On the right: "Registration Reimagined / Built for Busy Parents."

As a parent who just heard about this from a friend, the first thing I notice is the chat widget. It's prominent and welcoming: "Hi there! I'm Kai, your registration assistant for Soccer Stars..." This is the right first impression.

However, the "Test Scenarios" link in the nav immediately catches my eye — and clicking it reveals a developer testing tool with 41 scenarios across 9 categories, live Supabase stats (14 Programs, 105 Active Sessions, 7 Full Sessions, 12 Locations). **Real parents should never see this page.**

**Browse Classes:** Clicking "Browse Classes" opens a clean list of 112 classes grouped by day. Cards show: class name, price, age range, description, day/time, location, start date, enrollment count, spots remaining, and a blue "Register" button. Very clear layout. The Filter panel (opened via "Filters" button) is comprehensive: Location, Sport/Program, Zip Code, Day of Week, Min/Max Age — all with dropdowns, plus quick-filter day-of-week buttons. 

**Issue noted:** All visible classes have far-future start dates (Jan 2027, Jan 2028) — this is test data but jarring to see as a real parent.

**Clicking Register Now:** Clicking Register on a class from Browse Classes navigated to `/?session=<id>`. However, the session loaded appeared to be for a **Spanish-language organization** — the entire UI switched to Spanish ("Completar Registro", "Solo algunos detalles más", "Nuestro asistente de chat no está disponible temporalmente..."). This is the first time in the session I saw a hint that I had accidentally registered for a different org than Soccer Stars. Very confusing.

**Kai is down:** The n8n webhook consistently returned `500 {"message":"Workflow execution failed"}` throughout the entire session. Kai chat is not functional. The fallback form showed in all attempts.

---

### Session 2 — Parent Ready to Register (Sofia, age 6)

After the Spanish fallback form appeared, clicking "Probar Chat" (Try Chat) retried the webhook. On this retry, Kai actually responded in English: "Hi! I see you're interested in Classic Soccer — great choice! What's your child's name and age so I can help you register?"

The language badge switched from "EN" to "ES" at this point (showing ES while the content is in English — confusing). The chat input placeholder changed to "Escribe tu mensaje..." (Spanish).

I typed "Her name is Sofia and she is 6 years old" — this went through but n8n immediately returned 500 again, triggering the fallback form in English ("Complete Registration / Just a few more details / Our chat assistant is temporarily unavailable.").

**Fallback form testing:** Filled out the form with: Sofia, age 6, Classic Soccer, Irvine, Saturday morning, Maria Garcia, maria.garcia@email.com, (555) 234-5678. Submitted — got a clean success state: **"Registration Received! We'll follow up with program details at maria.garcia@email.com."** The form fallback path works end-to-end.

**Issue:** After form submission success, the header still reads "Complete Registration / Just a few more details" and the "Try Chat" button is still visible. These should update to reflect the completed state.

---

### Session 3 — Parent with Multiple Kids (ages 4, 7, 11)

The Browse Classes page doesn't have any concept of multi-child registration — you register one child at a time, each with their own session/Kai conversation. There's no sibling flow visible in the public-facing UI. The Parent Portal Children tab does handle multiple children well (shows each with skill level and DOB), but getting three kids through the registration flow would require three separate chat sessions — each of which is currently broken (Kai is down).

**No sibling discount or multi-child flow found** in the UI. This may be in the Kai chat logic that couldn't be tested.

---

### Session 4 — Confused/Impatient User

Navigated back and forth using the browser back button mid-flow. The URL routing recovered cleanly — no crashes. Tried navigating to a session URL with `?session=` param and the app correctly loaded the Kai chat for that session with full conversation history.

Tried typing unclear messages — with Kai down, all attempts immediately fell back to the static form.

Tried using the back button from the Browse Classes page — returned cleanly to the main chat.

---

### Session 5 — Returning User (Cart Recovery Test)

Navigated to `/?session=1168df98-00c8-40d5-9c8f-d588ae3fb57a` (prior session from Session 2). The conversation was fully restored:
1. Kai: "Hi! I see you're interested in Classic Soccer..."
2. User: "Her name is Sofia and she is 6 years old"
3. Kai: "Let me show you a form to complete your registration."

The "Welcome back! I can see where we left off. Ready to continue, or would you like to start fresh?" message IS appearing — **but it's appended at the end of the restored conversation**, not at the top as a greeting. A returning parent would scroll to the bottom to find it.

**Bug:** After refreshing the page, the "Welcome back!" message appeared **a second time** at the bottom. Each page reload appends another copy of the welcome message. After 3 reloads there would be 3 welcome messages.

**Bug:** "Fallback form submission" text appears as a visible chat message in the conversation — this looks like an internal system label leaking into the chat UI.

---

### Session 6 — Feature-Specific Testing

**WaitlistJoinModal (April 7 fix):**
Clicked "Waitlist" on a full Junior Soccer session. The modal opened correctly: class details ("Junior Soccer, Sundays 10:00 AM, North Field Location, Class is currently full"), clear explanation ("You'll receive a Waitlist Confirmation email with your queue number"), child name (optional) and email (required) fields. Submitted with email only — got clean success: "You're on the waitlist! You're #5 in line. We'll email testparent@example.com when a spot opens. A confirmation email is on its way." ✅

**Class Transfer Request (April 8):**
From the Parent Portal, clicked "Request Class Transfer" on Junior Soccer. The TransferRequestModal opened with: current enrollment details, a long list of available transfer destinations with spots and billing adjustments (+$32.83, +$33.33, etc.). Selected High School Soccer + "Schedule conflict" reason → clicked Submit → got success: "Transfer Request Submitted. We'll review your request and reach out within 1-2 business days. A charge of $32.83 may apply." DB confirmed the transfer was saved. ✅

**Transfers History Tab:**
After submitting the transfer, navigated to the Transfers tab — showed "No transfer requests yet." DB confirmed the record exists. **The TransferHistoryPanel is not loading data.** ❌

**Email Gate Lockout (April 10):**
In the Family Portal, tried 3 incorrect emails:
1. Attempt 1: "No account found — 2 attempts left" ✅
2. Attempt 2: "1 attempt remaining before a temporary lockout" ✅
3. Attempt 3: "Access temporarily locked. Too many failed attempts. Try again in 14m 52s." with countdown timer and "start a new registration" link ✅
Feature works perfectly.

**Parent Portal General:**
- Logged in as lisa.chen@example.com (3 confirmed registrations)
- Stats: 3 Active, 3 Total, $378 Paid ✅
- Contact Information card with Edit button ✅
- All registration cards show "Enrolled Invalid Date" instead of actual enrollment date ❌
- Children tab: Shows Jackson Chen (Age 9, intermediate) and Olivia Chen (Age 7, beginner) with skill level badges ✅
- Tokens tab: Clean "No makeup tokens" empty state with explanation ✅
- "Ready to register again?" CTA with "Start registration" throughout the portal ✅

---

## Console Errors Observed

| Error | Frequency | Source |
|-------|-----------|--------|
| `N8N Webhook error: 500 {"message":"Workflow execution failed"}` | ~20+ times | `n8nWebhook.ts:74` |
| `N8N Webhook service error: Error: N8N Webhook failed: 500` | ~20+ times | `useConversation.ts:220` |
| `N8N_NETWORK_ERROR: I'm having trouble connecting right now` | ~16+ times | `ChatInterface.tsx:259` |

---

## Failed Network Requests

All webhook failures routed through n8n. No Supabase 4xx/5xx errors observed. No other failed network calls.

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|----------|-------------|-------------|-------------------|----------|
| 1 | kai | n8n workflow returning 500 — Kai chat is completely non-functional | All chat flows (main page, registration) | 1. Load app. 2. Type any message to Kai. 3. See "Our chat assistant is temporarily unavailable" fallback form. Check console: N8N Webhook error: 500 {"message":"Workflow execution failed"} | **Critical** |
| 2 | portal | "Enrolled Invalid Date" on all registration cards | Parent Portal → Current tab, every registration card | 1. Go to /portal. 2. Enter lisa.chen@example.com. 3. View any registration card — shows "Enrolled Invalid Date" instead of enrollment date | **High** |
| 3 | portal | Transfers history tab shows "No transfer requests yet" even after successful submission | Parent Portal → Transfers tab | 1. Submit a Class Transfer Request from any registration. 2. Receive success confirmation. 3. Click Transfers tab — shows empty state despite DB record existing | **High** |
| 4 | kai | "Welcome back!" cart recovery message duplicates on every page reload | Main chat page with prior session | 1. Start a chat session with > 1 message. 2. Navigate away and return to /?session=<id>. 3. Note "Welcome back!" at bottom. 4. Refresh page. 5. Second "Welcome back!" appends. Each refresh adds another | **High** |
| 5 | navigation | Clicking Register in Browse Classes can route to Spanish-language org without warning | Browse Classes → Register Now | 1. Go to /sessions. 2. Click Register Now on any class. 3. App may open a Spanish-language org's registration flow entirely in Spanish — "Completar Registro" | **Medium** |
| 6 | ui | Language badge shows "ES" while chat content is in English | Chat interface header | 1. Click Register Now from Browse Classes. 2. Click "Probar Chat" (retry). 3. Chat shows English but badge shows "ES" | **Medium** |
| 7 | kai | "Fallback form submission" text appears as visible chat message | Chat conversation history | 1. Start a chat session. 2. When Kai falls back to form, submit the form. 3. Return to same session — "Fallback form submission" appears as a chat bubble | **Medium** |
| 8 | navigation | "Test Scenarios" developer tool is visible in main nav for all users | Main homepage navigation | Load the app and click "Test Scenarios" — exposes 41 QA scenarios, live DB stats, test prompts | **Medium** |

---

## Overall User Experience

### Would a real parent complete registration?
**With Kai down:** Unlikely through the chat path. The fallback form works, so technically yes — but it requires 3 failed chat attempts before the form shows, and the form prompts are generic (no session pre-selection, no pricing shown). A confused parent would probably close the tab before reaching the form.

**With Kai working:** Promising — the flow is designed well, the class context is passed correctly ("I see you're interested in Classic Soccer"), and the UI is clean.

### Biggest friction point
**n8n workflow failure.** 100% of chat attempts failed during this test run. Every parent who tries to register hits the fallback form immediately. The fallback form is functional but loses all the magic of Kai.

### Most impressive features
1. **Email gate lockout** — Polished security UX with clear countdown and escalating warning messages.
2. **WaitlistJoinModal** — Position confirmation (#5 in line) is a great trust signal.
3. **Class Transfer Request** — Full flow with billing adjustment preview works end-to-end.
4. **Family Portal overall design** — Clean, light theme, great information hierarchy, "Ready to register again?" CTAs are well-placed.
5. **Browse Classes filters** — Comprehensive filter panel with location, program, zip, day, min/max age.

### Rating
**4/10** (with Kai working, estimated 8/10)

The visual design and feature breadth are genuinely impressive. But with Kai completely down, the primary registration flow is broken for 100% of parents today. The "Enrolled Invalid Date" and "Transfers tab not loading" bugs also erode trust for returning users who've already registered. Fix the n8n workflow and these portal bugs and this becomes a very solid product.

---

*Report generated by automated user simulation task — 2026-04-13*
