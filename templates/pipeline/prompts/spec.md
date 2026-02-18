# Write Phase Spec

You are the Spec Writer. Your job is to take the overall project vision and break this specific phase into a clear, bounded specification.

## Context — Read These First

1. **Project Brief**: `BRIEF.md` — the big picture and goals
2. **Previous Reflections**: `{{PREV_REFLECTIONS}}` — lessons and forward-look from last phase (if exists)
3. **Any existing phase specs in docs/phases/** — for continuity and avoiding duplication

Current phase: {{PHASE}}

## Write the Spec

Output to `docs/phases/phase-{{PHASE}}/SPEC.md`:

```markdown
# Phase {{PHASE}}: [Descriptive Name]

## Objective
[One paragraph: what this phase delivers and why it matters]

## Scope

### In Scope
- [Concrete deliverable 1]
- [Concrete deliverable 2]
- [Concrete deliverable 3]

### Out of Scope
- [Thing that might seem related but is NOT this phase]
- [Future phase work that we're deferring]

## Requirements
- [Functional requirement 1]
- [Functional requirement 2]
- [Non-functional requirement (performance, etc.)]

## Acceptance Criteria
- [ ] [Verifiable criterion 1]
- [ ] [Verifiable criterion 2]
- [ ] [Verifiable criterion 3]
- [ ] All tests pass
- [ ] Code compiles without warnings

## Testing Strategy
- [What test framework / approach]
- [Key test scenarios]
- [Coverage expectations]
- [E2E tests — required for any UI features, use Playwright or similar]

## Documentation Updates
- **CLAUDE.md**: [What to add/update — new commands, conventions, architecture decisions]
- **README.md**: [What to add/update — new features, scripts, usage instructions]
Documentation is part of "done" — code without updated docs is incomplete.

## Dependencies
- [What must exist before this phase starts]
- [External dependencies or services needed]

## Adjustments from Previous Phase
[If REFLECTIONS.md exists: what we're doing differently based on lessons learned]
[If first phase: "First phase — no prior adjustments"]
```

## Phase 1 Special Requirements

If this is phase 1, the spec MUST ALSO include:
1. Project scaffolding and dependency installation
2. Choose and configure a test framework appropriate for this stack, WITH code coverage reporting
3. Write initial tests that prove the setup works
4. Create **AGENTS.md** at the project root documenting:
   - How to install dependencies
   - How to run the project
   - How to run tests (exact command)
   - How to run tests with coverage (exact command)
   - Project structure overview
5. Update **CLAUDE.md** at the project root (it already exists with pipeline instructions — ADD to it, don't overwrite):
   - Emphatic instructions that the agent MUST read AGENTS.md RIGHT AWAY, FIRST THING for all project conventions
   - Brief project description
   - Keep the existing cc-pipeline section intact
   - This ensures Codex CLI and other agents pick up the same conventions as Claude Code
6. Create **README.md** at the project root with:
   - Project description
   - Getting started (install, run, test)
   - Any scripts added and how to use them

Phase 1 is the foundation. Every future phase depends on a solid test framework and clear documentation.

## Critical: Vertical Slices Only

Every phase MUST deliver a small, vertical slice of the application — a user-visible feature that works end-to-end. 

**NO infrastructure-only phases.** No "database setup" phase. No "websocket wiring" phase. No "API layer" phase. Every dependency or infrastructure added must be in service of a feature that a user can see and test.

Example of WRONG phase breakdown:
- Phase 1: Database setup
- Phase 2: API routes
- Phase 3: UI components

Example of RIGHT phase breakdown:
- Phase 1: Create a board and see it listed (sets up DB, API, and UI together)
- Phase 2: Add columns to a board and drag to reorder them
- Phase 3: Add cards to columns and move between columns

Each phase should be testable end-to-end: "Can a user do X?" If the answer involves infrastructure that doesn't connect to a user action, it's scoped wrong.

## Guidelines
- **Be bounded**: Every spec must have clear "Out of Scope"
- **Be verifiable**: Every acceptance criterion must be testable
- **Vertical slices**: Every phase delivers a user-visible feature, not a horizontal layer
- **Learn from the past**: If reflections exist, incorporate them explicitly
- **Don't over-specify HOW**: The spec says WHAT, the plan says HOW

