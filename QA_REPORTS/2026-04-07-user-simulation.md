# Kairo User Simulation Report — 2026-04-07

## Session 1: First Visit, Casual Browser

**First impression:** App loaded instantly with a dark-background shell and a phone-framed chat widget centered on screen. "Soccer Stars / Youth Soccer Programs" branding is clear. Kai's greeting is friendly and inviting. "Registration Reimagined — Built for Busy Parents" tagline is visible. Not immediately obvious this is *only* for soccer — could mention "youth sports" more broadly on the landing page.

**Navigation flow:** Clicked "Browse Classes" → sessions page with 112 classes in a grid. Clicked Filters → clean filter panel with location, program, zip, day, min/max age. Filtered to age 6 → 42 results, badge on Filters button updated. Clicked "Register Now" on Classic Soccer → redirected to `/?session=<uuid>` but Kai showed the generic greeting with no mention of the selected class.

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| Zip code duplicated in location text | Medium | All class cards show zip twice: "Orange, CA 92866 92866" — both city zip and a trailing raw zip value concatenated |
| Class start dates missing year | Low | Cards show "Starts Jan 18" with no year — ambiguous for users comparing sessions across years |
| `?session=` URL param ignored by Kai | High | Clicking "Register Now" pre-loads a session ID in the URL but Kai ignores it and shows a generic greeting instead of "I see you want to register for [class], let's get started!" |

**What worked well:** Filter UI is polished — badge count on button, "Clear all" link, age dropdowns with half-year increments. Full/Waitlist/Notify Me states show correctly on class cards. Share button present.

---

## Session 2: Parent Ready to Register (Sofia, age 6)

**Narrative:** Typed "Hi I just saw a class for my daughter, she's 6. Can I register her?" — Kai responded asking for her name and schedule preference with day-of-week chips. Clicked "Any day works" → Kai's follow-up message began as a long wall of unformatted text listing classes by weekday sections before eventually switching to interactive class cards with Select buttons. Selected Junior Soccer at RSM Community Center (Saturdays 9:00 AM, $224, Coach Mike 4.9★). Kai replied "I've signed up Sofia for Junior Soccer! Would you like to sign up another child?" Clicked "No, that's all" → Kai said "Thanks for registering Sofia! Have a great day!"

**Critical finding:** The entire registration completed inside the chat with ZERO payment collected, ZERO parent contact info gathered, and NO redirect to a payment form. Either the chat is creating an unpaid pending registration silently, or it's telling the user they're registered when nothing was saved. A real parent would expect to have paid before receiving a confirmation message.

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| Registration completes in chat with no payment | Critical | After selecting a class, Kai says "I've signed up [child]!" and "Thanks for registering!" — no payment step, no email/phone collected, no redirect to `/register` payment page |
| Class cards show unformatted text first | Medium | Kai's first response is a large wall of plain text listing classes by day sections before finally rendering as cards — the text should not appear or should be suppressed |
| Quick reply chips repeat after use | Medium | After user selects "Any day works," Kai's next response again shows "Saturdays / Weekdays / Any day works" chips — redundant given context |
| Class card date missing year | Low | "Starts Jan 18" without year (should be "Starts Jan 18, 2027") |

**What worked well:** Class cards with Select buttons are clean and informative. Coach rating, enrollment bar, and spots-left badge all present. "Most popular day" badge on cards is a nice touch.

---

## Session 3: Multiple Kids (ages 4, 7, 11)

**Narrative:** Asked "Hi I have 3 kids — ages 4, 7, and 11. Can I sign them all up for something?" Kai correctly acknowledged all three kids and offered to register them one at a time starting with the 4-year-old. Asked about sibling discounts and provided name Marco for the 4-year-old.

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| Kai hallucination: sibling discount | High | Kai stated "Yes, we do! We offer a 10% sibling discount for each additional child…it will be automatically applied at the end of the checkout process." No such feature exists in the codebase. This is a false promise to real parents. |
| Quick reply chips contextually wrong | Medium | After Kai asks "What is your 4-year-old's name?", chips shown are "Register my child / What programs do you offer? / Pricing info" — none are relevant to the open question |

**What worked well:** Kai correctly decomposed a multi-child request into a sequential per-child flow. Response was natural and appropriately enthusiastic.

---

## Session 4: Confused/Impatient User

**Narrative:** Started with "what is this even" → Kai gave a reasonable explanation of what Soccer Stars is and what it can do. Then typed "ok sign up my son he is 7 and likes soccer i think" mid-sentence, navigated away to Browse Classes and hit back → conversation fully persisted. Kai had responded while away.

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| Kai grammar bug: "he" vs "him" | High | Kai responded: "Great, I have he, age 7. What days of the week work best for he?" — should be "him" both times. Sounds broken/robotic. |
| Markdown asterisk rendered literally | Medium | In Kai's self-description: "* Handle the entire registration process right here in our chat." — the asterisk `*` appears as a literal character instead of a bullet point. Markdown is not being rendered in Kai's chat bubbles. |
| "New" button causes white flash | Low | Clicking the "New" button causes a momentary fully blank white page before the fresh chat loads — jarring UX, feels like a crash. |

**What worked well:** Kai gracefully handled a vague/confused first message. Conversation state persisted correctly across navigation away and back.

---

## Session 5: Returning User (Cart Recovery Test)

**Narrative:** Did NOT clear state. Navigated to /sessions, then back to /. Conversation was fully intact — all messages, Kai's last response, scroll position maintained.

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| No proactive re-engagement on return | Low | When a user returns to an in-progress conversation, Kai does not acknowledge the return ("Welcome back! You were in the middle of registering — want to continue?"). Conversation just resumes silently. |

**What worked well:** Full conversation persistence across page navigation and page refresh via localStorage. This is solid — a returning parent won't lose progress.

---

## Session 6: New Feature Testing

### Children Profiles Panel (Parent Portal)

**Tested with:** `sandra.roberts@email.com` (has 3 seeded children: Connor, Emma, Baby Roberts)

**Narrative:** Logged into the Family Portal at `/portal` — clean login with just email. Accessed the Children tab (second row of the new 2-row tab layout). Saw "No children on file" despite Sandra having 3 seeded children. Clicked "Add another child," filled out form (Emma Roberts, DOB 03/15/2020, Beginner), clicked "Add Child" → red error: "Could not add child. Please try again."

**Issues found:**
| Issue | Severity | Description |
|---|---|---|
| Children tab fails to load existing children | Critical | Sandra Roberts has 3 children in the database but the Children tab shows "No children on file" — the SELECT query returns empty/fails silently |
| Add Child fails with 401 Unauthorized | Critical | POST to `/rest/v1/children` returns 401. The portal uses email-based (unauthenticated) family lookup, but the `children` table RLS requires auth. Neither reads nor writes work. |
| "Add another child" text when no children | Low | Button says "Add another child" even when zero children exist — should say "Add a child" for first-time use |

**What worked well:** The form UI itself is well-designed — inline expand, required/optional field labeling, date picker, cancel button. The tab bar layout with 2 rows works visually.

### Other new features (Installment Start Date, Proration)

Could not test these features as the full registration flow (Kai → /register payment page) did not trigger a payment form redirect during testing. The mid-season proration banner and installment start date notice in the payment form were not reachable through normal user flow.

---

## Console Errors Observed

| Error | Page/Action | Frequency |
|---|---|---|
| 401 Unauthorized on POST `/rest/v1/children` | Parent Portal → Add Child | Every attempt |
| 401 Unauthorized on GET children (inferred from empty results) | Parent Portal → Children tab load | Every load |

*Note: Console tracking was initialized mid-session; errors from page load were not captured. Network requests confirmed the 401s.*

---

## Failed Network Requests

| URL | Status | Page/Action |
|---|---|---|
| `https://tatunnfxwfsyoiqoaenb.supabase.co/rest/v1/children?select=id,first_name...` | 401 | Parent Portal → Add Child click |

---

## Failures to Pass to Fixer Task

| # | Category | Description | Where in App | Reproduction Steps | Severity |
|---|---|---|---|---|---|
| 1 | kai/registration | Chat says "I've signed up [child]!" and "Thanks for registering!" but NO payment is collected and NO redirect to `/register` occurs. User believes they are registered without paying. | Home `/` → Kai chat → select a class → click Select | Start chat, give child age + name, select "Any day works", wait for class cards, click Select on any class, then click "No, that's all" | Critical |
| 2 | portal/children | Children Profiles Panel — both GET and POST to `children` table return 401. Existing seeded children don't appear; adding new children always fails. Root cause: portal uses unauthenticated family lookup but `children` table RLS requires auth token. | `/portal` → Children tab | Log in as `sandra.roberts@email.com`, click Children tab (shows empty), click "Add another child", fill form, click "Add Child" | Critical |
| 3 | kai | Kai hallucinates a "10% sibling discount automatically applied at checkout" — this feature does not exist. | Home `/` → Kai chat | Say "I have 3 kids, ages 4, 7, and 11. Do you have any sibling discounts?" | High |
| 4 | kai | Kai uses wrong pronoun: "I have he, age 7. What days work best for he?" — should be "him" | Home `/` → Kai chat | Say "sign up my son he is 7 and likes soccer" | High |
| 5 | sessions | `?session=<uuid>` URL param from "Register Now" on Browse Classes is silently ignored. Kai shows generic greeting, losing context of which class the parent clicked. | `/sessions` → click "Register Now" | Browse Classes, click Register Now on any class, observe Kai shows no awareness of selected class | High |
| 6 | sessions | Zip code appears twice in location text on all class cards: "Orange, CA 92866 92866" | `/sessions` | Open Browse Classes, inspect any location line | Medium |
| 7 | kai | Unrendered markdown: Kai's capability list renders `* Handle the entire registration process…` with a literal asterisk instead of a bullet | Home `/` → Kai chat | Type "what is this even", read Kai's capability list | Medium |
| 8 | kai | After user selects a day preference ("Any day works"), subsequent Kai response re-shows the same day-picker chips — redundant and confusing | Home `/` → Kai chat | Select "Any day works" quick reply, observe next Kai message also has "Saturdays / Weekdays / Any day works" chips | Medium |
| 9 | portal/children | "Add another child" button text when zero children present — should say "Add a child" | `/portal` → Children tab (empty state) | Log into portal with any account that has no children | Low |
| 10 | kai | "New" button causes a brief full-page white blank screen before the fresh conversation loads | Home `/` | Have any conversation, click "New" in header | Low |
| 11 | sessions | Class card start dates missing year: "Starts Jan 18" instead of "Starts Jan 18, 2027" | `/sessions` | Browse any class card | Low |

---

## Overall User Experience

- **Would a real parent complete registration?** NO — the critical issue is Kai saying "Thanks for registering!" before any payment is collected. A parent would either be confused about whether they actually registered, or would think they're registered and never pay. This flow is broken end-to-end.
- **Biggest friction point:** The missing payment handoff after class selection in Kai. The entire value proposition of the app is completing registration through Kai, but the flow ends with a false confirmation instead of a payment page.
- **Most impressive feature:** The Browse Classes filter UI is excellent — fast, well-designed, the age half-year increment dropdowns are thoughtful, and the Full/Waitlist/Notify Me states work cleanly.
- **User experience rating:** 4/10
- **Summary:** The surface-level chat experience is polished and Kai handles most natural language inputs gracefully. However, two critical bugs break the core loop entirely: the registration flow never reaches payment (leaving users "registered" without paying), and the new Children Profiles Panel is completely non-functional due to auth issues. These need to be fixed before any live testing with real users.
