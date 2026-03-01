# Epic-Based Pipeline Design

> Working design notes — not yet implemented.
> Last updated: 2026-02-27

---

## Core Philosophy

- **Brief** — immutable north star. Never touched after creation. Describes destination, not path.
- **Epics** — living knowledge documents. One per vertical slice of user value. Enriched over time.
- **Phases** — unchanged inner loop. Always belong to exactly one Epic. Strictly numeric, incrementing.
- **STATUS.md** — rear-view mirror. Running log of what has been built.

---

## The Step Flow (revised)

```
... → BUILD → REVIEW → FIX → REFLECT → NEXT → [phase N+1] → SPEC → RESEARCH → PLAN → BUILD → ...
```

### REFLECT (backward only)
- Writes verbose `REFLECTIONS.md` as today (unchanged)
- NEW: also updates the current Epic's `## Remaining Work` section if anything was
  left undone, deferred, or out of scope
- Does NOT look forward. Does not plan. Logs and stops.

### NEXT (forward pointer, not a planner)
- Reads: current Epic (freshly updated by reflect), STATUS.md, REFLECTIONS.md
- Writes: `docs/phases/phase-N+1/NEXT.md` — a short steering suggestion
- Two forms it ever takes:

  **Still on current Epic:**
  ```
  Epic: epic-1-auth.md
  Status: in-progress
  Focus: Remaining Work has 3 items. Token refresh and logout were deferred.
         Session persistence had a bug — see REFLECTIONS.md §3.
  ```

  **Epic complete:**
  ```
  Epic: epic-1-auth.md
  Status: complete
  Next: epic-2-dashboard.md
  Note: All acceptance criteria met. No carry-over.
  ```

- NEXT never decomposes work or makes implementation decisions. It only points.

### SPEC (reads NEXT.md, loads one Epic, scopes the chunk)
- Reads NEXT.md first → knows which Epic to load
- Reads Brief + that single Epic
- Makes its own scoping decisions about what chunk to build this phase
- **No cross-epic phases ever** — one phase, one Epic, clean ownership

---

## Epic Document Structure

```markdown
# Epic N: [Name]

## Goal
What this Epic is trying to achieve and why it matters to the user.
Each Epic is a vertical slice — user-testable, delivers standalone value.
No "backend setup" or "API layer" — a real user capability.

## Acceptance Criteria
What "done" looks like. User-facing, testable statements.

## Research & Decisions
Enriched over time. Libraries chosen, architectural decisions made,
things learned from internet research. Written here so future phases
don't re-discover them.

## Completed Work
- Phase 1: [what was delivered]
- Phase 2: [what was delivered]

## Remaining Work
← Reflect writes here each phase.
Specific, actionable items that were deferred, out of scope, or partially done.
When this section is empty, the Epic is done.
```

---

## Key Constraints

- **One Epic per phase** — SPEC never works across Epic boundaries
- **Epics are vertical slices** — each one is a user-testable deliverable
- **Epics grow smarter** — research and decisions accumulate here, not lost between phases
- **Reflect writes back** — the Epic is the living record; REFLECTIONS.md is verbose audit trail
- **NEXT is a pointer** — it identifies which Epic and what state, never implements

---

## Epic Creation and Grooming

### The Vertical Slice Constraint
Each Epic must be a user-testable deliverable — real user value, not an
architectural layer. "Backend setup" and "API layer" are not Epics.
"User can log in and manage their profile" is an Epic.

Claude defaults to architectural phases because it pattern-matches on how
software is built, not how value is delivered. GROOM corrects this by scoping
research to a single user-facing capability at a time.

### The GROOM Step

Added to workflow as the first step of each phase, with a skip condition:
skip if a groomed Epic already exists for this phase (i.e. NEXT.md points
to an in-progress Epic that is already groomed and ready).

**Triggers:**
- Phase 1, no Epics exist yet → bootstrap mode
- NEXT.md declared previous Epic complete → transition mode

**Bootstrap mode** (first run, no Epics):
1. Reads Brief
2. Derives all Epics as draft stubs — Goal + Acceptance Criteria only, properly
   sized as vertical slices
3. Does internet research scoped to Epic 1's specific problem space
4. Fully grooms Epic 1 (populates Research & Decisions, refines Acceptance Criteria)
5. Remaining Epics stay as drafts until their turn

**Transition mode** (Epic N just completed):
1. Reads Brief + all existing Epics (to understand what's already planned)
2. If next draft Epic exists → groom it (research + refine)
3. If no more Epics and nothing left in Brief → write exit signal → pipeline stops

**Exit condition:**
GROOM finds no draft Epics and cannot derive new ones from the Brief.
This is now the canonical "PROJECT COMPLETE" signal, replacing the old
REFLECTIONS.md first-line check.

### Grooming Trigger in workflow.yaml
Grooming skips when a ready Epic exists for the current phase. Needs a
`skip_if` condition (inverse of current `skip_unless`) — small engine change,
or implementable via a sentinel file NEXT.md writes when pointing to an
already-groomed Epic.

### Human Re-entry
The pipeline exits cleanly when Epics are exhausted. The human can return
at any time — a week, a month later — and add new Epics to `docs/epics/`.
Epics auto-increment (epic-4.md, epic-5.md, etc.). On next run, GROOM sees
a draft Epic, grooms it, and the pipeline continues exactly where it should.

Human-authored Epics can be as rough as a title and a goal sentence.
GROOM fills in the research and detail. Or they can be fully pre-written
if the human already knows what they want — GROOM will recognize it's
already groomed and proceed.

### Complete Human Lifecycle
1. Write BRIEF.md
2. Run `cc-pipeline run`
3. Pipeline creates Epics, runs phases, keeps going until no Epics remain
4. Human comes back, adds one or more new Epics
5. Run `cc-pipeline run` again — pipeline resumes, picks up new Epics
6. Repeat indefinitely

The human never touches phase numbers. Never re-reads the Brief to figure
out "where were we." Just adds Epics when they have new work to do.

---

## Implementation Notes

### 1. `skip_if` vs `skip_unless`
The engine currently only skips a step when a file is absent (`skip_unless`).
GROOM needs the inverse — skip when a groomed Epic already exists for this phase.
Add `skip_if` as a workflow.yaml field alongside `skip_unless`.

### 2. Epic numbering when human adds them
Humans writing Epics manually need to know the next number. Options:
- **Manual** — human writes `epic-4.md` themselves (fine to start with)
- **CLI command** — `cc-pipeline add-epic` handles numbering and scaffolds
  the stub with the correct structure

Start with manual naming, add the command later when the pattern is proven.
