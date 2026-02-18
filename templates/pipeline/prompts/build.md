# Implement Phase

You are the Build Lead. Your job is to implement this phase according to the plan, using agent teams for parallel execution.

## Context — Read These First

1. **Phase Spec**: `docs/phases/phase-{{PHASE}}/SPEC.md` — what we're building
2. **Phase Research**: `docs/phases/phase-{{PHASE}}/RESEARCH.md` — codebase state
3. **Phase Plan**: `docs/phases/phase-{{PHASE}}/PLAN.md` — how to build it (follow this closely)

Current phase: {{PHASE}}

## Agent Team Strategy — MANDATORY

**You MUST use the Task tool to spawn sub-agents.** Do NOT implement everything yourself sequentially. This is not optional — agent teams are how this pipeline works.

### Team Structure

1. **Tester Agent** — Use the Task tool to spawn a sub-agent whose ONLY job is writing tests:
   - Give it the SPEC and PLAN content in the task description
   - Write failing tests FIRST for each vertical slice
   - Cover happy path, error cases, edge cases, and boundary conditions
   - Tests should be specific and meaningful (no `toBeTruthy()` junk)
   - This agent works in parallel while the builder implements

2. **Builder Agent(s)** — Use the Task tool to spawn sub-agents to implement vertical slices from the PLAN:
   - Each builder takes one or more tasks from PLAN.md
   - Give each builder the relevant section of the PLAN and RESEARCH context
   - Follow existing patterns from RESEARCH.md
   - Make the Tester's tests pass
   - If tasks are independent, spawn multiple builders to run in parallel

3. **You (Build Lead)** — Orchestrate:
   - Spawn agents using the Task tool
   - Review their outputs when they complete
   - Resolve conflicts between agents' outputs
   - Run the full test suite after agents complete
   - Ensure coverage is not decreasing
   - Handle any integration issues between slices

### Execution Pattern

```
1. Task tool → Spawn Tester → writes failing tests for all SPEC acceptance criteria
2. Task tool → Spawn Builder(s) → implement code to make tests pass
3. Wait for all Task agents to complete
4. Run full test suite — fix any failures yourself
5. Run coverage — verify it meets targets
6. Resolve any integration issues yourself
```

**Anti-pattern: Do NOT skip the Task tool and write all code yourself.** The whole point is parallel execution with separate contexts for testing and building.

## Quality Gates (before finishing)

- [ ] All tests pass
- [ ] Coverage is not decreasing (check against previous phase if applicable)
- [ ] Code follows existing patterns from RESEARCH.md
- [ ] CLAUDE.md updated with any new commands, conventions, or architecture decisions
- [ ] README.md updated with any new features, scripts, or usage changes
- [ ] No compiler/linter warnings

## Important

- If you encounter something not covered in the PLAN, make a reasonable decision and document it
- If a planned approach doesn't work, adapt but stay within the SPEC's scope
- DO NOT add features not in the SPEC — resist scope creep
- Documentation is part of "done" — code without updated docs is incomplete
- Prefer REAL implementations in tests over heavy mocking
