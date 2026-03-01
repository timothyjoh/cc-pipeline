---
date: 2026-02-27T17:17:19Z
researcher: Claude
git_commit: 09b1425
branch: master
repository: cc-pipeline
topic: "Epic-Based Pipeline Design — Current State vs. Proposed Design"
tags: [research, codebase, epics, workflow, engine, pipeline-design]
status: complete
last_updated: 2026-02-27
last_updated_by: Claude
---

# Research: Epic-Based Pipeline Design — Current State vs. Proposed Design

**Date**: 2026-02-27T17:17:19Z
**Researcher**: Claude
**Git Commit**: 09b1425
**Branch**: master
**Repository**: cc-pipeline

## Research Question
Using `docs/epic-pipeline-design.md` as a reference, document the current state of the cc-pipeline codebase and how it relates to the proposed Epic-based pipeline design. What exists today, what is designed but not yet implemented, and what are the gaps?

## Summary

The `docs/epic-pipeline-design.md` document (dated 2026-02-27, marked "Working design notes — not yet implemented") proposes a significant restructuring of the pipeline around **Epics** — vertical slices of user value that replace the current simple phase-increment model. The current codebase has a fully functional 9-step linear pipeline with JSONL-based state, but **none of the Epic-specific features are implemented yet**. The design document identifies several engine changes needed (GROOM step, NEXT step, `skip_if` condition, Epic lifecycle tracking) and a new project completion mechanism.

## Detailed Findings

### 1. Current Step Flow vs. Proposed Step Flow

**Current (implemented):**
```
SPEC → RESEARCH → PLAN → BUILD → REVIEW → FIX → REFLECT → STATUS → COMMIT
```
- 9 steps per phase, defined in `templates/pipeline/workflow.yaml`
- All steps use `claudecode` agent except `commit` (can use `bash`)
- `fix` step has `skip_unless: "MUST-FIX.md"` — only runs if review found issues

**Proposed (from design doc):**
```
[GROOM →] SPEC → RESEARCH → PLAN → BUILD → REVIEW → FIX → REFLECT → NEXT → [phase N+1]
```
- Adds **GROOM** as first step (with skip condition)
- Adds **NEXT** between REFLECT and next phase
- Removes `status` and `commit` from the diagram (though these may persist as utility steps)
- REFLECT gains new responsibility: updating the current Epic's "Remaining Work" section

### 2. Project Completion Detection

**Current mechanism** (`src/engine.ts:114-126`):
- After each phase, engine reads previous phase's `REFLECTIONS.md`
- Tests first line against regex `/PROJECT COMPLETE/i`
- If match → logs `project_complete` event, exits cleanly
- Hardcoded `MAX_PHASES = 20` as safety limit

**Proposed mechanism** (from design doc):
- GROOM step becomes the canonical exit: when no draft Epics remain and GROOM cannot derive new ones from BRIEF, pipeline stops
- The `REFLECTIONS.md` first-line check would be replaced

### 3. Phase Steering / Inter-Phase Communication

**Current** (`src/engine.ts:209`):
- No inter-phase steering exists
- Phases simply increment: `phase++`
- SPEC step reads previous phase's `REFLECTIONS.md` via `{{PREV_REFLECTIONS}}` placeholder in prompts
- No NEXT.md file is created or read

**Proposed** (from design doc):
- New **NEXT step** writes `docs/phases/phase-N+1/NEXT.md`
- NEXT.md contains a structured pointer: which Epic, its status (in-progress/complete), and focus area
- SPEC step would read NEXT.md first to know which Epic to load
- One Epic per phase — no cross-epic phases ever

### 4. Skip Conditions

**Current** (`src/engine.ts:246-259`, `src/config.ts:66`):
- Only `skip_unless` is implemented
- Checks if a file exists in the phase output directory
- If file absent → step skipped with `step_skip` event
- Used by `fix` step: `skip_unless: "MUST-FIX.md"`

**Proposed** (from design doc, Implementation Notes §1):
- Needs `skip_if` — the inverse of `skip_unless`
- GROOM step would use `skip_if` to skip when a groomed Epic already exists for the current phase
- Design doc notes this as a "small engine change"

### 5. Epic Documents and Directory Structure

**Current**: No `docs/epics/` directory exists. No Epic files anywhere in the codebase.

**Proposed** (from design doc):
```
docs/epics/
├── epic-1-auth.md
├── epic-2-dashboard.md
└── epic-N-feature.md
```

Each Epic has a structured format:
- **Goal** — User-testable capability (vertical slice, not architectural layer)
- **Acceptance Criteria** — Testable statements
- **Research & Decisions** — Accumulated knowledge (enriched by GROOM)
- **Completed Work** — Per-phase deliverables
- **Remaining Work** — Deferred/out-of-scope items (written by REFLECT each phase)

### 6. GROOM Step

**Current**: Does not exist in code or workflow.

**Proposed** (from design doc):
- First step of each phase, with skip condition
- **Bootstrap mode** (phase 1, no Epics): derives all Epic stubs from BRIEF, does internet research for Epic 1, fully grooms Epic 1
- **Transition mode** (Epic N complete): reads all existing Epics, grooms next draft Epic
- **Exit condition**: no draft Epics and nothing new derivable from BRIEF → "PROJECT COMPLETE"

### 7. REFLECT Step Changes

**Current** (`templates/pipeline/prompts/reflect.md`):
- Writes verbose `REFLECTIONS.md` with What Went Well, What Didn't Work, Spec vs Reality, Looking Forward sections
- "PROJECT COMPLETE" as first line when all BRIEF goals met

**Proposed additions** (from design doc):
- Also updates the current Epic's `## Remaining Work` section
- Does NOT look forward or plan — only logs and stops
- The "Looking Forward" responsibility moves to the NEXT step

### 8. BRIEF.md Role

**Current**: BRIEF.md is the primary input document; SPEC reads it each phase; REFLECT checks if all BRIEF goals are met.

**Proposed**: BRIEF.md becomes an "immutable north star" — never touched after creation. Epics become the living knowledge documents. BRIEF describes destination; Epics describe the path.

### 9. Human Re-entry and Lifecycle

**Current**: No mechanism for incremental human input beyond editing BRIEF.md and restarting.

**Proposed** (from design doc):
1. Human writes BRIEF.md
2. Pipeline creates Epics, runs phases until no Epics remain
3. Human returns later, adds new `docs/epics/epic-N.md` files
4. Pipeline resumes, picks up new Epics
5. Repeat indefinitely
- Epics auto-increment; human never touches phase numbers
- Manual naming to start (`epic-4.md`), CLI command (`cc-pipeline add-epic`) planned for later

### 10. Templates Already Referencing Epics

**File**: `templates/CLAUDE.md` already contains user-facing documentation about the Epic workflow (lines 48-87), describing:
- How to create Epic files at `docs/epics/epic-N.md`
- The vertical slice constraint
- The GROOM step enrichment concept
- The pipeline lifecycle with Epics

This represents the **intended user experience** documented ahead of implementation.

## Code References

| Area | File | Lines | Description |
|------|------|-------|-------------|
| Main loop | `src/engine.ts` | 113-222 | Phase iteration, step execution |
| PROJECT COMPLETE check | `src/engine.ts` | 114-126 | REFLECTIONS.md first-line regex |
| skip_unless implementation | `src/engine.ts` | 246-259 | File existence check |
| Config normalization | `src/config.ts` | 44-66 | YAML to camelCase fields |
| Prompt generation | `src/prompts.ts` | — | {{PHASE}}, {{BRIEF}}, {{PREV_REFLECTIONS}} substitution |
| REFLECT prompt | `templates/pipeline/prompts/reflect.md` | — | Current reflection format |
| Workflow definition | `templates/pipeline/workflow.yaml` | — | 9-step workflow, no groom/next |
| CLAUDE.md (Epic docs) | `templates/CLAUDE.md` | 48-87 | User-facing Epic instructions |
| Epic design document | `docs/epic-pipeline-design.md` | 1-183 | Full design specification |

## Architecture Documentation

### Current Architecture
- **Linear phase model**: phases increment 1, 2, 3... with no steering
- **9 fixed steps**: spec → research → plan → build → review → fix → reflect → status → commit
- **JSONL state**: append-only event log, no separate state file
- **3 agent types**: claudecode (SDK), codex (OpenAI CLI), bash (shell)
- **Simple exit**: "PROJECT COMPLETE" string in REFLECTIONS.md

### Proposed Architecture (Epic-Based)
- **Epic-driven phase model**: phases belong to Epics; NEXT step steers between phases
- **Additional steps**: GROOM (first, conditional), NEXT (after reflect)
- **New skip condition**: `skip_if` needed for GROOM's conditional execution
- **Epic lifecycle**: draft → groomed → in-progress → complete
- **New exit**: GROOM finds no more work → canonical completion signal
- **Living documents**: Epics accumulate knowledge; REFLECT writes back to them

## Implementation Gap Summary

| Feature | Current | Needed | Effort Estimate |
|---------|---------|--------|-----------------|
| `skip_if` engine support | Not implemented | Small engine change | Low |
| GROOM step + prompt | Not implemented | New step, prompt template, Epic bootstrap logic | High |
| NEXT step + prompt | Not implemented | New step, prompt template, NEXT.md format | Medium |
| Epic directory/files | Not implemented | Directory structure, file format validation | Low |
| REFLECT → Epic updates | Not implemented | Modify reflect prompt to write back to Epic | Medium |
| PROJECT COMPLETE via GROOM | Not implemented | Replace REFLECTIONS.md check with GROOM exit | Medium |
| `cc-pipeline add-epic` command | Not implemented | CLI command for scaffolding Epics | Low |
| SPEC reads NEXT.md | Not implemented | Modify spec prompt to load Epic via NEXT.md | Low |

## Open Questions

1. **Step ordering**: The design shows `REFLECT → NEXT` but doesn't mention where `status` and `commit` fit — do they remain after NEXT, or are they folded into other steps?
2. **GROOM skip mechanism**: Should `skip_if` check for a sentinel file written by NEXT, or should it inspect Epic file contents to determine if grooming is needed?
3. **Epic validation**: Should the engine validate Epic file structure, or is that purely the GROOM step's responsibility?
4. **Backward compatibility**: Can existing pipelines (without Epics) continue working with the old REFLECTIONS.md completion signal, or does the Epic model fully replace it?
5. **Multi-phase Epics**: How does the engine track which Epic a phase belongs to? Is this stored in JSONL events, or inferred from NEXT.md at runtime?
