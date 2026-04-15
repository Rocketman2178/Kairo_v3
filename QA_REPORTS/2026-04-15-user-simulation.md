# Kairo v3 — User Simulation QA Report
**Date:** 2026-04-15  
**Tester:** Automated (Claude Code scheduled task `kairo-user-simulation`)  
**Branch:** main  
**Dev server:** http://localhost:5174 (port 5173 in use, Vite took next available)  
**Supabase project:** `tatunnfxwfsyoiqoaenb` (us-west-2)  
**Commit tested:** `cd13679` (2026-04-14 — admin token dashboard, expiration warnings & waitlist-impact transfers)

---

## ⚠️ Session Status: Chrome Unavailable — Static Code Review Substituted

The `mcp__Claude_in_Chrome__` extension was not reachable throughout this run (5 connection attempts over ~30 seconds). Chrome is likely closed or the extension was not signed in during this unattended scheduled execution. **All 6 browser simulation sessions could not be conducted.**

As a fallback, this report covers:
- Static code review of all changes introduced in the 2026-04-14 commit
- Cross-reference against bugs found in the 2026-04-14 user simulation report
- Edge function and data logic analysis

Browser-observable issues (visual layout, loading performance, network waterfall) are not reported this cycle.

---

## New Features Reviewed (2026-04-14 commit)

1. **Admin Makeup Token Dashboard** — `Reports.tsx` new `tokens` tab with `TokensReport`, `IssueTokenModal`, CSV export
2. **Token Expiration Warning Sweep** — `sweep-expiring-tokens` edge function + `warning_30d_sent_at` / `warning_7d_sent_at` columns
3. **Waitlist Impact on Transfers** — `approve-transfer` edge function, `approve_class_transfer` DB RPC, `TransferHistoryPanel` From→To audit trail, `TransfersReport` admin tab

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|----------|-------------|-------------|---------------------|----------|
| 1 | admin/data | `IssueTokenModal` notes update hits ALL active tokens for child, not just latest | Reports → Makeup Tokens → Issue Token modal → fill notes field | Fill all modal fields including Admin Notes, submit. Supabase `update().order().limit()` is unsupported in PostgREST — the `.order()` and `.limit()` modifiers are silently ignored on UPDATE queries, so every active token for that family+child receives the notes string. | **High** |
| 2 | navigation | Sessions.tsx search box resets to empty after every keystroke | Browse Classes (`/sessions`) → keyword search | Type any multi-character query (e.g. "soccer"). Each keystroke writes URL param `query` (via `setFilter('query', ...)`) but the read path uses `searchParams.get('q')` — different keys. React re-renders with empty string each time. BUG-03 from 2026-04-14 simulation — **still unresolved**. | **High** |
| 3 | ui | Reports tabs overflow on mobile — 5 tabs in non-wrapping flex container | Reports page (admin) on mobile/narrow viewport | Open Reports on a <640px screen. The tab row (`<div className="flex gap-1">`) holds 5 buttons ("Enrollment", "Revenue", "Schedule", "Makeup Tokens", "Transfers") totaling ~620px with padding and gaps. No `overflow-x-auto` or `flex-wrap`, so tabs overflow the container and clip out of view. | **Medium** |
| 4 | admin/ux | "Issue Token" button does nothing when `orgId` failed to load | Reports → Makeup Tokens tab → Issue Token button | Admin visits Reports when the `organizations` table query returns no data (network failure, empty DB, etc.). `orgId` state stays `null`. Clicking "Issue Token" calls `setShowIssueModal(true)`, but the modal only renders when `orgId` is truthy — so nothing happens. No error message, no disabled state on button. | **Low** |
| 5 | logic | `sweep-expiring-tokens` can send a 30d warning after a 7d warning for the same token | Edge function `sweep-expiring-tokens` | Token is issued with a short expiry (e.g. 6 days). Cron runs: 7d branch fires and stamps `warning_7d_sent_at`. Next cron run (next day, now 5 days out): `expires_at <= in7Days` is true, `!warning_7d_sent_at` is false → falls to `else if (!warning_30d_sent_at)` → sends a "30d warning" email. Parent receives a confusingly out-of-order "your token expires in 30 days" message when it actually expires in 5 days. | **Low** |

---

## Prior Bug Status Review

### Bugs from 2026-04-14 simulation

| Bug ID | Description | Status |
|--------|-------------|--------|
| BUG-01 | PaymentForm crashes entire app (missing `<Elements>` wrapper) | ✅ **FIXED** — `Register.tsx` now wraps `PaymentForm` in `<Elements stripe={getStripe()} options={{clientSecret}}>` when `clientSecret` is present and not in demo mode (line 1652). |
| BUG-02 | Kai loses conversation context, re-asks for child info | ❓ **Not verifiable** — requires browser + live n8n interaction. No code changes visible in this commit to the n8n workflow or context handling. Likely still present. |
| BUG-03 | Search box captures only last character (key mismatch `q` vs `query`) | ❌ **STILL PRESENT** — `Sessions.tsx:798` reads `searchParams.get('q')` while `setFilter('query', ...)` writes to param `query`. One-line fix: change `'q'` → `'query'` on line 798. |
| BUG-04 | Step 2 form clipped — Terms + Continue button unreachable | ✅ **FIXED** — `overflow-hidden` with fixed height removed from Step 1 container. Form now uses natural height (`p-6 space-y-6`). |
| BUG-05 | ~200px blank space at top of all pages | ❓ **Not verifiable without browser** — no obvious static evidence in `Home.tsx` or `CartRecoveryBanner.tsx`. May be fixed or context-dependent. |
| BUG-06 | Kai response language doesn't switch with UI language toggle | ❓ **Not verifiable** — no code changes to webhook or language plumbing in this commit. |
| BUG-07 | All `pending_registration` tokens expired in demo DB (24hr TTL) | ❓ **Ongoing demo/testing concern** — not a code bug, DB state issue. No expiry extension logic added. |

---

## New Code Quality Observations

### `IssueTokenModal` — notes update bug (Reports.tsx:984–991)
```typescript
await (supabase as any)
  .from('makeup_tokens')
  .update({ notes: form.notes.trim() })
  .eq('family_id', fam.id)
  .eq('child_id', children[0].id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })  // ← no-op on UPDATE
  .limit(1);                                   // ← no-op on UPDATE
```
**Issue:** Supabase PostgREST does not support `ORDER BY` or `LIMIT` on `UPDATE` statements. These modifiers are silently dropped. The result is that *all* active tokens for this family+child are updated with the same notes, not just the most recently issued one. The correct approach is to issue the `issue_makeup_token` RPC first, retrieve the newly created token's ID, then update notes by ID.

### Reports tabs — mobile overflow (Reports.tsx:1763)
```tsx
<div className="flex gap-1">   {/* ← missing overflow-x-auto or flex-wrap */}
  {tabs.map(t => (
    <button ...>{t.label}</button>   // 5 buttons, ~620px total
  ))}
</div>
```
Fix: add `overflow-x-auto` to this div and `flex-shrink-0` to each button.

### `sweep-expiring-tokens` — out-of-order warning logic
The `else if (!token.warning_30d_sent_at)` clause re-fires on tokens already past the 7-day threshold, potentially delivering a "30d warning" email that's factually wrong. Fix: gate the 30d warning with `token.expires_at > in7Days` to ensure it can't fire on tokens already within 7 days.

### `approve-transfer` — internal call missing Apikey header
```typescript
const notifyRes = await fetch(
  `${FUNCTIONS_BASE}/trigger-waitlist-spot-available`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },  // ← no Apikey/Authorization
    body: JSON.stringify({ waitlistId: firstWaitlisted.id }),
  }
);
```
Works because `trigger-waitlist-spot-available` uses `verify_jwt=false`. Not a bug, but including the anon key (`Apikey: supabaseAnonKey`) is better practice for internal edge-to-edge calls and matches how other functions call each other.

---

## Console Errors Observed

| Error | Source | Notes |
|-------|--------|-------|
| N/A | — | Browser testing not available this run |

---

## Failed Network Requests

| Request | Status | Notes |
|---------|--------|-------|
| N/A | — | Browser testing not available this run |

---

## Session Narratives

All 6 sessions blocked by Chrome extension unavailability. No browser interaction conducted.

---

## Overall User Experience

**Rating this cycle:** N/A (browser testing unavailable)

**Key takeaways from code review:**
- The two highest-value fixes from the prior simulation (BUG-01 PaymentForm crash, BUG-04 form clipping) are confirmed resolved — the registration flow to payment should now be completable.
- **BUG-03 (search key mismatch) is still present** — Browse Classes keyword search is completely broken. This is a one-line fix and should be prioritized.
- The new Token Dashboard and Transfers admin panel are well-structured. The `IssueTokenModal` notes bug is the only data-correctness issue in the new code.
- Transfer history From→To audit trail in the Parent Portal is a clean UX addition.

**Biggest friction point:** Broken keyword search on `/sessions` (BUG-03). For a parent looking to find a specific class, every keystroke erasing their input is an immediate bounce trigger.

**Most impressive new feature (code quality):** The `approve-transfer` edge function is a clean atomic operation — the `approve_class_transfer` RPC, waitlist promotion, and email trigger are all properly sequenced with graceful fallback if the notification step fails.

---

*Automated report — `kairo-user-simulation` scheduled task | 2026-04-15*  
*Next run: same schedule. To fix Chrome unavailability, ensure Chrome is open with the Claude in Chrome extension signed in before this task fires.*
