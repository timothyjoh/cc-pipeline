# Codebase Cleanup Analysis Template

> **Purpose:** Comprehensive analysis of ShipKit template project to identify unused code, type issues, performance problems, and cleanup opportunities. This template generates a detailed findings report that gets handed off to `task_template.md` for implementation.

> **Scope:** This template is designed for Next.js/TypeScript projects only. For Python projects with `pyproject.toml`, a separate cleanup template will be created in the future.

---

## 🔍 PHASE 1: Pre-Analysis Setup

### Project Context Analysis

<!-- AI Agent: Analyze the current project to understand its structure and existing tooling -->

#### Technology & Architecture

<!--
AI Agent: Analyze the project to fill this out.
- Check `package.json` for versions and dependencies.
- Check `tsconfig.json` for TypeScript configuration.
- Check `tailwind.config.ts` for styling and theme.
- Check `drizzle/schema/` for database schema.
- Check `middleware.ts` for authentication and routing.
- Check `components/` for existing UI patterns.
- Check `eslint.config.mjs` for linting configuration.
- Check project root for `pyproject.toml` vs `package.json` to determine project type.
-->

- **Project Type:** [Node.js/TypeScript project - confirmed by presence of `package.json`, `tsconfig.json`, `.tsx` files]
- **Template Base:** [e.g., chat-saas, rag-saas, adk-agent-saas]
- **Frameworks & Versions:** [e.g., Next.js 15.3, React 19]
- **Language:** [e.g., TypeScript 5.4 with strict mode]
- **Database & ORM:** [e.g., Supabase (Postgres) via Drizzle ORM]
- **UI & Styling:** [e.g., shadcn/ui components with Tailwind CSS for styling]
- **Authentication:** [e.g., Supabase Auth managed by `middleware.ts` for protected routes]
- **Key Architectural Patterns:** [e.g., Next.js App Router, Server Components for data fetching, Server Actions for mutations]
- **Relevant Existing Components:** [e.g., `components/ui/button.tsx` for base styles, `components/auth/LoginForm.tsx` for form patterns]

#### Current Directory Structure

```
# AI Agent: Run tree command or list_dir to understand project layout
[Project structure overview]
```

#### Existing Development Tooling

- **Linting:** [e.g., ESLint with @typescript-eslint/parser, specific rules configuration]
- **Type Checking:** [e.g., TypeScript strict mode status, noUnusedLocals setting]
- **Package Manager:** [e.g., npm, pnpm, yarn - determined from lock file presence]
- **Build System:** [e.g., Next.js build system, bundle analyzer availability]
- **Scripts Available:** [List key scripts from package.json: lint, type-check, build, dev]
- **Dependencies Count:** [Total dependencies vs devDependencies counts]

---

## 🛠️ PHASE 2: Analysis Tool Installation

### ⚠️ CRITICAL: Do NOT Modify Configuration Files

<!-- AI Agent: NEVER modify tsconfig.json or eslint.config.mjs during cleanup -->

**🚨 FORBIDDEN ACTIONS:**

```bash
# NEVER modify these files during cleanup:
# ❌ tsconfig.json - DO NOT change TypeScript configuration
# ❌ eslint.config.mjs - DO NOT change ESLint configuration
# ❌ package.json scripts - DO NOT modify existing linting/type-check scripts
```

**🛡️ SAFETY RULE: Work With Existing Configuration**
The project already has working TypeScript and ESLint configurations. **Any modifications to these files can break a working codebase and introduce dozens of false positive errors.**

**✅ ALLOWED: Use Existing Analysis Tools**
Many projects already have analysis tools installed. Check `package.json` devDependencies for:

```bash
# Check if these tools are already available:
npx depcheck --version          # Dependency analysis
npx npm-check-updates --version # Update checking
npm run lint                   # Use existing ESLint config
npm run type-check            # Use existing TypeScript config
```

**✅ ONLY INSTALL MISSING CORE TOOLS:**

```bash
# Only install if truly missing (check package.json first):
npm install --save-dev depcheck npm-check-updates

# NEVER install or configure additional ESLint plugins during cleanup
# NEVER modify TypeScript compiler options during cleanup
```

---

## 🕵️ PHASE 3: Comprehensive Analysis Execution

### Project Type Detection & Commands

<!--
AI Agent: CRITICAL - Always detect project type first before running any commands!
Follow the project type detection rules from cursor_rules.
-->

#### Step 1: Detect Project Type

```bash
# Check for project type indicators
ls -la | grep -E "(package\.json|pyproject\.toml|tsconfig\.json)"

# For this cleanup template: Focus on Node.js/TypeScript projects only
# Confirmed by presence of: package.json, tsconfig.json, .tsx files
```

**🚨 MANDATORY PROJECT TYPE VALIDATION:**

- [ ] **Node.js/TypeScript Project Confirmed:** `package.json` + `tsconfig.json` + `.tsx` files present
- [ ] **Use Node.js Commands:** `npm run lint`, `npm run type-check`, `npm run format`
- [ ] **Skip if Python Project:** If `pyproject.toml` found, this cleanup template doesn't apply

#### Step 2: Analysis Commands Sequence (Node.js/TypeScript Only)

<!-- AI Agent: Only run these commands after confirming Node.js/TypeScript project type -->

**1. Unused Dependencies Analysis:**

```bash
# Check for unused dependencies
npx depcheck --detailed

# Check for outdated dependencies
npx npm-check-updates --format group
```

**2. Unused Code Analysis:**

```bash
# Run ESLint using EXISTING configuration (never modify config)
npm run lint

# TypeScript type checking using EXISTING configuration
npm run type-check

# ⚠️ NEVER run with additional flags that aren't in the project's scripts:
# ❌ npx tsc --noEmit --noUnusedLocals --noUnusedParameters
# ❌ npx tsc --noEmit --strict
# These can introduce false positives and break working code
```

**3. Type Issues Analysis (Conservative Approach):**

```bash
# Only check for explicit 'any' types (safe check)
grep -r ": any\|as any" app/ components/ lib/ hooks/ --include="*.ts" --include="*.tsx" || echo "No explicit any types found"

# Check for @ts-ignore or @ts-expect-error (problematic suppressions)
grep -r "@ts-ignore\|@ts-expect-error" app/ components/ lib/ hooks/ --include="*.ts" --include="*.tsx" || echo "No TypeScript suppressions found"
```

**4. Import/Export Analysis:**

```bash
# Find unused exports
npx ts-unused-exports tsconfig.json

# Circular dependency detection
npx madge --circular --extensions ts,tsx .
```

**5. Bundle Analysis (Development Safe):**

```bash
# 🚨 IMPORTANT: Never run build commands during development per cursor rules
# Use lint and type-check for validation instead of expensive build operations

# Check for potential bundle issues through import analysis
npm run lint -- --no-fix 2>&1 | grep -i "import\|export" || echo "No import/export issues found"

# Verify all imports resolve correctly (faster than full build)
npm run type-check 2>&1 | head -20 || echo "Type checking completed"

# Note: Bundle analysis with @next/bundle-analyzer should only be done during actual deployment
echo "Bundle size analysis skipped - use lint/type-check for development validation"
```

**6. File Organization Analysis:**

```bash
# Find misplaced files (components in wrong directories, etc.)
find . -name "*.tsx" -not -path "./app/*" -not -path "./components/*" -not -path "./node_modules/*"

# Check naming conventions
find . -name "*" -not -path "./node_modules/*" | grep -E "^[A-Z]" | head -20
```

**7. Performance Pattern Analysis:**

```bash
# Find potential performance issues
grep -r "useEffect\|useState\|useCallback\|useMemo" app/ components/ --include="*.tsx" | wc -l

# Check for console.log statements
grep -r "console\." app/ components/ lib/ --include="*.ts" --include="*.tsx"
```

---

## 📊 PHASE 4: Findings Report Generation

### ⚠️ IMPORTANT: Configuration Files Are NOT Issues

<!-- AI Agent: DO NOT categorize working configuration as problems to fix -->

**🚨 NEVER Report These As Issues:**

- ❌ TypeScript configuration that passes `npm run type-check`
- ❌ ESLint configuration that passes `npm run lint` (warnings are OK)
- ❌ Working package.json scripts and dependencies
- ❌ "Missing" strict mode settings in tsconfig.json
- ❌ "Basic" ESLint rules that aren't causing errors

**✅ ONLY Report Actual Code Issues:**

- Genuine unused exports from utility functions
- Console.log statements in production code
- Actually missing dependencies that break scripts
- Dead code that serves no purpose

### 🚨 Critical Issues (Fix Immediately)

<!-- AI Agent: Categorize findings by severity -->

**Type Errors:**

- [ ] **File:** [path] - **Issue:** [TypeScript error description] - **Impact:** [breaks build/runtime]
- [ ] **File:** [path] - **Issue:** [specific type problem] - **Suggested Fix:** [solution]

**Build-Breaking Issues:**

- [ ] **Import Errors:** [list files with broken imports]
- [ ] **Missing Dependencies:** [packages referenced but not installed]
- [ ] **Configuration Issues:** [tsconfig, eslint, next.config problems]

### ⚠️ High Priority Issues (Fix Soon)

**Unused Code (High Confidence):**

- [ ] **Unused Imports:** [file] imports [module] but never uses it
- [ ] **Unused Variables:** [file] declares [variable] but never references it
- [ ] **Dead Functions:** [file] exports [function] but no files import it
- [ ] **Unused Dependencies:** [package] installed but not imported anywhere

**Type Quality Issues:**

- [ ] **Any Types:** [file] uses `any` at [line] - should be [specific type]
- [ ] **Type Assertions:** [file] uses `as Type` at [line] - consider type guards
- [ ] **Missing Annotations:** [file] function [name] missing return type

### 🔧 Medium Priority Issues (Improvement Opportunities)

**Performance Patterns:**

- [ ] **Missing useMemo:** [file] expensive calculation in [component] not memoized
- [ ] **Missing useCallback:** [file] function recreated on every render in [component]
- [ ] **Inefficient useEffect:** [file] useEffect with missing dependencies or overly broad deps

**Code Organization:**

- [ ] **Misplaced Files:** [file] should be in [suggested directory] not [current location]
- [ ] **Naming Inconsistencies:** [file] doesn't follow [PascalCase/camelCase] convention
- [ ] **Large Files:** [file] is [size] lines, consider splitting into smaller modules

**Dependency Management:**

- [ ] **Outdated Packages:** [package] v[current] → v[latest] available
- [ ] **Duplicate Dependencies:** [package] appears in both dependencies and devDependencies
- [ ] **Unused DevDependencies:** [package] not used in build process

### 📈 Low Priority Issues (Nice to Have)

**Code Style & Consistency:**

- [ ] **Inconsistent Import Styles:** Mix of default/named imports for [module]
- [ ] **Console Statements:** [count] console.log statements found (dev debugging)
- [ ] **Comment Quality:** Functions missing JSDoc comments: [list files]

**Modern JavaScript Patterns:**

- [ ] **Can Use Optional Chaining:** [file] has null checks that could use `?.`
- [ ] **Can Use Nullish Coalescing:** [file] has `||` that should be `??`

---

## 📋 PHASE 5: Action Plan Summary

### Files Requiring Attention

<!-- AI Agent: Create actionable summary organized by file -->

**High Impact Files (Fix First):**

1. **[file-path]** - [count] critical issues: [brief summary]
2. **[file-path]** - [count] critical issues: [brief summary]
3. **[file-path]** - [count] critical issues: [brief summary]

**Medium Impact Files:**

1. **[file-path]** - [count] medium issues: [brief summary]
2. **[file-path]** - [count] medium issues: [brief summary]

**Low Impact Files:**

1. **[file-path]** - [count] minor issues: [brief summary]

### Estimated Cleanup Impact

**🎯 REALISTIC IMPACT ASSESSMENT:**

- **Lines of Code Reducible:** ~50-150 lines (mostly from unused utility functions and console statements)
- **Files Deletable:** ~0-2 files (most files serve a purpose even if exports aren't used)
- **Dependencies Removable:** ~0 packages (most "unused" deps are actually build tools)
- **Dependencies Updatable:** ~3-5 patch updates (safe, backwards-compatible updates only)
- **Time Investment:** 30-60 minutes for actual improvements
- **Risk Level:** Very low (no configuration changes, only obvious dead code removal)

### Recommended Cleanup Order

1. **Fix Critical Issues** (Build/Type errors) - Est: [time]
2. **Remove Dead Code** (Unused imports/functions) - Est: [time]
3. **Improve Type Safety** (Replace any types, add annotations) - Est: [time]
4. **Optimize Performance** (Add memoization, fix hooks) - Est: [time]
5. **Clean Dependencies** (Remove unused, update outdated) - Est: [time]
6. **Reorganize Files** (Move misplaced files, rename) - Est: [time]

---

## 🚀 PHASE 6: Handoff to Implementation

### Task Template Data Package

<!-- AI Agent: Format this data to pass to task_template.md -->

**Task Title:** "Comprehensive Codebase Cleanup - [Template Name]"

**Goal Statement:**
Clean up [template-name] codebase by removing genuinely unused utility functions, cleaning console.log statements from production code, and applying safe patch updates to dependencies. Focus on actual improvements without breaking working configurations.

**⚠️ REALISTIC EXPECTATIONS:**

- Most "unused exports" will be intentional (UI libraries, type definitions, template completeness)
- Most dependencies marked as "unused" by depcheck are actually used by build tools
- Configuration files (tsconfig.json, eslint.config.mjs) should remain untouched
- Target: 30-60 minutes of actual cleanup work, not hours of configuration changes

**High-Level Changes Required:**

**✅ REALISTIC SCOPE:**

- Remove genuinely unused utility functions (typically 5-10 functions from lib/ files)
- Clean console.log statements from production code (typically 5-15 statements)
- Apply safe patch updates to dependencies (no major version bumps without evaluation)
- Keep intentional template features (comprehensive type definitions, UI component variants)

**❌ AVOID OVER-CLEANUP:**

- Don't remove "unused" exports that are part of library patterns
- Don't modify working TypeScript/ESLint configurations
- Don't treat comprehensive type definitions as "bloat"
- Don't remove build tool dependencies marked as "unused" by depcheck

**Files to Modify:** [List of all files needing changes]

**Tools/Dependencies to Add/Remove:** [Specific package changes]

**Validation Checklist:**

- [ ] `npm run lint` passes (warnings are acceptable, 0 errors required)
- [ ] `npm run type-check` passes with 0 errors
- [ ] All imports resolve correctly (verified through type-check)
- [ ] No actually missing dependencies (scripts run without errors)
- [ ] No console.log statements remain in production code
- [ ] Unused exports removed only from utility files (not configuration or UI libraries)
- [ ] **🚨 NEVER:** Modify tsconfig.json, eslint.config.mjs, or package.json scripts
- [ ] **🚨 NEVER:** Run build commands during development cleanup

### User Review & Feedback Section

<!-- User fills this out after reviewing the findings -->

**Approved Changes:**

- [ ] Fix all critical issues automatically
- [ ] Remove all detected unused code
- [ ] Fix all type issues
- [ ] Apply all performance optimizations
- [ ] Clean all dependencies
- [ ] Reorganize all files

**Modifications Requested:**

- [ ] Skip certain files: [list files to exclude]
- [ ] Keep certain "unused" code: [list code to preserve]
- [ ] Don't update certain dependencies: [list packages to exclude]
- [ ] Different organization approach: [specify preferences]

**Additional Instructions:**
[Any specific guidance or preferences for the cleanup implementation]

---

## 📁 Generated Files & Reports

### Analysis Output Files

- `cleanup-analysis-report.md` - Full detailed findings
- `unused-code-report.txt` - Depcheck and unused exports output
- `type-issues-report.txt` - TypeScript strict mode violations
- `bundle-analysis/` - Bundle analyzer output
- `dependency-updates.json` - npm-check-updates findings

### Next Steps

1. **Review this analysis** and provide feedback in the "User Review & Feedback Section"
2. **Analysis will be fed to task_template.md** to create implementation task
3. **Implementation task will execute** the approved cleanup changes
4. **Validation will confirm** all changes work correctly
