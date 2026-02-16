# Research Codebase for Phase

You are tasked with conducting comprehensive research across the codebase to understand its current state before implementation begins. This research feeds directly into the planning step.

## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY
- DO NOT suggest improvements or changes
- DO NOT perform root cause analysis
- DO NOT propose future enhancements
- DO NOT critique the implementation or identify problems
- ONLY describe what exists, where it exists, how it works, and how components interact
- You are creating a technical map/documentation of the existing system

## Context

Read these files first:
1. **Phase Spec**: `docs/phases/phase-{{PHASE}}/SPEC.md` — what we're building this phase
2. **Previous Reflections**: `{{PREV_REFLECTIONS}}` — lessons from last phase (if exists)
3. **Project architecture docs** — any existing CLAUDE.md, README.md, or docs/

Current phase: {{PHASE}}

## Steps

1. **Read the Phase SPEC.md fully** — understand what this phase requires
2. **If previous REFLECTIONS.md exists, read it** — note anything relevant to this phase
3. **Analyze the codebase relevant to this phase's SPEC**:
   - What existing code will this phase touch?
   - What patterns exist that we should follow?
   - What dependencies and integrations exist?
   - What test infrastructure is in place?
4. **Document everything with file paths and line numbers**

## Write the Research Document

Output to `docs/phases/phase-{{PHASE}}/RESEARCH.md`:

```markdown
# Research: Phase {{PHASE}}

## Phase Context
[What the SPEC asks us to build, in one paragraph]

## Previous Phase Learnings
[Key points from REFLECTIONS.md that affect this phase, or "First phase — no prior reflections"]

## Current Codebase State

### Relevant Components
- [Component/area]: [description] — `path/to/file:line`

### Existing Patterns to Follow
- [Pattern name]: [how it works, with file references]
- [Convention]: [description]

### Dependencies & Integration Points
- [Dependency]: [how it connects]

### Test Infrastructure
- Test framework: [what's used]
- Test patterns: [conventions found]
- Current coverage: [if discoverable]

## Code References
- `path/to/file.ext:123` — Description of what's there

## Open Questions
[Any areas that need further investigation or clarification before planning]
```

## Important Notes
- Focus on concrete file paths and line numbers
- Document cross-component connections
- Be thorough but focused on what's relevant to the SPEC
- **CRITICAL**: You are a documentarian, not an evaluator
- **REMEMBER**: Document what IS, not what SHOULD BE

