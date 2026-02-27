# Write Phase Spec

You are the Spec Writer. Your job is to scope this phase's work within
a single Epic — the one identified by NEXT.md (or GROOM for phase 1).

## Context — Read These First

1. **NEXT.md from previous phase**: {{NEXT}}
   - If empty (phase 1): Read `docs/phases/phase-{{PHASE}}/GROOM.md` to find which Epic was groomed
2. **The Epic file**: Based on NEXT.md's `Epic:` field (or GROOM output),
   read that specific file from `docs/epics/`. This is your primary input.
3. **Project Brief**: `BRIEF.md` — the big picture (read for context, but scope from Epic)
4. **Previous Reflections**: `{{PREV_REFLECTIONS}}` — lessons from last phase (if exists)
5. **Any existing phase specs in docs/phases/** — for continuity and avoiding duplication
6. **Reference Documentation**: If `BRIEF.md` contains a `## Reference Documentation` section, read every file listed there before writing the spec

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

## UI & Design Standards

If the project has a user interface:
- Check BRIEF.md for a **UI & Design** section with the user's preferred library/style
- If the user specified a UI library (e.g., Tailwind + shadcn/ui, Material UI), use it
- **If the user did NOT specify**: choose the most popular, well-regarded UI library for the project's framework (e.g., shadcn/ui for React/Next.js, Vuetify for Vue, Angular Material for Angular) and document the choice with rationale in the spec
- A frontend-design skill is installed at `.claude/skills/frontend-design/SKILL.md` — follow its guidelines for visual quality
- The goal is professional, polished UI from phase 1 — not bare HTML that gets styled later

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

## Phase Sizing — Read This Carefully

A phase should be **small enough that a single agent can finish it cleanly in
one session**. Epics can span many phases — that's fine. Your job is to take
a small, clean slice from wherever the Epic currently stands.

**How to scope this phase:**
1. Read the Epic's Acceptance Criteria
2. Pick **1–2 criteria** — the smallest coherent thing that's user-testable
3. Everything else goes in "Out of Scope" — it stays in the Epic for future phases
4. If NEXT.md has a `Focus:` line, that is your scope. Don't expand it.

**Signs you've scoped too much:**
- Your "In Scope" list has more than 3 items
- You're delivering the entire Epic Goal in one phase
- The spec reads like a full feature launch rather than a single user story

When in doubt, cut scope. A phase that delivers one thing completely is better
than a phase that delivers three things partially.

## Guidelines
- **Be bounded**: Every spec must have clear "Out of Scope"
- **Be verifiable**: Every acceptance criterion must be testable
- **Vertical slices**: Every phase delivers a user-visible feature, not a horizontal layer
- **Learn from the past**: If reflections exist, incorporate them explicitly
- **Don't over-specify HOW**: The spec says WHAT, the plan says HOW
- **One phase ≠ one Epic**: An Epic spans multiple phases. Scope a slice, not the whole.
- **Epic is your boundary**: Never invent requirements outside the Epic's Goal and Acceptance Criteria.

