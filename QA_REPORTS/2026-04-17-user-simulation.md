# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-17
**Tester:** Automated user simulation (Claude)
**Build:** `38ea11e` — recent commits include skill-level registration, sales demo backgrounds, token-on-cancel, transfer billing, 14-scene sales demo expansion
**Dev Server:** localhost:5174

---

## Session Narratives

### Session 1 — First Visit, Casual Browser

I landed on the homepage expecting to figure out what this site does. The page loaded a dark navy background with a phone-shaped chat widget in the center. The header shows "Kairo Pro" with four nav links: Test Scenarios, Browse Classes, Sales Demo, Platform Demo.

**First impression:** Not immediately obvious what action to take. "Registration Reimagined — Built for Busy Parents" in the top-right is helpful, but the nav still looks like a developer dashboard. "Test Scenarios" is visible even in dev mode and would confuse real parents.

I typed "Hi! What is this exactly? How do I sign my kid up for something?" — Kai responded naturally: "Happy to help! This is Kai, your youth sports registration assistant. I can help you find and sign up your child for various sports programs like soccer, basketball, swimming, and more!" Good response.

I then clicked "Browse Classes" — the Sessions page loaded cleanly with 112 classes, search, filters, enrollment progress bars, and "Register Now" buttons per class. Very professional.

Searched "soccer" → 68 results. Searched "soccer ages 6" → **0 results**. The search does literal text matching; it doesn't parse age ranges. A parent searching "soccer ages 6" gets nothing, which is alarming.

**Key issue discovered:** On initial page load, the text input box is **below the fold** (y=804px in a 720px viewport). A parent sees Kai's greeting but the input to reply is hidden below the scroll line. Verified via JS: `{ top: 804, viewportHeight: 720, visible: false }`.

---

### Session 2 — Parent Ready to Register (Sofia, age 6)

State cleared. I am Maria, trying to sign up my 6-year-old daughter Sofia for soccer.

Opened the app, scrolled to the input (had to scroll — confirmed the below-fold issue), typed: "Hi! I want to sign my daughter Sofia up for soccer. She's 6 years old. What do you have?"

Kai responded: "Great! Happy to help Sofia sign up for soccer. What days or times work best for her?" — skipped confirming what programs exist for a 6-year-old before asking about schedule. Slightly off-paced but not a dealbreaker.

I said weekends, Irvine CA. Kai searched and returned **5 programs** inline in the chat as tappable cards. One card showed **"TBD" as the location** — this would stop a real parent dead. The other cards showed real addresses (e.g., Beacon Park, 300 Benchmark, Irvine CA).

Clicked "Select" on a session → full-screen registration form appeared. Beautiful 4-step stepper: Session ✅ → Your Info → Payment → Done. **Sofia's name was pre-filled** from the chat — excellent UX.

Filled parent info fields. A **retention nudge appeared** in the bottom-right: "Still there? Don't lose your spot! Your selected class is being held. Continue registration to secure your place." — impressive engagement feature.

Attempted to advance. Validation error appeared: **"Please provide emergency contact information."** — shown in a red banner at the TOP of the page, but the emergency contact fields are BELOW the fold and not highlighted. A parent would see the error but not know where to scroll.

The flow reached `/register?token=...` — the Supabase-backed registration page — confirming end-to-end token creation is working.

---

### Session 3 — Parent with 3 Kids (ages 4, 7, 11)

State cleared. I'm a parent with Emma (4), Noah (7), and Liam (11), all wanting soccer.

Message: "I have 3 kids and want to sign them all up. Ages 4, 7, and 11. Can I register them all at once?"

Kai: "Great! Let's get your 3 kids signed up. What are their names? For the 4, 7, and 11 year olds, are they all interested in soccer, or different programs?" — perfect multi-child handling.

I gave all names and asked: **"Is there a sibling discount?"** — Kai completely ignored the discount question and moved on to scheduling. First ignore.

I pushed back: "You didn't answer about sibling discounts. Also, can each kid be in a different time slot?" — Kai responded: **"Got it! To help me find the best options for soccer, what is your child's name?"** — Kai **lost all context of Emma, Noah, and Liam** and reset to asking for a child's name as if starting over. Second ignore of discount question AND complete context loss.

This is the most critical bug found in the session. Multi-child flows break when the user asks a follow-up question outside the immediate next-step intent.

---

### Session 4 — Confused / Impatient User

State cleared. Testing resilience with weird and adversarial inputs.

- "uhhhh idk" → Kai: "No worries, I can help with that! To get started, what's your child's name?" ✅ Patient and redirecting.
- "how much does it cost??? I dont want to give you my info until I know the price" → Kai: "No problem, I can help with pricing! The cost can vary depending on the sport, program length, and location. To give you the most accurate pricing, could you tell me which sport your child is interested in?" ✅ Excellent — respected the concern and asked about sport, not personal info.
- "what is the capital of France" → Kai: "I can help with sports registration, but not general knowledge. What is your child's name and age?" ✅ Clean off-topic redirect.

Session 4 passed well. Kai is robust to adversarial single-turn inputs.

---

### Session 5 — Returning User / Cart Recovery

Did NOT clear state. Navigated away to /sessions and back to /.

Console log: `Restored conversation: [id] with 9 messages` — cart recovery fired correctly.

The conversation history re-appeared with all 9 messages from the prior session (Sessions 4 content). At the bottom of the restored conversation: **"Welcome back! I can see where we left off. Ready to continue, or would you like to start fresh?"** ✅ — the welcome-back message is working.

Minor note: the "Welcome back" message is at the very bottom of a long conversation and may be **below the visible area of the phone mockup** on load. A user might not see it unless they scroll down.

The Tyler (age 9, soccer, Irvine Saturday) search results were also preserved in the chat — 4 Premier Soccer sessions shown inline. Kai's session persistence across navigation works cleanly.

---

### Session 6 — Feature-Specific Testing

**Sales Demo (14-scene expansion, April 16):**

Navigated to `/sales-demo`. Loaded correctly. Scene counter shows **"Scene 1 of 13"** — commit message says 14 scenes; either 1 was cut or the counter is off-by-one.

Scene 1 "The Problem" — clean stats cards (40% cart abandonment, 8-12 min avg time, 25%+ revenue lost, <60s target). Excellent.

Scene 2 "First Contact" — **shows live chat data from the current browser session.** My test messages ("uhhhh idk", "how much does it cost???") appeared in the demo phone mockup. A salesperson walking through this with a prospect would show nonsense test messages instead of a polished demo flow. The Sales Demo needs to either isolate its conversation state or use a scripted replay.

Scene 5 "Voice Mode" — **session card again shows "TBD" location.** Gemini Live API talking points look great but the TBD location on the displayed card is distracting in a pitch setting.

Arrow key navigation and timer work correctly. Talking points sidebar is well-written.

---

## Console Errors Observed

| Level | Message | When |
|-------|---------|------|
| — | None | All sessions — zero JS errors observed |

---

## Failed Network Requests

| URL | Status | When |
|-----|--------|------|
| — | None | All sessions — zero failed API calls |

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|----------|-------------|-------------|-------------------|----------|
| 1 | ui | Input box below the fold on initial home page load | Home `/` | 1. Open app fresh 2. Do NOT scroll 3. Observe: Kai greeting visible but text input is hidden below viewport (confirmed y=804px in 720px viewport) | **Critical** |
| 2 | kai | Kai loses all multi-child context when user asks off-topic follow-up | Home `/` chat | 1. Say "I have 3 kids — Emma 4, Noah 7, Liam 11, all want soccer" 2. When Kai asks about schedule, instead ask "is there a sibling discount?" then follow up with another question 3. Kai resets to "what is your child's name?" forgetting all 3 kids | **Critical** |
| 3 | sales-demo | Sales Demo Scene 2 shows live session chat data instead of clean scripted demo | `/sales-demo` | 1. Chat with Kai using any messy messages 2. Navigate to `/sales-demo` 3. Scene 2 "First Contact" displays the real chat messages including nonsense inputs | **Critical** |
| 4 | kai | Sibling discount question ignored completely — Kai never acknowledges it | Home `/` chat | 1. In any conversation, ask "is there a sibling discount?" 2. Kai responds to other parts of the message but never addresses the discount question | **High** |
| 5 | ui | Validation error "Please provide emergency contact information" does not scroll to or highlight the relevant fields | Register `/register?token=...` Step 2 | 1. Fill parent name/email/phone only 2. Click Continue 3. Error banner appears at page top; emergency contact fields are below the fold with no highlighting or auto-scroll | **High** |
| 6 | data | Sessions with "TBD" location visible to parents in chat cards AND in Sales Demo Scene 5 | Home `/` chat (session cards) and `/sales-demo` Scene 5 | 1. Ask Kai for soccer in Irvine 2. View returned session cards — some show "TBD" as location 3. Also visible in Sales Demo Scene 5 | **High** |
| 7 | ui | "Welcome back!" cart recovery message appears at bottom of restored conversation, likely below the visible area of the phone mockup | Home `/` on return visit | 1. Have a multi-message conversation 2. Navigate to `/sessions` and back 3. "Welcome back" message exists in DOM at bottom of chat but phone mockup doesn't auto-scroll to show it | **Medium** |
| 8 | ui | Multi-word search with age descriptor returns 0 results | `/sessions` Browse Classes | 1. Search "soccer ages 6" → 0 results 2. Search "soccer" → 68 results. The search does literal full-phrase matching with no age-range intelligence | **Medium** |
| 9 | sales-demo | Sales Demo scene counter says "1 of 13" but commit describes 14 scenes | `/sales-demo` | Navigate to `/sales-demo` and observe "Scene 1 of 13" in header; DEV_UPDATES says "expand sales demo to 14 scenes" | **Low** |
| 10 | data | Test data session start dates are in 2027–2028 across all session cards | `/sessions` and chat session cards | Browse any session cards — start dates like "Jan 14, 2028", "Jan 18, 2027" visible to parents | **Low** |

---

## Overall User Experience

**Would a real parent complete registration?**
Probably not on the first visit without help. The critical blocker is the input box being below the fold — many parents would land on the page, read Kai's greeting, and have no idea they need to scroll to respond. This alone would cause significant drop-off. If they figure out scrolling, the conversation flow is genuinely impressive and natural.

**Biggest friction point:**
The input-below-fold issue (Issue #1). This is a showstopper for first-time visitors on standard laptop viewports.

**Most impressive feature:**
The multi-step registration flow transition from chat to form. The fact that Sofia's name carries over from the conversation into the form, combined with the clean stepper UI, is genuinely delightful. The retention nudge popup ("Still there? Don't lose your spot!") is also a standout — exactly what you'd expect from a premium product.

**Runner-up impressive feature:**
Kai's resilience on adversarial inputs (Session 4). The price-first objection handling was particularly good — Kai asked about sport rather than demanding personal info.

**Rating: 6.5/10**

The core AI conversation and registration flow is solid, but three critical bugs (input below fold, context loss, Sales Demo showing live data) need to be fixed before this is demo-ready for prospects. Fix those and the rating jumps to 8.5/10.
