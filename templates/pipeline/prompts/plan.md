# Create Implementation Plan for Phase

You are tasked with creating a detailed, actionable implementation plan for this phase. The SPEC defines WHAT to build. The RESEARCH documents the current codebase state. Your job is to create the HOW — a concrete task list with vertical slices.

## Context — Read These First (FULLY, no partial reads)

1. **Phase Spec**: `docs/phases/phase-{{PHASE}}/SPEC.md` — what we're building
2. **Phase Research**: `docs/phases/phase-{{PHASE}}/RESEARCH.md` — current codebase state
3. **Previous Reflections**: `{{PREV_REFLECTIONS}}` — lessons from last phase (if exists)

Current phase: {{PHASE}}

## Process

### Step 1: Analyze Inputs

- Read all documents fully
- Cross-reference the SPEC requirements with the RESEARCH findings
- Identify: what already exists that we can leverage, what's missing, what patterns to follow
- Note any open questions from RESEARCH that need resolving

### Step 2: Resolve Open Questions

- If RESEARCH.md has open questions, investigate them NOW
- **Do NOT write the plan with unresolved questions**
- Every decision must be made before finalizing

### Step 3: Design Vertical Slices

Break the phase into vertical slices — each slice:
- Delivers testable functionality end-to-end
- Can be verified via automated tests AND manual inspection
- Builds on the previous slice
- Includes both implementation AND tests

### Step 4: Write the Plan

Output to `docs/phases/phase-{{PHASE}}/PLAN.md`:

```markdown
# Implementation Plan: Phase {{PHASE}}

## Overview
[1-2 sentence summary of what this phase delivers]

## Current State (from Research)
[Brief summary of relevant findings — what exists, what patterns to follow]

## Desired End State
[What the codebase looks like after this phase is complete. How to verify it.]

## What We're NOT Doing
[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach
[High-level strategy and reasoning for the chosen approach]

---

## Task 1: [Descriptive Name]

### Overview
[What this task accomplishes]

### Changes Required
**File**: `path/to/file.ext`
**Changes**: [Summary with specific code snippets where helpful]

### Success Criteria
- [ ] Compiles/builds cleanly
- [ ] Tests pass
- [ ] [Specific verification]

---

## Task 2: [Descriptive Name]
[Same structure...]

---

## Testing Strategy

### Unit Tests
- [What to test, key edge cases]
- [Mocking strategy — prefer real implementations over heavy mocking]

### Integration/E2E Tests
- [End-to-end scenarios]

## Risk Assessment
- [Potential issue]: [mitigation]
```

## Important Guidelines

1. **Be Specific**: Include exact file paths, function signatures, and code snippets
2. **Be Practical**: Focus on incremental, testable changes
3. **Be Complete**: No open questions — every decision is made
4. **Vertical Slices**: Each task delivers testable functionality, not just "backend" or "frontend"
5. **Tests Are Required**: Every task includes test criteria
6. **Follow Existing Patterns**: Use the conventions found in RESEARCH.md
7. **Respect Scope**: What's in the SPEC is in scope. Everything else is explicitly NOT
8. **Anti-Mock Bias**: Prefer real implementations in tests. Flag where mocking is truly necessary
9. **Include "What We're NOT Doing"**: Prevent scope creep by being explicit

