# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-16  
**Tester:** Automated (Claude Code scheduled task `kairo-user-simulation`)  
**Branch:** main  
**Dev server:** http://localhost:5173 (confirmed running, HTTP 200)  
**Supabase project:** `tatunnfxwfsyoiqoaenb` (us-west-2)  
**Commits tested:** `7565f45` (2026-04-15 — Fix 5 QA failures from simulation report) on top of `99bfd70` (2026-04-14 user sim report)

---

## ⚠️ Session Status: Chrome Unavailable — Static Code Review Substituted (Second Consecutive Day)

The `mcp__Claude_in_Chrome__` extension was not reachable throughout this run (3 connection attempts over ~15 seconds). Chrome is likely closed or the extension is not signed in during unattended scheduled execution. **All 6 browser simulation sessions could not be conducted.**

> **Note for user:** This is the second consecutive day the Chrome extension has been unavailable during the scheduled user simulation run. Consider verifying that Chrome is open with the extension signed in, or scheduling the user simulation task at a time when Chrome is reliably running.

As a fallback, this report covers:
- Verification of all 5 bugs fixed in the 2026-04-15 fix commit (`7565f45`)
- Static code review of all key pages (`Register.tsx`, `Sessions.tsx`, `ParentPortal.tsx`, `Reports.tsx`)
- Edge function analysis (`sweep-expiring-tokens`, `approve-transfer`)
- TypeScript compilation check

Browser-observable issues (visual layout, loading performance, animation glitches, Kai conversation flow) remain untested this cycle.

---

## New Code Reviewed (2026-04-15 Fix Commit `7565f45`)

All 5 fixes were applied to:
- `src/pages/Sessions.tsx` — search param key mismatch
- `src/pages/Reports.tsx` — IssueTokenModal notes bug; Issue Token button disabled state; tabs mobile overflow
- `supabase/functions/sweep-expiring-tokens/index.ts` — out-of-order 30d warning guard

---

## Prior Bug Status Review

### Bugs from 2026-04-14 and 2026-04-15 simulation

| Bug ID | Description | Status |
|--------|-------------|--------|
| BUG-01 | PaymentForm crashes entire app (missing `<Elements>` wrapper) | ✅ **FIXED** (2026-04-14 fix commit) — `Register.tsx:1650` wraps `PaymentForm` in `<Elements>` when `clientSecret` present |
| BUG-02 | Kai loses conversation context, re-asks for child info | ❓ **Not verifiable** — requires live browser + n8n. No code changes to webhook or context plumbing visible. Likely still present. |
| BUG-03 | Search box resets to blank on every keystroke (key mismatch `q` vs `query`) | ✅ **FIXED** — `Sessions.tsx:798` now reads `searchParams.get('query')`, matching `setFilter('query', ...)` write path |
| BUG-04 | Step 2 form clipped — Terms + Continue button unreachable | ✅ **FIXED** (2026-04-14 fix commit) |
| BUG-05 | ~200px blank space at top of all pages | ✅ **LIKELY RESOLVED** — `Home.tsx` renders `CartRecoveryBanner` only when `cartRecovery && recoveryUrl` is truthy; no hardcoded top padding; header is `sticky` not `fixed`. Static analysis finds no source for this gap in current code. |
| BUG-06 | Kai response language doesn't switch with UI language toggle | ❓ **Not verifiable** — no code changes to webhook or language plumbing visible. |
| BUG-07 | All `pending_registration` tokens expired in demo DB (24hr TTL) | ❓ **Ongoing demo/testing concern** — not a code bug |
| SIM-01 | `IssueTokenModal` notes update hits ALL active tokens for child | ✅ **FIXED** — now uses `rpcData.token_id` returned by `issue_makeup_token` RPC to update only the just-issued token by ID (`Reports.tsx:981-987`) |
| SIM-02 | Sessions.tsx search box resets | ✅ **FIXED** (same as BUG-03 above) |
| SIM-03 | Reports tabs overflow on mobile/narrow viewports | ✅ **FIXED** — `overflow-x-auto` on container + `flex-shrink-0` on each tab button (`Reports.tsx:1760`) |
| SIM-04 | "Issue Token" button silent no-op when `orgId` not loaded | ✅ **FIXED** — button now `disabled={!orgId}` with tooltip `title="Organization not loaded"` |
| SIM-05 | `sweep-expiring-tokens` sends 30d warning for tokens already within 7 days | ✅ **FIXED** — `else if (!token.warning_30d_sent_at && token.expires_at > in7Days)` guard in place |

---

## Code Analysis Findings

### TypeScript Compilation
```
npx tsc --noEmit → Exit: 0
```
No TypeScript errors. All new types, interfaces, and function signatures are clean.

### fix verification — `Sessions.tsx:798`
```diff
- query: searchParams.get('q') ?? '',
+ query: searchParams.get('query') ?? '',
```
Confirmed. `setFilter` writes to `'query'` param; read path now matches.

### fix verification — `Reports.tsx IssueTokenModal`
```typescript
const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('issue_makeup_token', {...});
// ...
if (form.notes.trim() && rpcData?.token_id) {
  await supabase.from('makeup_tokens').update({ notes: form.notes.trim() }).eq('id', rpcData.token_id);
}
```
Confirmed correct. `issue_makeup_token` DB function returns `json_build_object('success', true, 'token_id', v_token_id, ...)`, so `rpcData.token_id` is the UUID of the just-issued token.

### fix verification — `sweep-expiring-tokens` out-of-order guard
```typescript
if (token.expires_at <= in7Days && !token.warning_7d_sent_at) {
  warningsToSend.push("7d");
} else if (!token.warning_30d_sent_at && token.expires_at > in7Days) {
  warningsToSend.push("30d");
}
```
Confirmed. The `token.expires_at > in7Days` guard on the else-if branch prevents the 30d email firing when a token is already inside the 7-day window.

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|----------|-------------|-------------|---------------------|----------|
| 1 | admin/network | `approve-transfer` fetch call in `TransfersReport` missing `Authorization` header | Reports → Transfers tab → Approve button | Open Reports as admin, go to Transfers tab, click "Approve" on a pending transfer. The `fetch` call at `Reports.tsx:1548` only sends `Apikey` header but not `Authorization: Bearer ${anonKey}`. Works today because `verify_jwt=false`, but is inconsistent with all other 8 edge function calls in the codebase that send both headers. If Supabase changes edge function routing/rate-limiting to require `Authorization`, this will silently break. | **Low** |

---

## New Code Quality Observations

### `handleApprove` — missing `Authorization` header (Reports.tsx:1548-1551)
```typescript
const res = await fetch(`${supabaseUrl}/functions/v1/approve-transfer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Apikey': anonKey },
  // ↑ Missing: Authorization: `Bearer ${anonKey}`
  body: JSON.stringify({ transferId }),
});
```
Every other edge function call in the codebase (`send-payment-link`, `create-family`, `send-sms-verification`, `verify-phone-code`, `redeem-makeup-token`, `quick-checkout`) sends both `Authorization: Bearer ${anonKey}` and `Apikey: anonKey`. This one is the exception. Fix: add `Authorization: \`Bearer ${anonKey}\`` to the headers.

### `warningsToSend` array (sweep-expiring-tokens) — minor logic note
The current fix uses a `warningsToSend: ("30d" | "7d")[]` array, but since only 0 or 1 warning type can be added per token per run (due to the if/else-if structure), the array will always have at most 1 element. The `for ... of warningsToSend` loop is correct but slightly over-engineered for the current logic. Not a bug.

---

## Console Errors Observed

| Error | File/Location | Severity |
|-------|--------------|----------|
| (No browser session — cannot observe console errors this cycle) | — | — |

---

## Failed Network Requests

| Request | Status | Notes |
|---------|--------|-------|
| (No browser session — cannot observe network requests this cycle) | — | — |

---

## Kai Behavior Assessment

Not testable this cycle (no live browser session). Based on code review:
- `N8N_TIMEOUT_MS = 60000` confirmed in `src/services/ai/n8nWebhook.ts:37`
- "Welcome back" cart recovery message implemented at `ChatInterface.tsx:186` — fires when `messages.length > 1` on restore
- BUG-02 (context loss) and BUG-06 (language switch) remain unverifiable without live interaction

---

## Overall User Experience Assessment

**Not directly assessable this cycle** (no browser session). Based on static analysis:

| Dimension | Assessment |
|-----------|------------|
| Code quality | Good — TypeScript clean, no obvious logic errors in reviewed files |
| All 5 prior bugs | Correctly fixed and verified |
| New bugs introduced | 1 low-severity (missing Authorization header) |
| Registration flow | No regressions visible in `Register.tsx` — SMS verification, product upsells, payment, cart recovery all look structurally sound |
| Parent portal | `MakeupBookingModal`, `TransferRequestModal`, `TransferHistoryPanel` all look correct — null-safe, portal-rendered modals, proper error states |
| Admin features | Token dashboard and Transfers tab appear correct — fix for IssueTokenModal notes confirmed |
| Estimated UX rating | Unable to assess without browser (would require live session to rate) |

**Biggest concern:** BUG-02 (Kai context loss) and BUG-06 (language mismatch) remain unverified for a third cycle. These require a live browser session with n8n to assess. If Chrome extension remains unavailable, consider a manual test of these two flows.

---

## Recommendations

1. **Fix the missing `Authorization` header** in `Reports.tsx:1550` — trivial one-line fix.
2. **Investigate Chrome extension availability** — two consecutive user simulation runs have been unable to open Chrome. The most valuable parts of this task (Kai conversation testing, visual layout, mobile responsiveness) require a live browser.
3. **Verify BUG-02 and BUG-06 manually** — Kai context loss and language switch failure have been open for 3+ days without browser-observable confirmation of fix or persistence.
