# KAIRO Development Excellence Standards

Global development instructions for all work on this project.

## PRIME DIRECTIVE
Create production-ready, beautiful applications that are fully featured and worthy of deployment. Prioritize user experience, performance, and maintainability in every implementation.

---

## MOBILE-FIRST DEVELOPMENT

Always design and develop with mobile devices as the primary target:
- Touch-friendly interfaces with appropriate tap targets (44px minimum)
- Responsive design that works seamlessly from mobile to desktop
- Performance optimized for mobile networks and battery life
- Test functionality on mobile devices whenever possible

---

## CODE QUALITY & ARCHITECTURE

### TypeScript Standards
- Use strict TypeScript configuration with full type safety
- Define clear interfaces and types for all data structures
- Implement proper error handling with typed error responses
- Use TypeScript's latest features appropriately

### Component Architecture
- Create reusable, composable components with clear props interfaces
- Implement proper separation of concerns (UI, business logic, data)
- Use custom hooks for complex logic and state management
- Follow consistent naming conventions: PascalCase for components, camelCase for functions

### Performance Optimization
- Implement lazy loading for routes and heavy components
- Optimize images and media assets appropriately
- Use proper caching strategies for data and assets
- Minimize bundle size and implement code splitting where beneficial

---

## UI/UX EXCELLENCE

### Design Standards
- Create visually appealing, modern interfaces that feel premium
- Use consistent spacing, typography, and color schemes
- Implement smooth animations and transitions (60fps target)
- Ensure accessibility with proper contrast ratios and semantic HTML

### User Experience
- Provide clear loading states and error messages
- Implement intuitive navigation and user flows
- Include proper form validation with helpful error messages
- Design for offline functionality where appropriate

---

## TECHNICAL IMPLEMENTATION

### Default Technology Stack
- **Styling**: Tailwind CSS with a consistent design system
- **UI Components**: shadcn/ui components for consistent UI elements
- **Icons**: Lucide React — do not install additional icon libraries
- **React patterns**: Modern hooks, functional components, Context API

### Data Management
- Implement proper state management (Context API, Zustand, or Redux Toolkit)
- Use proper data fetching patterns with loading and error states
- Implement optimistic updates for better user experience
- Handle offline scenarios gracefully

### Gemini AI Integration — MANDATORY
**Before writing ANY code that uses Gemini models** (in edge functions, frontend, or anywhere else), you MUST first read `GEMINI_API_CONFIGURATION.md` in this repo. That file contains:
- Current approved model names
- API endpoints and configuration settings
- Any other Gemini-specific standards

**Never assume or guess Gemini model names.** Always reference that file. If it doesn't exist, ask the user before proceeding with any Gemini implementation.

---

## DEPLOYMENT READINESS

### Production Standards
- Include proper environment variable handling
- Implement comprehensive error boundaries
- Add proper SEO metadata and social sharing tags
- Ensure responsive design works across all device sizes

### Security & Secure Coding Standards

Kairo handles children's personal data, medical info, and payment details for youth sports organizations. Every code change MUST follow these rules.

#### Data Sensitivity Levels

Before writing any code that reads, writes, or displays data, identify the sensitivity:

| Level | Kairo Examples | Rule |
|-------|---------------|------|
| **Critical** | Stripe keys, Supabase service role key, N8N API key, Gemini API key | Server-side ONLY (Edge Functions / Deno env). Never in client code, never in `VITE_` vars, never logged. |
| **Sensitive** | Child medical info (`children.medical_info`), payment records, family contact details | Must be scoped to `auth.uid() = user_id` (family) or organization-scoped (staff). Never exposed in URLs or logs. |
| **Organization-Private** | Staff records, session capacity, registrations, waitlists, abandoned carts | Must be scoped to organization membership via staff or family relationship. |
| **Public** | Programs, locations, session schedules, organization profiles | Read-only for anonymous users. Filtered by `is_active` or similar status flags. |

#### Database & RLS Rules

- DO: Enable RLS on every new table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) — zero exceptions
- DO: Use `auth.uid() = user_id` for family-scoped data (families, children, registrations, payments)
- DO: Use organization-scoped policies for staff data (`organization_id IN (SELECT organization_id FROM public.staff WHERE user_id = auth.uid())`)
- DO: Use `TO service_role` (not `TO public`) for backend-only policies
- DO: Allow `TO public` INSERT only when anonymous registration requires it (e.g., `conversations`) — and restrict SELECT/UPDATE to the owning family
- DON'T: Use `USING (true)` on any table containing user data, child info, or credentials
- DON'T: Grant `{public}` role SELECT on sensitive tables — use `{authenticated}` or `{service_role}`
- DON'T: Create tables without RLS

#### Functions & Migrations

- DO: Include `SET search_path = ''` in every new `CREATE OR REPLACE FUNCTION`
- DO: Use fully qualified table names in functions (e.g., `public.families`, not just `families`)
- DO: Write rollback SQL as a comment block at the top of every migration
- DO: Name migrations descriptively in snake_case (e.g., `add_waitlist_position_tracking`)
- DON'T: Hardcode generated IDs in data migrations

#### Secrets & Environment Variables

- DO: Keep API keys and service role keys in Edge Function environment (Deno.env) only
- DO: Use `VITE_` prefix ONLY for non-sensitive identifiers (`VITE_SUPABASE_URL`, `VITE_N8N_WEBHOOK_URL`)
- DON'T: Put `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `N8N_API_KEY`, or Stripe secret keys in `VITE_` vars
- DON'T: Log tokens or keys to console, even in development
- DON'T: Commit `.env` files containing real keys

#### Edge Functions

- DO: Enable JWT verification unless the function handles webhooks or anonymous registration flows (document why if disabled)
- DO: Use `createClient` with the service role key only inside Edge Functions, never client-side
- DO: Restrict CORS origins to known domains instead of `"*"` in production
- DON'T: Return raw error details or stack traces to the client
- DON'T: Trust `organizationId` from the client without verifying the caller has access to that org

#### N8N Webhook Security

- DO: Use the `N8N_WEBHOOK_KEY` header for webhook authentication when available
- DO: Validate all data received from N8N before inserting into the database
- DON'T: Pass service role keys or secrets through webhook payloads
- DON'T: Expose N8N internal workflow IDs or execution IDs to the frontend

#### Input Validation & AI Safety

- DO: Validate and sanitize all user inputs before passing to database queries or AI prompts
- DO: Sanitize conversation messages before including in Gemini prompts (prompt injection defense)
- DO: Use parameterized queries — never string-concatenate user input into SQL
- DO: Validate child age ranges (2-18), enforce program age bounds server-side
- DON'T: Trust client-side data for authorization or business rule decisions
- Follow OWASP top 10 guidelines

#### Child Data Protection

- DO: Treat all child PII (names, ages, medical info) as Sensitive-level data
- DO: Scope child records to their parent/family via `family_id` relationship
- DO: Ensure staff can only view children registered in their organization's programs
- DON'T: Expose child data in URL parameters, logs, or error messages
- DON'T: Store unnecessary child data — collect only what registration requires

#### Access Control Patterns

Use these exact patterns. Do not invent new access control approaches.

**Family-scoped (Sensitive data — families, children, payments):**
```sql
CREATE POLICY "Families access own data" ON table_name
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

**Organization-scoped (Staff accessing org data):**
```sql
CREATE POLICY "Staff access org data" ON table_name
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.staff WHERE user_id = auth.uid()
  ));
```

**Public read (Programs, locations, sessions):**
```sql
CREATE POLICY "Public can view active records" ON table_name
  FOR SELECT TO public
  USING (is_active = true);
```

**Anonymous insert with restricted access (Conversations):**
```sql
-- Allow anonymous creation for registration flow
CREATE POLICY "Anyone can start conversation" ON conversations
  FOR INSERT TO public
  WITH CHECK (true);

-- But only the owning family can read/update
CREATE POLICY "Family reads own conversations" ON conversations
  FOR SELECT TO authenticated
  USING (family_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()));
```

**Service role only (System tables):**
```sql
-- No authenticated or public policies. Access only via Edge Functions.
CREATE POLICY "Service role only" ON table_name
  FOR ALL TO service_role
  USING (true);
```

#### Change Management

- Every schema change MUST go through a migration in `supabase/migrations/`
- Include a rollback comment block at the top of sensitive migrations
- Changes to these areas require extra review before merge:
  - RLS policies (any CREATE/DROP/ALTER POLICY)
  - Auth functions or triggers (anything touching `auth.users`)
  - Payment-related tables or Stripe integration
  - Service role access patterns
  - Edge Function JWT verification settings
  - New `VITE_` environment variables
  - N8N webhook endpoint changes

#### Security Checklist

Before marking ANY task complete, verify:
1. New tables have RLS enabled with appropriate policies per sensitivity level
2. New functions include `SET search_path = ''`
3. No secrets or tokens exposed in client-side code or `VITE_` vars
4. Family data is scoped with `auth.uid()` — child data scoped via family relationship
5. No `USING (true)` policies on authenticated/public roles for sensitive tables
6. Migration has descriptive name and rollback procedure
7. Edge Functions use JWT verification (or document why not)
8. AI-facing inputs are validated for prompt injection
9. Child PII is not leaked in URLs, logs, or error responses
10. Organization-scoped queries verify the caller's org membership

---

## EFFICIENCY GUIDELINES

### Development Speed
- Only modify relevant code files — do not rewrite entire components unnecessarily
- Reuse existing components and patterns where appropriate
- Focus on the specific feature or issue requested
- Provide clear, actionable code with proper comments

### Communication
- Ask clarifying questions when requirements are ambiguous
- Explain technical decisions and trade-offs when relevant
- Provide implementation alternatives when appropriate
- Document any setup requirements or configuration needed

---

## PROJECT CONSISTENCY

- Adapt these standards to the project's existing architecture
- Maintain consistency with established patterns within the codebase
- Respect any project-specific constraints or requirements
- Integrate seamlessly with existing dependencies

---

## DOCUMENTATION SYNC REQUIREMENTS

After making ANY code changes that affect user-facing features, you MUST check and update ALL relevant documentation files. Stale docs degrade onboarding, demo quality, and product clarity.

---

### TIER 1: MANDATORY — Check After Every Feature Change

#### 1. `KAIRO_BUILD_PLAN.md` — Master feature reference and roadmap
- Update feature descriptions when behavior changes
- Check the relevant Stage section and mark items `[x]` when completed
- Add new features under the correct Stage
- Update "Status" lines when stages advance (e.g., `IN PROGRESS` → `COMPLETE`)
- This is the source of truth for what Kairo does and where it's going

#### 2. `DEV_UPDATES.md` — Development changelog
- Add a new entry at the **TOP** of the file after every meaningful change
- Format: Month/Year header, Category, Impact, Description, list of Changes
- Categories: `Foundation`, `AI`, `Core Feature`, `UX`, `Architecture`, `Research/Strategy`, `Bug Fix`, `Performance`
- Impact levels: `Critical`, `High`, `Medium`, `Low`
- Keep entries factual and specific — list actual files created/modified

#### 3. `src/components/demo/` — Demo components
- After adding or changing any feature, check whether the relevant demo component needs updating
- Key demo files to check:
  - `DemoKaiAgent.tsx` — Kai registration conversation demo
  - `DemoCoachApp.tsx` — Coach app: attendance, messaging, curriculum timer, incident reports
  - `DemoAnalytics.tsx` — Business intelligence and reporting
  - `DemoScheduling.tsx` — Schedule management
  - `DemoPayments.tsx` — Payment plans and checkout
  - `DemoMarketing.tsx` — Marketing and retention features
  - `DemoDataInsights.tsx` — Analytics and insights
  - `DemoVTO.tsx` — Platform overview
- Demo data must showcase current features — outdated demos undermine sales conversations

---

### TIER 2: CHECK WHEN RELEVANT

#### 4. `GEMINI_API_CONFIGURATION.md` — When writing any Gemini/AI code
- Always read before implementing anything that calls the Gemini API
- Update if approved model name or endpoint format changes
- Never assume model names — this file is the only source of truth

#### 5. `N8N_INTEGRATION.md` — When changing the N8N workflow architecture
- Update when new Code Tools are added to the Kai agent
- Update when webhook parameters change
- Update when the workflow ID or URL changes

#### 6. `N8N_WORKFLOW_COMPLETE_SPECIFICATION.md` — When workflow logic changes
- Update the relevant sections when conversation flow, prompt structure, or tool behavior changes

#### 7. `supabase/functions/kai-conversation/context/` — When Kai's behavior changes
- `business-rules.md` — When registration rules, age limits, or business logic changes
- `capacity-intelligence.md` — When waitlist/availability logic changes
- `communication-style.md` — When Kai's tone or persona changes
- `data-extraction.md` — When fields collected during registration change
- `registration-flow.md` — When the registration conversation flow changes

#### 8. `README.md` — When major architecture, setup, or environment variables change
- Keep the architecture diagram current
- Update environment variable list when new vars are added

---

### TIER 3: CHECK OCCASIONALLY

#### 9. `KAIRO_PRO_VTO.md` — When core vision, go-to-market, or pricing strategy changes
- Update when the product niche or primary vertical shifts
- Update when 1-year or 3-year targets change

#### 10. Test files in `tests/` — When new features are added
- Ensure test scenarios cover new registration paths or edge cases
- Reference `TESTING_GUIDE.md` and `KAIRO_Test_Data_Specifications.md` for patterns

---

### WHEN THE HELP CENTER IS BUILT (Stage 3.7)
Once `src/data/helpFAQ.ts`, `src/lib/help-context.ts`, and `src/data/tourSteps.ts` exist, they become **Tier 1 mandatory** files. Add FAQ entries for any new feature at the time the feature is built. Do not batch FAQ updates.

---

### TASK COMPLETION CHECKLIST

Before marking any feature task as done:
1. Mark the relevant `[ ]` items as `[x]` in `KAIRO_BUILD_PLAN.md`
2. Add an entry at the top of `DEV_UPDATES.md`
3. Check if any demo component in `src/components/demo/` needs updating
4. Check Tier 2 files if the change touches AI, N8N, or architecture
5. Run `npm run build` to confirm no type errors or build failures
