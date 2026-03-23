# Kairo Development Updates

Changelog of all significant development milestones. New entries go at the **TOP**.
Format: `## [Month Year] - Title | Category | Description`

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
- N8N workflow `WN1T9cPLJjgg4urm` deployed at `healthrocket.app.n8n.cloud`
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
