# Fix Phase — Address Review Findings

You are the fix team. A staff engineer has reviewed this phase's work and identified issues that must be fixed before the phase can proceed.

## Context — Read These First (FULLY, no partial reads)

1. **MUST-FIX document**: `docs/phases/phase-{{PHASE}}/MUST-FIX.md` — your task list
2. **Phase Review**: `docs/phases/phase-{{PHASE}}/REVIEW.md` — full review context
3. **Phase Spec**: `docs/phases/phase-{{PHASE}}/SPEC.md` — what was supposed to be built
4. **Phase Plan**: `docs/phases/phase-{{PHASE}}/PLAN.md` — how it was supposed to be built

Current phase: {{PHASE}}

## Your Job

1. Read MUST-FIX.md completely
2. If there are 3+ independent fixes, create an agent team to parallelize them
3. Fix every task listed
4. Run the verify step for each fix
5. Run the full test suite after all fixes
6. Confirm all tests pass

## Agent Teams — Use When Appropriate

Agent teams are enabled in this session (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). If MUST-FIX.md has multiple independent fixes (3+), you should create an agent team:

- **You (Team Lead):** Coordinate and run the final test suite
- **Fix Teammates:** Each takes one or more independent fix tasks
- Brief each teammate with the specific fix instructions and relevant file context
- Set dependencies if fixes must happen in order
- After all teammates finish, run the full test suite yourself and handle regressions

For 1-2 simple fixes, just do them yourself — no need for a team.

## Rules

- Fix ONLY what MUST-FIX.md says. Do not refactor, improve, or add features beyond the fix list.
- Follow the "Fix" instructions exactly. If they're wrong or unclear, use your best judgment but document what you did differently.
- Every fix must pass its "Verify" check.
- If a fix breaks something else, fix the regression too.
- When all fixes are done, run the full test suite one final time.

## Output

After all fixes are applied and tests pass, update `docs/phases/phase-{{PHASE}}/MUST-FIX.md` by marking each task as done:

```markdown
### Task 1: [title]
**Status:** ✅ Fixed
**What was done:** [Brief description of the actual fix]
```

If you cannot fix something, mark it:
```markdown
### Task N: [title]
**Status:** ❌ Could not fix
**Reason:** [Why]
```
