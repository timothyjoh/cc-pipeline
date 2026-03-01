# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
<!-- Provide a clear, specific title for this task -->
**Title:** [Brief, descriptive title of what you're building/fixing]

### Goal Statement
<!-- One paragraph describing the high-level objective -->
**Goal:** [Clear statement of what you want to achieve and why it matters]

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!-- 
AI Agent: Use your judgement to determine when strategic analysis is needed vs direct implementation.

**✅ CONDUCT STRATEGIC ANALYSIS WHEN:**
- Multiple viable technical approaches exist
- Trade-offs between different solutions are significant
- User requirements could be met through different UX patterns
- Architectural decisions will impact future development
- Implementation approach affects performance, security, or maintainability significantly
- Change touches multiple systems or has broad impact
- User has expressed uncertainty about the best approach

**❌ SKIP STRATEGIC ANALYSIS WHEN:**
- Only one obvious technical solution exists
- It's a straightforward bug fix or minor enhancement 
- The implementation pattern is clearly established in the codebase
- Change is small and isolated with minimal impact
- User has already specified the exact approach they want

**DEFAULT BEHAVIOR:** When in doubt, provide strategic analysis. It's better to over-communicate than to assume.
-->

### Problem Context
<!-- Restate the problem and why it needs strategic consideration -->
[Explain the problem and why multiple solutions should be considered - what makes this decision important?]

### Solution Options Analysis

#### Option 1: [Solution Name]
**Approach:** [Brief description of this solution approach]

**Pros:**
- ✅ [Advantage 1 - specific benefit]
- ✅ [Advantage 2 - quantified when possible]
- ✅ [Advantage 3 - why this is better]

**Cons:**
- ❌ [Disadvantage 1 - specific limitation]
- ❌ [Disadvantage 2 - trade-off or cost]
- ❌ [Disadvantage 3 - risk or complexity]

**Implementation Complexity:** [Low/Medium/High] - [Brief justification]
**Risk Level:** [Low/Medium/High] - [Primary risk factors]

#### Option 2: [Solution Name]
**Approach:** [Brief description of this solution approach]

**Pros:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons:**
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]
- ❌ [Disadvantage 3]

**Implementation Complexity:** [Low/Medium/High] - [Brief justification]
**Risk Level:** [Low/Medium/High] - [Primary risk factors]

#### Option 3: [Solution Name] (if applicable)
**Approach:** [Brief description of this solution approach]

**Pros:**
- ✅ [Advantage 1]
- ✅ [Advantage 2]

**Cons:**
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Implementation Complexity:** [Low/Medium/High] - [Brief justification]
**Risk Level:** [Low/Medium/High] - [Primary risk factors]

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option [X] - [Solution Name]

**Why this is the best choice:**
1. **[Primary reason]** - [Specific justification]
2. **[Secondary reason]** - [Supporting evidence]
3. **[Additional reason]** - [Long-term considerations]

**Key Decision Factors:**
- **Performance Impact:** [How this affects app performance]
- **User Experience:** [How this affects users]
- **Maintainability:** [How this affects future development]
- **Scalability:** [How this handles growth]
- **Security:** [Security implications]

**Alternative Consideration:**
[If there's a close second choice, explain why it wasn't selected and under what circumstances it might be preferred]

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option [X]), or would you prefer a different approach? 

**Questions for you to consider:**
- Does the recommended solution align with your priorities?
- Are there any constraints or preferences I should factor in?
- Do you have a different timeline or complexity preference?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
<!-- 
AI Agent: Analyze the project to fill this out.
- Check `package.json` for versions and dependencies.
- Check `tsconfig.json` for TypeScript configuration.
- Check `tailwind.config.ts` for styling and theme.
- Check `drizzle/schema/` for database schema.
- Check `middleware.ts` for authentication and routing.
- Check `components/` for existing UI patterns. 
-->
- **Frameworks & Versions:** [e.g., Next.js 15.3, React 19]
- **Language:** [e.g., TypeScript 5.4 with strict mode]
- **Database & ORM:** [e.g., Supabase (Postgres) via Drizzle ORM]
- **UI & Styling:** [e.g., shadcn/ui components with Tailwind CSS for styling]
- **Authentication:** [e.g., Supabase Auth managed by `middleware.ts` for protected routes]
- **Key Architectural Patterns:** [e.g., Next.js App Router, Server Components for data fetching, Server Actions for mutations]
- **Relevant Existing Components:** [e.g., `components/ui/button.tsx` for base styles, `components/auth/LoginForm.tsx` for form patterns]

### Current State
<!-- Describe what exists today based on actual analysis -->
[Describe the current situation, existing code, and what's working/not working - based on actual file analysis, not assumptions]

### Existing Context Providers Analysis
<!-- 
AI Agent: MANDATORY - Analyze existing context providers before planning new data flow
- Check app/(protected)/layout.tsx and other layouts for existing providers
- Check contexts/ directory for available context providers
- Identify what data is already available via context
- Determine what hooks are available (useUser, useUsage, etc.)
-->
- **UserContext (`useUser()`):** [Available data fields, where it's provided, what components have access]
- **UsageContext (`useUsage()`):** [Available data fields, where it's provided, billing/usage data coverage]
- **Other Context Providers:** [List any other context providers found in contexts/ directory and their data]
- **Context Hierarchy:** [Which layouts/components provide which contexts - map the provider tree]
- **Available Context Hooks:** [List all context hooks available throughout the app]

**🔍 Context Coverage Analysis:**
- What user data is already available via context vs. what needs to be fetched?
- What subscription/billing data is already available via context?
- Which components are rendered inside which context providers?
- Are there gaps where needed data isn't available via context but should be?
- Do any components unnecessarily receive props for data already in context?

## 4. Context & Problem Definition

### Problem Statement
<!-- What specific problem are you solving? -->
[Detailed explanation of the problem, including pain points, user impact, and why this needs to be solved now]

### Success Criteria
<!-- How will you know this is complete and successful? -->
- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [Specific, measurable outcome 3]

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
<!-- What should the system do? -->
- [Requirement 1: User can...]
- [Requirement 2: System will...]
- [Requirement 3: When X happens, then Y...]

### Non-Functional Requirements
<!-- Performance, security, usability, etc. -->
- **Performance:** [Response time, throughput, etc.]
- **Security:** [Authentication, authorization, data protection]
- **Usability:** [User experience requirements]
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** [Browser support, device support, etc.]

### Technical Constraints
<!-- What limitations exist? -->
- [Constraint 1: Must use existing X system]
- [Constraint 2: Cannot modify Y database table]
- [Constraint 3: Must be backward compatible with Z]

---

## 7. Data & Database Changes

### Database Schema Changes
<!-- If any database changes are needed -->
```sql
-- Example: New table creation
-- Include all DDL statements, migrations, indexes
```

### Data Model Updates
<!-- Changes to TypeScript types, Drizzle schemas, etc. -->
```typescript
// Example: New types or schema updates.
// When defining Drizzle schemas, consider adding indexes for frequently queried columns.
// e.g. import { index } from "drizzle-orm/pg-core";
//      pgTable(..., (table) => ([ index("name_idx").on(table.name) ]));
```

### Data Migration Plan
<!-- How to handle existing data -->
- [ ] [Migration step 1]
- [ ] [Migration step 2]
- [ ] [Data validation steps]

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory  
- [ ] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations
- [ ] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [ ] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `app/actions/[feature].ts`
- [ ] **Server Actions File** - `app/actions/[feature].ts` - ONLY mutations (create, update, delete)
- [ ] Examples: `createUser()`, `updateProfile()`, `deleteConversation()`
- [ ] Must use `'use server'` directive and `revalidatePath()` after mutations
- [ ] **What qualifies as mutations**: POST, PUT, DELETE operations, form submissions, data modifications

#### **QUERIES (Data Fetching)** → Choose based on complexity:

**Simple Queries** → Direct in Server Components
- [ ] **Direct in Page Components** - Simple `await db.select().from(table)` calls
- [ ] Example: `const users = await db.select().from(users).where(eq(users.id, userId))`
- [ ] Use when: Single table, simple WHERE clause, used in only 1-2 places

**Complex Queries** → `lib/[feature].ts`
- [ ] **Query Functions in lib/** - `lib/[feature].ts` for complex/reused queries
- [ ] Example: `lib/history.ts` with `getConversationsGrouped()`
- [ ] Use when: JOINs, aggregations, complex logic, used in 3+ places, needs efficient lookups
- [ ] **What qualifies as complex queries**: Real-time polling, JOIN operations, calculated fields, reusable business logic

#### **API Routes** → `app/api/[endpoint]/route.ts` - **RARELY NEEDED**
🛑 **Only create API routes for these specific cases:**
- [ ] **Webhooks** - Third-party service callbacks (Stripe, external services)
- [ ] **Non-HTML Responses** - File downloads, XML/CSV exports, binary data
- [ ] **External API Proxies** - When you need to hide API keys from client
- [ ] **Public APIs** - When building APIs for external consumption

❌ **DO NOT use API routes for:**
- [ ] ❌ Internal data fetching (use lib/ functions instead)
- [ ] ❌ Real-time polling (use lib/ functions called from client)
- [ ] ❌ Form submissions (use Server Actions instead)
- [ ] ❌ User authentication flows (use Server Actions instead)

#### **PROFESSIONAL NAMING (Directory-Based Separation):**
- `app/actions/[feature].ts` - For mutations only (directory context is clear)
- `lib/[feature].ts` - For complex queries and data fetching
- `app/api/[endpoint]/route.ts` - Only for webhooks, file exports, external APIs
- Example: `app/actions/documents.ts` + `lib/documents.ts` (no API route needed)

#### **DECISION FLOWCHART - "Where should this code go?"**

```
📝 What are you building?
│
├─ 🔄 Modifying data? (POST/PUT/DELETE)
│  └─ ✅ Use Server Actions: `app/actions/[feature].ts`
│
├─ 📊 Fetching data? (GET operations)
│  ├─ Simple query (1 table, basic WHERE)?
│  │  └─ ✅ Direct in Server Component: `await db.select()...`
│  └─ Complex query (JOINs, reused, business logic)?
│     └─ ✅ Use lib function: `lib/[feature].ts`
│
└─ 🌐 External integration?
   ├─ Webhook from 3rd party?
   │  └─ ✅ API Route: `app/api/webhooks/[service]/route.ts`
   ├─ File download/export?
   │  └─ ✅ API Route: `app/api/export/[type]/route.ts`
   └─ Internal app feature?
      └─ ❌ NO API ROUTE! Use Server Actions or lib/ instead
```

### Server Actions
<!-- New or modified server actions for mutations -->
- [ ] **`create[Model]`** - [Description of create operation]
- [ ] **`update[Model]`** - [Description of update operation]  
- [ ] **`delete[Model]`** - [Description of delete operation]

### Database Queries
<!-- How you'll fetch data - be explicit about the choice -->
- [ ] **Direct in Server Components** - Simple queries only (single table, basic WHERE)
- [ ] **Query Functions in lib/queries/** - Complex queries (JOINs, aggregations, reused 3+ times)

### API Routes (Only for Special Cases)
<!-- 🛑 ONLY create API routes when Server Actions and lib/ functions cannot handle the use case -->
- [ ] **Webhooks** - Third-party service callbacks (Stripe, external services)
- [ ] **Non-HTML Responses** - File downloads, XML/CSV exports, binary data  
- [ ] **External API Proxies** - When you need to hide API keys from client
- [ ] **Public APIs** - When building APIs for external consumption

**❌ DO NOT create API routes for internal data operations - use Server Actions (mutations) or lib/ functions (queries) instead**

### External Integrations
<!-- Third-party APIs, services, etc. -->
- [Service 1: Purpose and configuration]
- [Service 2: API keys and setup required]

**🚨 MANDATORY: Use Latest AI Models**
- When using Gemini models, always use **gemini-2.5-flash** (never gemini-1.5 or gemini-2.0 models)
- When using OpenAI models, use **gpt-4o** (never gpt-3.5-turbo as default)

---

## 9. Frontend Changes

### New Components
<!-- Components to create in components/ directory, organized by feature -->
- [ ] **`components/[feature]/ComponentName.tsx`** - [Purpose and props]
- [ ] **`components/[feature]/AnotherComponent.tsx`** - [Functionality description]

**Component Organization Pattern:**
- Use `components/[feature]/` directories for feature-specific components
- Example: `components/chat/`, `components/auth/`, `components/dashboard/`
- Keep shared/reusable components in `components/ui/` (existing pattern)
- Import into pages from the global components directory

**Component Requirements:**
- **Responsive Design:** Use mobile-first approach with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Theme Support:** Use CSS variables for colors, support `dark:` classes for dark mode
- **Accessibility:** Follow WCAG AA guidelines, proper ARIA labels, keyboard navigation
- **Text Sizing & Readability:**
  - Main content (documents, search results, Q&A responses): Use `text-base` (16px) or larger for comfortable reading
  - UI chrome (timestamps, metadata, secondary labels): Can use `text-sm` (14px) or `text-xs` (12px)
  - Prose content: Use default `prose` class, not `prose-sm`, unless space is severely constrained
  - Prioritize readability over compact layouts - users shouldn't strain to read content

### Page Updates
<!-- Pages that need changes -->
- [ ] **`/path/to/page`** - [What changes are needed]
- [ ] **`/another/page`** - [Modifications required]

### State Management
<!-- How data flows through the app -->
- [Context providers, global state, local state decisions]
- [Data fetching strategies]

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
- [ ] **✅ Check Available Contexts:** Analyze what data is already available via existing context providers
- [ ] **✅ Use Context Over Props:** If data is available via context, use hooks instead of props  
- [ ] **✅ Avoid Prop Drilling:** Don't pass data through multiple component levels when context is available
- [ ] **✅ Minimize Data Fetching:** Don't duplicate data fetching in child components when parent already has data
- [ ] **✅ Context Provider Analysis:** Check ALL context providers, not just UserContext/UsageContext

#### Decision Flowchart - "Should this be a prop or use context?"
```
📊 Do I need this data in my component?
│
├─ 🔍 Is component rendered inside a provider that has this data?
│  ├─ ✅ YES: Use context hook (useUser, useUsage, etc.) - NO PROPS NEEDED
│  └─ ❌ NO: Check if parent component could provide context or if prop is necessary
│
├─ 🔄 Is this data already fetched by parent layout/component?
│  ├─ ✅ YES: Use context or pass via props (strongly prefer context)
│  └─ ❌ NO: Component may need to fetch data directly
│
└─ 📝 Is this data specific to this component only?
   ├─ ✅ YES: Local data fetching or props appropriate
   └─ ❌ NO: Consider expanding context or using higher-level data source
```

#### Context Provider Mapping Strategy
**Before implementing any component:**
1. **Map the provider tree** - Which providers are available at the component's location?
2. **Identify available data** - What data can be accessed via context hooks?
3. **Check for duplicates** - Is the component receiving props for data available in context?
4. **Verify hook usage** - Are context hooks being used properly?

#### Common Anti-Patterns to Avoid
```typescript
// ❌ BAD: Component inside UserProvider but receives user data as props
interface ProfileProps {
  user: UserData;           // This is already in UserContext!
  subscription: SubData;    // This is already in UsageContext!
}

function ProfileComponent({ user, subscription }: ProfileProps) {
  return <div>{user.email}</div>;
}

// Parent component unnecessarily passes context data as props
<UserProvider value={userData}>
  <UsageProvider value={usageData}>
    <ProfileComponent user={userData} subscription={usageData} />
  </UsageProvider>
</UserProvider>

// ✅ GOOD: Component uses context directly  
function ProfileComponent() {
  const user = useUser();           // Gets data from UserContext
  const { subscription } = useUsage(); // Gets data from UsageContext
  return <div>{user.email}</div>;
}

// Parent component just renders - no prop drilling needed
<UserProvider value={userData}>
  <UsageProvider value={usageData}>
    <ProfileComponent />
  </UsageProvider>
</UserProvider>

// ❌ BAD: Duplicate data fetching in protected route
async function ProtectedPage() {
  const user = await getCurrentUser();     // Layout already authenticated!
  const subscription = await getSubscription(); // Already in UsageContext!
}

// ✅ GOOD: Use layout's authentication and context
function ProtectedPage() {
  // No auth needed - layout already verified user
  const user = useUser();           // From layout's UserProvider  
  const { subscription } = useUsage(); // From layout's UsageProvider
}
```

#### Universal Context Examples (Apply to All Applications)
- **UserContext (`useUser()`):** User authentication, profile, role data
- **UsageContext (`useUsage()`):** Billing, subscription, usage tracking data  
- **[Application-Specific Contexts]:** Search for additional contexts in `contexts/` directory

#### Context Analysis Checklist
- [ ] **Scan contexts/ directory** for all available context providers
- [ ] **Map provider hierarchy** from layouts down to components
- [ ] **Identify hook availability** for each context provider
- [ ] **Check for prop drilling** where context hooks could be used instead
- [ ] **Verify no duplicate data fetching** when context already provides the data
- [ ] **Review protected route patterns** to avoid re-authentication when layout handles it

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

**AI Agent Instructions:** Before presenting the task document for approval, you MUST provide a clear overview of the code changes you're about to make. This helps the user understand exactly what will be modified without having to approve first.

**Requirements:**
- [ ] **Always include this section** for any task that modifies existing code
- [ ] **Show actual code snippets** with before/after comparisons
- [ ] **Focus on key changes** - don't show every line, but show enough to understand the transformation
- [ ] **Use file paths and line counts** to give context about scope of changes
- [ ] **Explain the impact** of each major change

### Format to Follow:

#### 📂 **Current Implementation (Before)**
```typescript
// Show current code that will be changed
// Include file paths and key logic
// Focus on the parts that will be modified
```

#### 📂 **After Refactor**
```typescript
// Show what the code will look like after changes
// Same files, but with new structure/logic
// Highlight the improvements
```

#### 🎯 **Key Changes Summary**
- [ ] **Change 1:** Brief description of what's being modified and why
- [ ] **Change 2:** Another major change with rationale  
- [ ] **Files Modified:** List of files that will be changed
- [ ] **Impact:** How this affects the application behavior

**Note:** If no code changes are required (pure documentation/planning tasks), state "No code changes required" and explain what will be created or modified instead.

---

## 11. Implementation Plan

### Phase 1: Database Changes (If Required)
**Goal:** Prepare and apply database schema changes with safe rollback capability

- [ ] **Task 1.1:** Generate Database Migration
  - Files: `lib/drizzle/schema/*.ts`
  - Details: Update schema files with new fields, tables, or indexes
- [ ] **Task 1.2:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback
- [ ] **Task 1.3:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Only run after down migration is created and verified

### Phase 2: [Phase Name]
**Goal:** [What this phase accomplishes]

- [ ] **Task 2.1:** [Specific task with file paths]
  - Files: `path/to/file.ts`, `another/file.tsx`
  - Details: [Technical specifics]
- [ ] **Task 2.2:** [Another task]
  - Files: [Affected files]
  - Details: [Implementation notes]

### Phase 3: [Phase Name]
**Goal:** [What this phase accomplishes]

- [ ] **Task 3.1:** [Specific task]
- [ ] **Task 3.2:** [Another task]

### Phase 4: Basic Code Validation (AI-Only) 
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 4.1:** Code Quality Verification
  - Files: All modified files  
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands
- [ ] **Task 4.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic syntax, edge case handling, fallback patterns
- [ ] **Task 4.3:** File Content Verification (if applicable)
  - Files: Seed data, configuration files, static data
  - Details: Read files to verify data structure, configuration correctness (NO live database/API calls)

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 4, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review  
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 5.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 5.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 6: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 6.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 6.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details: Clear instructions for user to verify UI behavior, interactions, visual changes
- [ ] **Task 6.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

...

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, etc.) 
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Database Cleanup
**Goal:** Remove usage tracking infrastructure and simplify subscription schema

- [x] **Task 1.1:** Create Database Migration for Usage Table Removal ✓ 2025-07-24
  - Files: `drizzle/migrations/0009_flashy_risque.sql` ✓
  - Details: Dropped user_usage table, simplified users subscription_tier enum ✓
- [x] **Task 1.2:** Update Database Schema Files ✓ 2025-07-24  
  - Files: `lib/drizzle/schema/users.ts` (updated enum), `lib/drizzle/schema/ai_models.ts` (removed is_premium_model) ✓
  - Details: Binary free/paid system implemented ✓
- [x] **Task 1.3:** Apply Migration ✓ 2025-07-24
  - Command: `npm run db:migrate` executed successfully ✓
  - Details: Schema changes applied to development database ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── app/[route]/
│   ├── page.tsx                      # The route's main UI
│   ├── loading.tsx                   # Instant loading state UI
│   └── error.tsx                     # Route-specific error boundary
├── components/[feature]/
│   ├── FeatureComponent.tsx          # Feature-specific components
│   └── AnotherComponent.tsx
├── app/actions/
│   └── [feature].ts                  # Server actions (mutations only)
└── lib/
    ├── [feature].ts                   # Complex query functions (or lib/queries/[feature].ts)
    └── utility.ts                     # Shared utilities
```

**File Organization Rules:**
- **Components**: Always in `components/[feature]/` directories
- **Pages**: Only `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` in `app/` routes  
- **Server Actions**: In `app/actions/[feature].ts` files (mutations only)
- **Complex Queries**: In `lib/[feature].ts` files (when needed)
- **Utilities**: In `lib/` directory
- **Types**: Co-located with components or in `lib/types.ts`

#### **LIB FILE SERVER/CLIENT SEPARATION - CRITICAL ARCHITECTURE RULE**

**🚨 MANDATORY: Prevent Server/Client Boundary Violations**

When creating lib files, **NEVER mix server-only imports with client-safe utilities** in the same file.

**Server-Only Imports (Cannot be used by client components):**
- `next/headers` (cookies, headers)
- `@/lib/supabase/server` 
- `@/lib/drizzle/db` (database operations)
- Server Actions or other server-side functions
- Node.js modules (fs, path, etc.)

**Decision Flowchart - "Should I split this lib file?"**
```
📁 What's in your lib/[feature].ts file?
│
├─ 🔴 Server-only imports + Client-safe utilities?
│  └─ ✅ SPLIT: Create lib/[feature]-client.ts for client utilities
│
├─ 🟢 Only server-side operations?
│  └─ ✅ KEEP: Single lib/[feature].ts file (server-only)
│
└─ 🟢 Only client-safe utilities?
   └─ ✅ KEEP: Single lib/[feature].ts file (client-safe)
```

**File Naming Pattern:**
- `lib/[feature].ts` - Server-side operations and re-exports
- `lib/[feature]-client.ts` - Client-safe utilities only
- Example: `lib/attachments.ts` + `lib/attachments-client.ts`

### Files to Modify
- [ ] **`existing/file.ts`** - [What changes to make]
- [ ] **`another/file.tsx`** - [Modifications needed]

### Dependencies to Add
```json
{
  "dependencies": {
    "new-package": "^1.0.0"
  },
  "devDependencies": {
    "dev-package": "^2.0.0"
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** [What could go wrong when...] 
  - **Code Review Focus:** [Which files/functions to examine for this issue]
  - **Potential Fix:** [If issue found, suggest this approach]
- [ ] **Error Scenario 2:** [Another potential failure point]
  - **Code Review Focus:** [Where to look for gaps in error handling]
  - **Potential Fix:** [Recommended solution if needed]

### Edge Cases to Consider
- [ ] **Edge Case 1:** [Unusual scenario that could break functionality]
  - **Analysis Approach:** [How to identify if this is handled in the code]
  - **Recommendation:** [What should be implemented if missing]
- [ ] **Edge Case 2:** [Another boundary condition]
  - **Analysis Approach:** [Where to check for this scenario]
  - **Recommendation:** [How to address if found]

### Security & Access Control Review
- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Route protection in middleware, server action authorization
- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Redirect behavior, error handling for unauthenticated requests
- [ ] **Form Input Validation:** Are user inputs validated before processing?
  - **Check:** Client-side validation, server-side validation, error messages
- [ ] **Permission Boundaries:** Can users access data/features they shouldn't?
  - **Check:** Data filtering by user role, proper authorization checks

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** Security and access control issues
2. **Important:** User-facing error scenarios and edge cases  
3. **Nice-to-have:** UX improvements and enhanced error messaging

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Add these to .env
NEW_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template
4. **GET USER APPROVAL** of the task document  
5. **IMPLEMENT THE FEATURE** only after approval

**DO NOT:** Present implementation plans in chat without creating a proper task document first.  
**DO:** Always create comprehensive task documentation that can be referenced later.  
**DO:** Present strategic options when multiple viable approaches exist.

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [ ] **Assess complexity** - Is this a straightforward change or are there multiple viable approaches?
   - [ ] **Review the criteria** in "Strategic Analysis & Solution Options" section
   - [ ] **Decision point**: Skip to step 3 if straightforward, proceed to step 2 if strategic analysis needed

2. **STRATEGIC ANALYSIS SECOND (If needed)**
   - [ ] **Present solution options** with pros/cons analysis for each approach
   - [ ] **Include implementation complexity, time estimates, and risk levels** for each option
   - [ ] **Provide clear recommendation** with rationale
   - [ ] **Wait for user decision** on preferred approach before proceeding
   - [ ] **Document approved strategy** for inclusion in task document

3. **CREATE TASK DOCUMENT THIRD (Required)**
   - [ ] **Create a new task document** in the `ai_docs/tasks/` directory using this template
   - [ ] **Fill out all sections** with specific details for the requested feature
   - [ ] **Include strategic analysis** (if conducted) in the appropriate section
   - [ ] **🔢 FIND LATEST TASK NUMBER**: Use `list_dir` to examine ai_docs/tasks/ directory and find the highest numbered task file (e.g., if highest is 028, use 029)
   - [ ] **Name the file** using the pattern `XXX_feature_name.md` (where XXX is the next incremental number)
   - [ ] **🚨 MANDATORY: POPULATE CODE CHANGES OVERVIEW**: Always read existing files and show before/after code snippets in section 9
   - [ ] **Present a summary** of the task document to the user for review

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] **After incorporating user feedback**, present these 3 exact options:
   
   **👤 IMPLEMENTATION OPTIONS:**
   
   **A) Preview High-Level Code Changes** 
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.
   
   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.
   
   **C) Provide More Feedback** 
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.
   
   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately  
   - [ ] **If C chosen**: Address feedback and re-present options

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**
   
   For each phase, follow this exact pattern:
   
   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:
   
   ```
   ✅ **Phase [X] Complete - [Phase Name]**
   - Modified [X] files with [Y] total line changes
   - Key changes: [specific file paths and what was modified]
   - Files updated: 
     • file1.ts (+15 lines): [brief description of changes]
     • file2.tsx (-3 lines, +8 lines): [brief description of changes]
   - Commands executed: [list any commands run]
   - Linting status: ✅ All files pass / ❌ [specific issues found]
   
   **🔄 Next: Phase [X+1] - [Phase Name]**
   - Will modify: [specific files]  
   - Changes planned: [brief description]
   - Estimated scope: [number of files/changes expected]
   
   **Say "proceed" to continue to Phase [X+1]**
   ```
   
   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 5 (Comprehensive Code Review) before any user testing
   
   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
     - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
  - [ ] **Mark checkboxes as [x]** with completion timestamps
  - [ ] **Add specific completion notes** (file paths, line counts, key changes)
  - [ ] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [ ] **🚨 MANDATORY: For ANY database changes, create down migration file BEFORE running `npm run db:migrate`**
     - [ ] Follow `drizzle_down_migration.md` template process
     - [ ] Create `drizzle/migrations/[timestamp]/down.sql` file
     - [ ] Verify all operations use `IF EXISTS` and include warnings
     - [ ] Only then run `npm run db:migrate`
     - [ ] **For any new page route, create `loading.tsx` and `error.tsx` files alongside `page.tsx`**
  - [ ] **Always create components in `components/[feature]/` directories**
  - [ ] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [ ] **Phase 4 Complete** → Present "Implementation Complete!" message (section 16, step 7)
     - [ ] **Wait for user approval** → Execute comprehensive code review (section 16, step 8)  
     - [ ] **Code review complete** → ONLY THEN request user browser testing
     - [ ] **NEVER skip comprehensive code review** - Phase 4 basic validation ≠ comprehensive review
  - [ ] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - [ ] **Audit new lib files** for server/client mixing
   - [ ] **Check import chains** - trace what server dependencies are pulled in
   - [ ] **Test client component imports** - ensure no boundary violations
   - [ ] **Split files if needed** using `[feature]-client.ts` pattern
   - [ ] **Update import statements** in client components to use client-safe files

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - [ ] **Present this exact message** to user after all implementation complete:
   
   ```
   🎉 **Implementation Complete!**
   
   All phases have been implemented successfully. I've made changes to [X] files across [Y] phases.
   
   **📋 I recommend doing a thorough code review of all changes to ensure:**
   - No mistakes were introduced
   - All goals were achieved  
   - Code follows project standards
   - Everything will work as expected
   
   **Would you like me to proceed with the comprehensive code review?**
   
   This review will include:
   - Verifying all changes match the intended goals
   - Running linting and type-checking on all modified files
   - Checking for any integration issues
   - Confirming all requirements were met
   ```
   
   - [ ] **Wait for user approval** of code review
   - [ ] **If approved**: Execute comprehensive code review process below

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] **Read all modified files** and verify changes match task requirements exactly
   - [ ] **Run linting and type-checking** on all modified files using appropriate commands
   - [ ] **Check for integration issues** between modified components
   - [ ] **Verify all success criteria** from task document are met
   - [ ] **Test critical workflows** affected by changes
   - [ ] **Provide detailed review summary** using this format:
   
   ```
   ✅ **Code Review Complete**
   
   **Files Reviewed:** [list all modified files with line counts]
   **Linting Status:** ✅ All files pass / ❌ [specific issues found]
   **Type Checking:** ✅ No type errors / ❌ [specific type issues]
   **Integration Check:** ✅ Components work together properly / ❌ [issues found]
   **Requirements Met:** ✅ All success criteria achieved / ❌ [missing requirements]
   
   **Summary:** [brief summary of what was accomplished and verified]
   **Confidence Level:** High/Medium/Low - [specific reasoning]
   **Recommendations:** [any follow-up suggestions or improvements]
   ```

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- "Option 1 looks good"
- "Go with your recommendation"
- "I prefer Option 2"
- "Proceed with [specific option]"
- "That approach works"
- "Yes, use that strategy"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see what will be modified"
- "Walk me through the changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."
- "I'd like to change..."
- "Wait, let me think about..."

#### For Phase Continuation
**✅ PHASE CONTINUATION RESPONSES:**
- "proceed"
- "continue"
- "next phase"
- "go ahead"
- "looks good"

**❓ CLARIFICATION NEEDED (Do NOT continue to next phase):**
- Questions about the completed phase
- Requests for changes to completed work
- Concerns about the implementation
- No response or silence

#### For Final Code Review
**✅ CODE REVIEW APPROVAL:**
- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**  
🛑 **NEVER continue to next phase without "proceed" confirmation!**  
🛑 **NEVER skip comprehensive code review after implementation phases!**  
🛑 **NEVER proceed to user testing without completing code review first!**  
🛑 **NEVER run `npm run db:migrate` without first creating the down migration file using `drizzle_down_migration.md` template!**
🛑 **NEVER run application execution commands - user already has app running!**

### 🚨 CRITICAL: Command Execution Rules
**NEVER run application execution commands - the user already has their development environment running!**

**❌ FORBIDDEN COMMANDS (Will cause conflicts with running dev server):**
- `npm run dev` / `npm start` / `next dev` - User already running
- `npm run build` / `next build` - Expensive and unnecessary for validation
- Any command that starts/serves the application
- Any command that compiles/builds for production
- Any long-running processes or servers

**✅ ALLOWED COMMANDS (Safe static analysis only):**
- `npm run lint` - Static code analysis, safe to run
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate`
- File reading/analysis tools

**🎯 VALIDATION STRATEGY:**
- Use linting for code quality issues
- Read files to verify logic and structure
- Check syntax and dependencies statically
- Let the user handle all application testing manually

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API" 
  - [ ] **❌ NEVER write migration artifacts**: "Moved from X", "Previously was Y"
  - [ ] **✅ ALWAYS explain business logic**: "Calculate discount for premium users", "Validate permissions before deletion"
  - [ ] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [ ] **Remove unused code completely** - don't leave comments explaining what was removed
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [ ] **Prioritize early returns** over nested if-else statements
  - [ ] **Validate inputs early** and return immediately for invalid cases
  - [ ] **Handle error conditions first** before proceeding with main logic
  - [ ] **Exit early for edge cases** to reduce nesting and improve readability
  - [ ] **Example pattern**: `if (invalid) return error; // main logic here`
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [ ] **Avoid Promise .then() chains** - use async/await for better readability
  - [ ] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [ ] **Use Promise.all()** for concurrent operations instead of chaining multiple .then()
  - [ ] **Create separate async functions** for complex operations instead of long chains
  - [ ] **Example**: `const result = await operation();` instead of `operation().then(result => ...)`
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [ ] **Never handle "legacy formats"** - expect the current format or fail fast
  - [ ] **No "try other common fields"** fallback logic - if expected field missing, throw error
  - [ ] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [ ] **Single expected response format** - based on current API contract
  - [ ] **Throw descriptive errors** - explain exactly what format was expected vs received
  - [ ] **Example**: `if (!expectedFormat) throw new Error('Expected X format, got Y');`
- [ ] **🚨 MANDATORY: Create down migration files before running ANY database migration**
  - [ ] Follow `drizzle_down_migration.md` template process
  - [ ] Use `IF EXISTS` clauses for safe rollback operations
  - [ ] Include appropriate warnings for data loss risks
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] **Verify mobile usability on devices 320px width and up**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**
  - [ ] **Never leave placeholder comments** like "// No usage tracking needed" or "// Removed for simplicity"
  - [ ] **Delete empty functions/components** completely rather than leaving commented stubs
  - [ ] **Remove unused imports** and dependencies after deletions
  - [ ] **Clean up empty interfaces/types** that no longer serve a purpose
  - [ ] **Remove dead code paths** rather than commenting them out
  - [ ] **If removing code, remove it completely** - don't leave explanatory comments about what was removed

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - [ ] Mutations → Server Actions (`app/actions/[feature].ts`)
  - [ ] Queries → lib functions (`lib/[feature].ts`) for complex, direct in components for simple
  - [ ] API routes → Only for webhooks, file exports, external integrations
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files**
  - [ ] Files with server imports (next/headers, supabase/server, db) don't export client-safe utilities
  - [ ] Client components can import utilities without pulling in server dependencies
  - [ ] Mixed server/client files are split using `-client.ts` pattern
- [ ] **🚨 VERIFY: No re-exports of non-async functions from Server Action files**
  - [ ] Files with `"use server"` directive ONLY export async functions
  - [ ] Utility functions and constants are NOT re-exported from `app/actions/` files
  - [ ] Synchronous utilities live in separate `lib/[feature]-utils.ts` files
  - [ ] Example violation: `export { utilityFn } from "@/lib/utils"` in a `"use server"` file
- [ ] **🚨 VERIFY: Proper context usage patterns**
  - [ ] Components use available context providers (UserContext, UsageContext, etc.) instead of unnecessary props
  - [ ] No duplicate data fetching when data is already available in context
  - [ ] Context hooks used appropriately in components rendered inside providers
  - [ ] No prop drilling when context alternative exists for the same data
  - [ ] All context providers identified and mapped before designing component interfaces
- [ ] **❌ AVOID: Creating unnecessary API routes for internal operations**
- [ ] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file**
- [ ] **❌ AVOID: Prop drilling when context providers already contain the needed data**
- [ ] **🔍 DOUBLE-CHECK: Does this really need an API route or should it be a Server Action/lib function?**
- [ ] **🔍 DOUBLE-CHECK: Can client components safely import from all lib files they need?**
- [ ] **🔍 DOUBLE-CHECK: Are components using context hooks instead of receiving context data as props?**

---

## 17. Notes & Additional Context

### Research Links
- [Link to relevant documentation]
- [Reference implementations]
- [Design mockups or wireframes]

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**❌ NEVER DO:**
- Import from `next/headers` in files that export client-safe utilities
- Mix database operations with utility functions in same file
- Import from `@/lib/supabase/server` alongside client-safe functions
- Create utility files that both server and client components import without considering the import chain
- **Re-export synchronous functions from `"use server"` files**
- **Mix async Server Actions with synchronous utility exports in `app/actions/` files**

**✅ ALWAYS DO:**
- Separate server operations from client utilities into different files
- Use `-client.ts` or `-utils.ts` suffix for client-safe utility files
- Re-export client utilities from main file for backward compatibility (EXCEPT in `"use server"` files)
- Test that client components can import utilities without errors
- **Keep utilities in separate `lib/` files, not in `app/actions/` files**
- **Only export async functions from `"use server"` files**
- **Import utilities dynamically in Server Actions if needed, never re-export them**

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** Will this change break existing API endpoints or data contracts?
- [ ] **Database Dependencies:** Are there other tables/queries that depend on data structures being modified?
- [ ] **Component Dependencies:** Which other components consume the interfaces/props being changed?
- [ ] **Authentication/Authorization:** Will this change affect existing user permissions or access patterns?

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** How will changes to data models affect downstream consumers?
- [ ] **UI/UX Cascading Effects:** Will component changes require updates to parent/child components?
- [ ] **State Management:** Will new data structures conflict with existing state management patterns?
- [ ] **Routing Dependencies:** Are there route dependencies that could be affected by page structure changes?

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Will new queries or schema changes affect existing query performance?
- [ ] **Bundle Size:** Are new dependencies significantly increasing the client-side bundle?
- [ ] **Server Load:** Will new endpoints or operations increase server resource usage?
- [ ] **Caching Strategy:** Do changes invalidate existing caching mechanisms?

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Does this change introduce new potential security vulnerabilities?
- [ ] **Data Exposure:** Are there risks of inadvertently exposing sensitive data?
- [ ] **Permission Escalation:** Could new features accidentally bypass existing authorization checks?
- [ ] **Input Validation:** Are all new data entry points properly validated?

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Will changes to familiar interfaces confuse existing users?
- [ ] **Data Migration:** Do users need to take action to migrate existing data?
- [ ] **Feature Deprecation:** Are any existing features being removed or significantly changed?
- [ ] **Learning Curve:** Will new features require additional user training or documentation?

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Are we introducing patterns that will be harder to maintain?
- [ ] **Dependencies:** Are new third-party dependencies reliable and well-maintained?
- [ ] **Testing Overhead:** Will this change require significant additional test coverage?
- [ ] **Documentation:** What new documentation will be required for maintainers?

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
These issues must be brought to the user's attention before implementation:
- [ ] **Database Migration Required:** Changes that require data migration in production
- [ ] **Breaking API Changes:** Modifications that will break existing integrations
- [ ] **Performance Degradation:** Changes likely to significantly impact application speed
- [ ] **Security Vulnerabilities:** New attack vectors or data exposure risks
- [ ] **User Data Loss:** Risk of losing or corrupting existing user data

#### ⚠️ **YELLOW FLAGS - Discuss with User**
These issues should be discussed but may not block implementation:
- [ ] **Increased Complexity:** Changes that make the codebase harder to understand
- [ ] **New Dependencies:** Additional third-party packages that increase bundle size
- [ ] **UI/UX Changes:** Modifications that change familiar user workflows
- [ ] **Maintenance Overhead:** Features that will require ongoing maintenance attention

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** Ensure database backups before schema changes
- [ ] **Rollback Plan:** Define clear rollback procedures for database migrations
- [ ] **Staging Testing:** Test all database changes in staging environment first
- [ ] **Gradual Migration:** Plan for gradual data migration if needed

#### API Changes
- [ ] **Versioning Strategy:** Use API versioning to maintain backward compatibility
- [ ] **Deprecation Timeline:** Provide clear timeline for deprecated features
- [ ] **Client Communication:** Notify API consumers of breaking changes in advance
- [ ] **Graceful Degradation:** Ensure old clients can still function during transition

#### UI/UX Changes
- [ ] **Feature Flags:** Use feature flags to gradually roll out UI changes
- [ ] **User Communication:** Notify users of interface changes through appropriate channels
- [ ] **Help Documentation:** Update help documentation before releasing changes
- [ ] **Feedback Collection:** Plan for collecting user feedback on changes

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [ ] **Complete Impact Analysis:** Fill out all sections of the impact assessment
- [ ] **Identify Critical Issues:** Flag any red or yellow flag items
- [ ] **Propose Mitigation:** Suggest specific mitigation strategies for identified risks
- [ ] **Alert User:** Clearly communicate any significant second-order impacts
- [ ] **Recommend Alternatives:** If high-risk impacts are identified, suggest alternative approaches

### Example Analysis Template

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- Database schema change will require migration of 10,000+ existing records
- API endpoint `/api/users` response format changing (affects mobile app)

**Performance Implications:**
- New JOIN query may slow down dashboard load time by 200ms
- Additional React components will increase bundle size by 15KB

**Security Considerations:**
- New user input field requires XSS protection
- API endpoint needs rate limiting to prevent abuse

**User Experience Impacts:**
- Navigation menu restructure may confuse existing users
- New required field will interrupt existing signup flow

**Mitigation Recommendations:**
- Implement database migration script with rollback capability
- Use API versioning to maintain backward compatibility
- Add performance monitoring for new queries
- Plan user communication strategy for UI changes

**🚨 USER ATTENTION REQUIRED:**
The database migration will require approximately 30 minutes of downtime. Please confirm if this is acceptable for your deployment schedule.
```

---

*Template Version: 1.3*  
*Last Updated: 8/26/2025*  
*Created By: Brandon Hancock*
