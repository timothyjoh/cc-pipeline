# Epic-Based Pipeline Implementation Plan

## Overview

Restructure cc-pipeline around **Epics** — vertical slices of user value that replace the current linear phase-increment model. The pipeline will automatically bootstrap Epics from BRIEF.md, groom them with research, execute them one at a time across phases, and steer between phases using a NEXT step.

**Reference**: `docs/epic-pipeline-design.md` (full design spec)
**Research**: `docs/2026-02-27-epic-pipeline-design-research.md` (gap analysis)

## Current State

- 9-step linear pipeline: SPEC → RESEARCH → PLAN → BUILD → REVIEW → FIX → REFLECT → STATUS → COMMIT
- Phases increment linearly (`phase++`) with no steering
- Project completion detected via `PROJECT COMPLETE` string in `REFLECTIONS.md` first line
- No Epic files, no `docs/epics/` directory, no GROOM or NEXT steps
- `templates/CLAUDE.md` already documents the intended Epic workflow (lines 65-94)

## Desired End State

- 11-step Epic-driven pipeline: GROOM → SPEC → RESEARCH → PLAN → BUILD → REVIEW → FIX → REFLECT → NEXT → STATUS → COMMIT
- GROOM bootstraps all Epics from BRIEF on first run, grooms next draft Epic on transitions
- NEXT writes a steering pointer (`NEXT.md`) telling the next phase which Epic to work on
- REFLECT writes backward only; also updates Epic's `## Remaining Work` section
- SPEC reads NEXT.md to load the correct Epic, scopes work within that single Epic
- Project completion: GROOM finds no draft Epics and cannot derive new ones → exits cleanly
- Human can add new Epics at any time by dropping files in `docs/epics/`

**Verification**: Run `cc-pipeline run` on a fresh project with a BRIEF.md. Phase 1 should: create `docs/epics/` with multiple Epic stubs, fully groom Epic 1, then proceed through SPEC→...→NEXT. Phase 2 should: GROOM skips (via prompt logic), SPEC reads NEXT.md and loads the correct Epic.

## What We're NOT Doing

- No `skip_if` engine support — GROOM handles its own skip logic in the prompt
- No backward compatibility mode — this is a full replacement of the old model
- No `cc-pipeline add-epic` CLI command (manual file creation first, command later)
- No JSONL Epic tracking — Epic-to-phase association inferred from NEXT.md at runtime
- No changes to agent types (claudecode, bash, codex)
- No changes to TUI rendering
- No changes to retry logic, signal handling, or usage tracking

## Implementation Approach

Four phases, ordered by dependency. Each phase produces testable changes.

---

## Phase 1: Prompt Infrastructure + GROOM Step

### Overview

Add new prompt placeholders to `prompts.ts`, create the GROOM prompt template, and insert the GROOM step into `workflow.yaml`.

### Changes Required

#### 1. Prompt Placeholder Expansion

**File**: `src/prompts.ts`
**Changes**: Add three new placeholders after the existing `{{BRIEF}}` substitution (line 42):

```typescript
// Substitute {{NEXT}} — contents of previous phase's NEXT.md (if exists)
let nextContent = '';
if (phase > 1) {
  const prevNextPath = join(projectDir, config.phasesDir, `phase-${phase - 1}`, 'NEXT.md');
  if (existsSync(prevNextPath)) {
    nextContent = readFileSync(prevNextPath, 'utf-8');
  }
}
prompt = prompt.replace(/\{\{NEXT\}\}/g, nextContent);

// Substitute {{EPIC}} — contents of the Epic file referenced in NEXT.md
// Parses "Epic: epic-N-name.md" from NEXT content to find the file
let epicContent = '';
if (nextContent) {
  const epicMatch = nextContent.match(/^Epic:\s*(.+\.md)/m);
  if (epicMatch) {
    const epicPath = join(projectDir, 'docs', 'epics', epicMatch[1].trim());
    if (existsSync(epicPath)) {
      epicContent = readFileSync(epicPath, 'utf-8');
    }
  }
}
prompt = prompt.replace(/\{\{EPIC\}\}/g, epicContent);

// Substitute {{ALL_EPICS}} — concatenated contents of all docs/epics/*.md files
let allEpics = '';
const epicsDir = join(projectDir, 'docs', 'epics');
if (existsSync(epicsDir)) {
  const files = readdirSync(epicsDir).filter(f => f.endsWith('.md')).sort();
  allEpics = files.map(f => {
    const content = readFileSync(join(epicsDir, f), 'utf-8');
    return `--- ${f} ---\n${content}`;
  }).join('\n\n');
}
prompt = prompt.replace(/\{\{ALL_EPICS\}\}/g, allEpics);
```

Also add `readdirSync` to the import from `node:fs`.

#### 2. GROOM Prompt Template

**File**: `templates/pipeline/prompts/groom.md` (NEW)

```markdown
# Epic Grooming

You are the Groom Agent. Your job is to ensure a groomed Epic is ready
for this phase. You operate in one of three modes:

## Context — Read These First

1. **Project Brief**: `BRIEF.md` — the immutable north star
2. **Previous NEXT.md**: {{NEXT}}
3. **All existing Epics**: Read every file in `docs/epics/` (if the directory exists)
4. **STATUS.md** (if it exists) — what has been built so far

Current phase: {{PHASE}}

## Determine Your Mode

### Mode 1: Bootstrap (Phase 1, no Epics exist)

If `docs/epics/` doesn't exist or is empty:

1. Read BRIEF.md thoroughly
2. Decompose the project into Epics — each one a vertical slice of
   user-testable value. NOT architectural layers.
   - WRONG: "Epic 1: Database setup", "Epic 2: API layer"
   - RIGHT: "Epic 1: User can sign up and log in", "Epic 2: User can create and view dashboards"
3. Create `docs/epics/` directory
4. Write ALL Epics as draft stubs (Goal + Acceptance Criteria only):
   ```markdown
   # Epic N: [Name]

   ## Goal
   [What the user can do when this Epic is complete]

   ## Acceptance Criteria
   - [ ] [Testable outcome 1]
   - [ ] [Testable outcome 2]
   ```
5. For Epic 1 ONLY — do internet research scoped to its specific problem
   space. Populate its `## Research & Decisions` section with findings:
   libraries chosen, architectural decisions, patterns to follow.
6. Refine Epic 1's Acceptance Criteria based on research.
7. Write `docs/epics/epic-1-[name].md` as the fully groomed version.

Size guidance: Each Epic should feel like 2–4 phases of work. If it's
bigger, split it. If it's a single-phase task, merge it into a larger Epic.

### Mode 2: Transition (previous Epic marked complete)

If the previous phase's NEXT.md says `Status: complete`:

1. Read Brief + all existing Epics to understand context
2. Find the next draft Epic (has Goal + Acceptance Criteria but no
   Research & Decisions section, or the section is empty)
3. Do internet research scoped to that Epic's specific problem space
4. Populate its `## Research & Decisions` section
5. Refine its Acceptance Criteria based on research
6. If no draft Epics remain and nothing new can be derived from Brief:
   - Write "PROJECT COMPLETE" to `docs/phases/phase-{{PHASE}}/GROOM.md`
   - You're done. The pipeline will detect this and stop.

### Mode 3: Skip (current Epic is in-progress)

If the previous phase's NEXT.md says `Status: in-progress`:

The current Epic is already groomed and work continues on it.
Write a brief note to `docs/phases/phase-{{PHASE}}/GROOM.md`:

```markdown
# Groom: Phase {{PHASE}}

Skipped — Epic [name] is in-progress and already groomed.
```

Then stop. Do not modify any Epic files.

## Output

Write to `docs/phases/phase-{{PHASE}}/GROOM.md` with a summary of
what you did (which mode, what Epics were created/groomed, or why you skipped).

## Rules

- Each Epic MUST be a vertical slice — user-testable, standalone value
- Never create infrastructure-only Epics
- Only groom ONE Epic per phase (the next one in sequence)
- Don't modify already-completed Epics
- The Brief is immutable — read it, don't edit it
- Epic filenames: `epic-N-short-name.md` (e.g., `epic-1-auth.md`)
```

#### 3. Add GROOM to workflow.yaml

**File**: `templates/pipeline/workflow.yaml`
**Changes**: Insert GROOM as the first step:

```yaml
steps:
  - name: groom
    description: "Bootstrap or groom the next Epic"
    agent: claudecode
    prompt: prompts/groom.md
    output: "GROOM.md"

  - name: spec
    # ... rest unchanged
```

### Success Criteria

#### Automated Verification:
- [ ] `npm test` passes
- [ ] TypeScript compiles: `npx tsx --version` (no type errors)
- [ ] New file exists: `templates/pipeline/prompts/groom.md`
- [ ] `workflow.yaml` has `groom` as first step

#### Manual Verification:
- [ ] Run `cc-pipeline init` in a test project — `.pipeline/prompts/groom.md` is scaffolded
- [ ] Run `cc-pipeline run --phases 1` on a fresh project with BRIEF.md — GROOM creates `docs/epics/` with Epic stubs and a fully groomed Epic 1

---

## Phase 2: NEXT Step

### Overview

Add the NEXT step after REFLECT, which writes a steering pointer for the next phase.

### Changes Required

#### 1. NEXT Prompt Template

**File**: `templates/pipeline/prompts/next.md` (NEW)

```markdown
# Phase Steering — NEXT

You are the Steering Agent. Your ONLY job is to write a short pointer
telling the next phase which Epic to work on and what its current status is.

You do NOT plan, decompose, or make implementation decisions. You only point.

## Context — Read These First

1. **Current Epic**: Find which Epic this phase worked on by reading
   `docs/phases/phase-{{PHASE}}/SPEC.md` (it references the Epic)
2. **That Epic's file** in `docs/epics/` — check its Remaining Work section
3. **REFLECTIONS.md**: `docs/phases/phase-{{PHASE}}/REFLECTIONS.md`
4. **STATUS.md** (if it exists)
5. **All Epics**: List `docs/epics/` to know what exists

Current phase: {{PHASE}}

## Write NEXT.md

Output to `docs/phases/phase-{{PHASE}}/NEXT.md`.

### If the current Epic still has Remaining Work:

```
Epic: [filename, e.g. epic-1-auth.md]
Status: in-progress
Focus: [Brief summary of what remains — pulled from Epic's Remaining Work section]
```

### If the current Epic's Remaining Work is empty (all criteria met):

```
Epic: [filename of completed epic]
Status: complete
Next: [filename of next draft epic, e.g. epic-2-dashboard.md]
Note: All acceptance criteria met. No carry-over.
```

If no next draft Epic exists, write:
```
Epic: [filename of completed epic]
Status: complete
Next: none
Note: All Epics complete. GROOM will verify on next phase.
```

## Rules

- NEXT.md is 3-5 lines. Never longer.
- Never decompose work or suggest implementation approaches.
- Never modify Epic files — that's REFLECT's job.
- One Epic per phase, always. If the current Epic is done, point to the next draft.
- "Draft" means: has Goal + Acceptance Criteria but Research & Decisions is empty or missing.
```

#### 2. Add NEXT to workflow.yaml

**File**: `templates/pipeline/workflow.yaml`
**Changes**: Insert NEXT step after `reflect`, before `status`:

```yaml
  - name: reflect
    description: "Look back at what happened this phase"
    agent: claudecode
    prompt: prompts/reflect.md
    output: "REFLECTIONS.md"

  - name: next
    description: "Write steering pointer for next phase"
    agent: claudecode
    prompt: prompts/next.md
    output: "NEXT.md"

  - name: status
    # ... unchanged
```

### Success Criteria

#### Automated Verification:
- [ ] `npm test` passes
- [ ] New file exists: `templates/pipeline/prompts/next.md`
- [ ] `workflow.yaml` has `next` step between `reflect` and `status`

#### Manual Verification:
- [ ] After a full phase run, `docs/phases/phase-N/NEXT.md` exists with correct 3-5 line format
- [ ] NEXT.md correctly identifies the current Epic and its status

---

## Phase 3: Update REFLECT and SPEC Prompts

### Overview

Modify REFLECT to write backward only (remove forward-looking) and update Epic's Remaining Work. Modify SPEC to read NEXT.md and load the correct Epic.

### Changes Required

#### 1. Update REFLECT Prompt

**File**: `templates/pipeline/prompts/reflect.md`
**Changes**:

1. Remove the entire "## Looking Forward" section (lines 46-63 of current template) — that responsibility moves to NEXT
2. Add Epic update instructions after the Looking Back section:

Replace the current output template with:

```markdown
# Phase Reflection

You are a Reflection Agent. Your job is to look backward at what happened
in this phase. You do NOT look forward — that's the NEXT step's job.

## Context — Read These First

1. **SPEC.md**: `docs/phases/phase-{{PHASE}}/SPEC.md` — what we intended to build
2. **PLAN.md**: `docs/phases/phase-{{PHASE}}/PLAN.md` — how we planned to build it
3. **RESEARCH.md**: `docs/phases/phase-{{PHASE}}/RESEARCH.md` — what the codebase looked like before
4. **REVIEW.md**: `docs/phases/phase-{{PHASE}}/REVIEW.md` — what the reviewers found
5. **Project Brief**: `BRIEF.md` — the full project goals
6. **Current Epic**: Find which Epic this phase worked on from the SPEC, then read
   that Epic file in `docs/epics/`

Current phase: {{PHASE}}

Also run `git log --oneline -15` to see what actually changed.

## Task 1: Write the Reflection

Output to `docs/phases/phase-{{PHASE}}/REFLECTIONS.md`:

```markdown
# Reflections: Phase {{PHASE}}

## What Went Well
- [Thing that worked, with evidence]
- [Process that was effective]

## What Didn't Work
- [Problem encountered]: [what happened and why]
- [Bad assumption]: [what we got wrong]

## Spec vs Reality
- **Delivered as spec'd**: [list items completed per SPEC]
- **Deviated from spec**: [what changed and why]
- **Deferred**: [what was in scope but got pushed out, and why]

## Review Findings Impact
- [Key finding from REVIEW.md]: [how it was addressed]

## Technical Debt
- [Shortcut taken that needs future attention]: `file:line`
- [Known issue deferred]: [description]
```

## Task 2: Update the Epic's Remaining Work

After writing REFLECTIONS.md, update the current Epic file in `docs/epics/`:

1. Read the Epic's `## Acceptance Criteria` — check off any that are now met
2. Update `## Completed Work` — add a line for this phase:
   `- Phase {{PHASE}}: [brief summary of what was delivered]`
3. Update `## Remaining Work`:
   - List specific, actionable items that were deferred, partially done, or out of scope
   - If everything is done, clear this section (empty = Epic complete)
4. Do NOT modify the Epic's Goal, Research & Decisions, or Acceptance Criteria text
   (you may check off criteria, but don't rewrite them)

## Guidelines
- **Be honest** — don't sugarcoat failures
- **Be specific** — "Research step missed the existing helper in utils/" not "it was slow"
- **Be actionable** — every observation should suggest what to do differently
- **Backward only** — do NOT write recommendations for next phase. That's NEXT's job.
```

#### 2. Update SPEC Prompt

**File**: `templates/pipeline/prompts/spec.md`
**Changes**:

Update the Context section to read NEXT.md and the specific Epic:

Replace lines 1-12 with:

```markdown
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
```

Also add after "## Guidelines" (before the closing):

```markdown
- **One Epic, one phase**: Never scope work across Epic boundaries. If the Epic's
  Remaining Work has 5 items, pick a subset that fits one phase. NEXT told you the focus area.
- **Epic is your scope**: The Epic's Goal and Acceptance Criteria define what "done" means.
  Don't invent requirements outside the Epic.
```

### Success Criteria

#### Automated Verification:
- [ ] `npm test` passes
- [ ] reflect.md no longer contains "Looking Forward" section
- [ ] spec.md references `{{NEXT}}` and Epic loading

#### Manual Verification:
- [ ] After a phase run, REFLECTIONS.md has no forward-looking content
- [ ] After a phase run, the Epic file in `docs/epics/` has updated Completed Work and Remaining Work
- [ ] SPEC.md in phase 2+ references the correct Epic from NEXT.md

---

## Phase 4: Replace PROJECT COMPLETE Detection

### Overview

Change the engine to detect completion via GROOM's exit signal instead of the old REFLECTIONS.md first-line check.

### Changes Required

#### 1. Update Engine Completion Check

**File**: `src/engine.ts`
**Changes**: Replace lines 114-126 (the REFLECTIONS.md check) with a GROOM.md check:

```typescript
// Check for PROJECT COMPLETE (from GROOM step)
if (phase > 1) {
  const prevPhaseDir = join(projectDir, config.phasesDir, `phase-${phase - 1}`);
  // Legacy: check REFLECTIONS.md (for pipelines mid-migration)
  const reflectFile = join(prevPhaseDir, 'REFLECTIONS.md');
  if (existsSync(reflectFile)) {
    const firstLine = readFileSync(reflectFile, 'utf8').split('\n')[0];
    if (firstLine && /PROJECT COMPLETE/i.test(firstLine)) {
      appendEvent(logFile, { event: 'project_complete', phase: phase - 1 });
      log(`PROJECT COMPLETE detected in phase ${phase - 1} reflections.`);
      return;
    }
  }
}

// Check current phase's GROOM.md for completion signal
const currentPhaseDir = join(projectDir, config.phasesDir, `phase-${phase}`);
const groomFile = join(currentPhaseDir, 'GROOM.md');
if (existsSync(groomFile)) {
  const groomContent = readFileSync(groomFile, 'utf8');
  if (/PROJECT COMPLETE/i.test(groomContent)) {
    appendEvent(logFile, { event: 'project_complete', phase });
    log(`PROJECT COMPLETE — all Epics finished (detected by GROOM in phase ${phase}).`);
    return;
  }
}
```

Wait — the timing is important here. The GROOM step runs as the first step of a phase, so the GROOM.md file is written *during* the phase execution (via `runStep`). The completion check currently runs *before* any steps execute in the phase (line 114).

So the correct approach is: **check completion AFTER the GROOM step runs**, not before the phase starts. This means moving the check into the step loop.

**Revised approach**: Instead of a pre-phase check, check after each step completes. If the just-completed step is "groom" and GROOM.md contains "PROJECT COMPLETE", stop the pipeline.

Replace lines 114-126 with nothing (remove the pre-phase REFLECTIONS.md check). Then, inside the step loop (after line 193, the retry/failure block), add:

```typescript
// After GROOM step: check if it signaled project complete
if (stepDef.name === 'groom' && lastResult === 'ok') {
  const groomFile = join(projectDir, config.phasesDir, `phase-${phase}`, 'GROOM.md');
  if (existsSync(groomFile)) {
    const groomContent = readFileSync(groomFile, 'utf8');
    if (/PROJECT COMPLETE/i.test(groomContent)) {
      appendEvent(logFile, { event: 'project_complete', phase });
      log(`PROJECT COMPLETE — all Epics finished (detected by GROOM in phase ${phase}).`);
      pipelineEvents.emit('phase:done', { phase });
      return;
    }
  }
}
```

#### 2. Update REFLECT Prompt — Remove PROJECT COMPLETE Line

**File**: `templates/pipeline/prompts/reflect.md`
**Changes**: Already handled in Phase 3 — the new reflect.md doesn't write "PROJECT COMPLETE" as the first line. That responsibility moved to GROOM.

#### 3. Update Reflect Description in workflow.yaml

**File**: `templates/pipeline/workflow.yaml`
**Changes**: Update reflect step description:

```yaml
  - name: reflect
    description: "Look back at what happened this phase"
    # was: "Look back + look forward for next phase"
```

### Success Criteria

#### Automated Verification:
- [ ] `npm test` passes
- [ ] engine.ts no longer checks REFLECTIONS.md for PROJECT COMPLETE on line 120
- [ ] engine.ts checks GROOM.md after groom step completes

#### Manual Verification:
- [ ] When all Epics are complete, GROOM writes "PROJECT COMPLETE" to GROOM.md and pipeline stops
- [ ] Pipeline does not stop prematurely on phase 1 (no false completion signals)

---

## Testing Strategy

### Unit Tests
- `prompts.ts`: Test `{{NEXT}}`, `{{EPIC}}`, `{{ALL_EPICS}}` placeholder substitution
- `config.ts`: Test that `groom` and `next` steps parse correctly from workflow.yaml

### Integration Tests
- Fresh project init → run phase 1 → verify GROOM creates `docs/epics/` with stubs + groomed Epic 1
- Run phase 2 → verify GROOM skips, SPEC loads Epic from NEXT.md, REFLECT updates Epic
- Run until all Epics complete → verify GROOM signals PROJECT COMPLETE and pipeline stops

### Manual Testing Steps
1. Create a test project with a simple BRIEF.md (e.g., "Build a todo app with auth")
2. `cc-pipeline init && cc-pipeline run --phases 1`
3. Verify: `docs/epics/` created with 2-4 Epic stubs, Epic 1 fully groomed
4. Verify: `docs/phases/phase-1/GROOM.md` summarizes bootstrap
5. `cc-pipeline run --phases 1` (phase 2)
6. Verify: GROOM.md says "skipped", NEXT.md has 3-5 line pointer, REFLECTIONS.md has no forward section
7. Verify: Epic file updated with Completed Work and Remaining Work

## Migration Notes

This is a full replacement. Existing pipelines will need to:
1. Run `cc-pipeline update` to get new prompt templates and workflow.yaml
2. The engine will still check REFLECTIONS.md as a legacy fallback (Phase 4 keeps both checks temporarily)
3. First run after update: GROOM will bootstrap Epics from BRIEF.md

No data migration needed — JSONL log is append-only and new event types are additive.

## Performance Considerations

- GROOM step adds one AI call per phase (but skips quickly when Epic is in-progress)
- NEXT step adds one AI call per phase (lightweight — just reads files and writes 3-5 lines)
- `{{ALL_EPICS}}` placeholder reads all Epic files into the prompt — for large projects with many Epics, this could be substantial. Consider truncation if >50KB total.

## References

- Design document: `docs/epic-pipeline-design.md`
- Research: `docs/2026-02-27-epic-pipeline-design-research.md`
- Engine main loop: `src/engine.ts:113-222`
- PROJECT COMPLETE check: `src/engine.ts:114-126`
- Prompt generation: `src/prompts.ts:12-49`
- Workflow definition: `templates/pipeline/workflow.yaml`
- CLAUDE.md Epic docs: `templates/CLAUDE.md:65-94`
