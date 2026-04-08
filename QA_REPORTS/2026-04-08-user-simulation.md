# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-08
**Tester:** Automated simulation (kairo-user-simulation scheduled task)
**App URL:** http://localhost:5175
**Branch:** main
**Session count:** 6 personas

---

## Executive Summary

6 parent personas were simulated across a range of registration flows, Kai AI interactions, and feature-specific tests. The app is broadly functional for new registrations, but several critical and high-severity issues were found that block or degrade core workflows.

**Critical issues (2):** WaitlistJoinModal does not open on button click; n8n webhook timeout causes Kai chat fallback.
**High issues (3):** Cart recovery context not surfaced in UI; repeated HMR reloads at startup; dev server port conflict.
**Medium issues (4):** Scroll state causes CSS gradient rendering failure in screenshots; Register Now button context not persistent across navigation; no visible session filtering; empty error object logged on webhook failure.

---

## Session 1 — New Parent, First Registration (Maria Chen)

**Persona:** First-time parent, one child (age 8), looking to register for soccer.
**Goal:** Find a session, register child, complete checkout.

### Flow tested
- Homepage → Sessions page → Select session → Homepage with session context → Kai chat intro

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S1-1 | Medium | Dev Server | **Port conflict at startup** — Ports 5173 and 5174 were already in use; server auto-selected 5175. No user-visible impact but indicates stale processes from prior sessions. |
| S1-2 | Medium | `database.ts` / Vite HMR | **Repeated hot-module reloads at startup** — `database.ts` triggered multiple HMR page reloads at session start (observed in `/tmp/kairo-dev.log` at 9:21 AM). Causes visible flicker and delays initial render. |
| S1-3 | Low | Homepage | App loaded cleanly after HMR settled. Hero section, CTA buttons, and navigation all rendered correctly. |
| S1-4 | Low | Sessions page | Session cards displayed with name, sport, age range, price, and availability badge. UI is readable and scannable. |

**Overall:** Registration discovery flow works. HMR instability at startup is the only notable issue.

---

## Session 2 — Returning Parent, Kai Chat (David Kim)

**Persona:** Returning parent, two children, uses Kai for help finding the right session.
**Goal:** Ask Kai multi-turn questions to narrow down session choice.

### Flow tested
- Homepage → Kai chat → Multi-turn conversation → Session recommendation → Sessions page

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S2-1 | **Critical** | `src/services/ai/n8nWebhook.ts:87` | **n8n webhook timeout on multi-turn conversations** — `TimeoutError: signal timed out` thrown consistently after first Kai response when attempting follow-up messages. Network request to `https://n8n.rockethub.ai/webhook/kai-conversation` times out. Kai falls back to a static form rather than continuing the conversation. |
| S2-2 | High | `src/hooks/useConversation.ts:362` | **Empty object logged on webhook error** — Console shows `N8N Webhook error response: Object` with no stringified detail. Makes debugging the timeout root cause difficult. Should be `JSON.stringify(error)` or `error.message`. |
| S2-3 | Medium | Kai chat UI | **No visible retry or "try again" affordance** — When the webhook times out, the fallback form appears without explanation. Users have no indication the AI assistant failed or how to retry. |
| S2-4 | Low | Kai chat | First message sends and receives a response correctly. Single-turn Kai interactions work. |

**Overall:** Kai is broken for any parent who asks more than one question. Multi-turn is the expected use case for session discovery — this is a critical regression.

---

## Session 3 — Mobile Parent, Quick Registration (Priya Patel)

**Persona:** Mobile user (375px viewport), time-pressed, wants to register quickly without chat.
**Goal:** Find open session, click Register Now, complete registration form.

### Flow tested
- Sessions page (mobile viewport) → Register Now → Homepage with `?session=` param → Registration form

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S3-1 | Medium | Sessions page (mobile) | **No session filtering or search** — On mobile with many sessions visible, there is no way to filter by sport, age group, or availability. Parents must scroll through all cards to find relevant sessions. |
| S3-2 | Medium | `Sessions.tsx` → Homepage navigation | **Register Now context not persistent** — Clicking Register Now navigates to `/?session=[id]`. If the user navigates away from the homepage before Kai initializes, the session context (`kairo_conversation_id`, `kairo_temp_ids`) is stored in localStorage but never surfaced in the UI. A parent who browses to another page and returns sees no indication their cart is active. |
| S3-3 | Low | Sessions page (mobile) | Cards are readable at 375px. Price, sport, and availability badge all visible without horizontal scroll. |
| S3-4 | Low | Registration form | Form fields accept input correctly via React-controlled inputs. Validation messages appear as expected. |

**Overall:** Mobile layout is acceptable but filtering is missing. Cart recovery is silently broken for multi-page flows.

---

## Session 4 — Returning Parent, Cart Recovery (James Thompson)

**Persona:** Parent who started registration previously (has localStorage data), returning to complete.
**Goal:** App should restore prior session and surface it to the user.

### Flow tested
- Homepage with pre-seeded `kairo_conversation_id` and `kairo_temp_ids` in localStorage → Cart restore → Kai context

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S4-1 | High | `src/hooks/useConversation.ts` | **Cart recovery silent — no UI feedback** — Console confirms `"Restored conversation: [id] with N messages"` but there is zero UI indication of the restored state. No banner, no Kai greeting referencing prior session, no "Resume registration" CTA. Parents returning after abandoning a cart have no signal that their progress was saved. |
| S4-2 | Medium | Kai chat (post-restore) | **Webhook timeout still occurs on restored conversations** — Same `TimeoutError` as S2-1. The restore itself works internally but subsequent Kai turns still fail. |
| S4-3 | Low | localStorage keys | `kairo_conversation_id` and `kairo_temp_ids` are correctly persisted across page loads. The data layer is sound; the presentation layer is missing. |

**Overall:** Cart recovery is technically implemented but invisible to the user. A parent returning to complete a registration would not know their session was saved.

---

## Session 5 — Edge Case: Full Session (Lisa Rodriguez)

**Persona:** Parent trying to register for a session that is already full.
**Goal:** Encounter the "full" state and use the waitlist feature.

### Flow tested
- Sessions page → Identify full session → Click Waitlist button → WaitlistJoinModal → Submit email

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S5-1 | **Critical** | `src/pages/Sessions.tsx` | **WaitlistJoinModal does not open** — Clicking the Waitlist button on a full session card does not open the modal. Confirmed via: (a) `document.querySelectorAll('[role="dialog"]').length === 0`, (b) no `waitlist` text in `document.body.innerHTML` after click, (c) button click confirmed at exact coordinates via `getBoundingClientRect()`. No JS errors triggered. The button exists (14 found in DOM, tooltip "Join the waitlist and receive a confirmation email") but the click handler is not opening the modal. |
| S5-2 | Medium | Sessions page | **White screen after scroll** — After scrolling to find full sessions, the screenshot tool consistently captured a white screen. DOM content confirmed present via `elementFromPoint` and `get_page_text`. Root cause: Tailwind CSS gradient (`from-[#0f1419]`) is applied as `background-image`, not `background-color`. After scroll/interaction state changes, the gradient is not re-captured by the screenshot compositor. Hard reload restores correct rendering. This is a visual regression risk if users scroll on mobile — the gradient background may flash white briefly. |
| S5-3 | Low | Sessions page | Full sessions are correctly badged as "Full" with a distinct visual treatment. Waitlist button appears in place of Register Now. |

**Overall:** The entire waitlist feature is non-functional. Parents who find a full session have no recourse — the modal that would capture their email does not open.

---

## Session 6 — Feature-Specific: New Apr 7 Features (Alex Nguyen)

**Persona:** QA-focused parent testing the new April 7 features (WaitlistJoinModal, Portal Return URL, Proration Cap, Children Profiles Panel, Installment Start Date).
**Goal:** Verify each new feature is accessible and functional.

### Flow tested
- WaitlistJoinModal (Sessions page) → Portal Return URL behavior → Children Profiles Panel → Installment Start Date display

### Findings

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| S6-1 | **Critical** | `Sessions.tsx` — WaitlistJoinModal | **Confirmed: WaitlistJoinModal click handler broken** — Exhaustive re-test from Session 5. 14 Waitlist buttons present in DOM. Page scrollY was 1347px when button at viewport coords (1333, 496) was clicked. `hasWaitlistModal: false`, `dialogCount: 0` post-click. No errors. This is a blocker for the Apr 7 waitlist feature. |
| S6-2 | Low | Portal Return URL | Could not fully test — requires active Stripe portal session. Feature appears wired per DEV_UPDATES but functional testing requires live credentials. |
| S6-3 | Low | Children Profiles Panel | Panel renders in account settings area. Profile fields display correctly. Could not test add/edit flows without authenticated session. |
| S6-4 | Low | Installment Start Date | Date picker component present in registration flow. Not fully exercised without completing full checkout. |

**Overall:** The flagship Apr 7 feature (waitlist) is broken. Other features require auth context for full testing.

---

## Bug Summary

### Critical
| ID | Component | Title |
|----|-----------|-------|
| BUG-001 | `Sessions.tsx` | WaitlistJoinModal does not open when Waitlist button is clicked |
| BUG-002 | `n8nWebhook.ts:87` | Kai webhook TimeoutError on all multi-turn conversations |

### High
| ID | Component | Title |
|----|-----------|-------|
| BUG-003 | `useConversation.ts` | Cart recovery: restored session not surfaced in UI |
| BUG-004 | `database.ts` / Vite | Repeated HMR reloads at dev server startup |
| BUG-005 | Dev environment | Stale processes cause port 5173/5174 conflicts |

### Medium
| ID | Component | Title |
|----|-----------|-------|
| BUG-006 | `useConversation.ts:362` | Webhook error logs empty `Object` instead of error detail |
| BUG-007 | `Sessions.tsx` | CSS gradient (background-image) renders white after scroll in screenshot/compositor |
| BUG-008 | Sessions page | No session filtering by sport, age group, or availability |
| BUG-009 | Sessions → Homepage | Session context in localStorage not reflected in UI on return navigation |

### Low / UX
| ID | Component | Title |
|----|-----------|-------|
| BUG-010 | Kai chat | No retry affordance shown when webhook fails |
| BUG-011 | Sessions page | Full-session badge and Waitlist button UX is correct but non-functional |

---

## Recommended Fix Priority

1. **BUG-001 (WaitlistJoinModal)** — Click handler likely missing `e.stopPropagation()` or the modal state setter is not wired to the button. Check `Sessions.tsx` for the Waitlist button `onClick` prop.
2. **BUG-002 (Webhook timeout)** — Increase timeout in `n8nWebhook.ts` or add retry logic with exponential backoff. Also check n8n workflow execution time — may be hitting the worker's max execution limit.
3. **BUG-003 (Cart recovery UX)** — Add a "Welcome back" banner or Kai greeting when `useConversation` restores a prior session. Simple one-line UI change with high parent-perceived value.
4. **BUG-006 (Error logging)** — `JSON.stringify(error)` or `error?.message ?? String(error)` in the catch block. 5-minute fix.

---

## Environment Notes

- **App version:** Kairo v3, Stage 3 in progress per `KAIRO_BUILD_PLAN.md`
- **Dev server:** Vite on port 5175 (5173/5174 occupied)
- **Supabase project:** `tatunnfxwfsyoiqoaenb` (us-west-2)
- **Kai webhook:** `https://n8n.rockethub.ai/webhook/kai-conversation`
- **Test date/time:** 2026-04-08, starting ~9:21 AM
