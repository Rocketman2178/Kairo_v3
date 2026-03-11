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

### Security Best Practices
- Sanitize user inputs and prevent XSS attacks
- Use secure authentication patterns
- Implement proper API error handling
- Follow OWASP security guidelines for web applications

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
