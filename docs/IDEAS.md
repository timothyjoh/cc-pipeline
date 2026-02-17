# IDEAS.md — Future Enhancements

## Contract-First Plan→Build Handoff
**Source:** Cole Medin's "Agent Teams" video (Feb 2026)

Currently the plan step outputs a task list. Instead, have it output **explicit API contracts and schemas** — function signatures, data structures, file boundaries — before the build step spawns parallel agents. This way agents can integrate without reading each other's code.

**Implementation:** Add a `contracts` section to PLAN.md template. The plan prompt should require: "Define the API contract between modules — function signatures, expected inputs/outputs, shared data structures. Each build agent receives these contracts as context."

**Why it matters:** The #1 failure mode in parallel agent builds is integration conflicts. Contract-first eliminates this by agreement-before-implementation.

## Structured Pre-Flight Questions
**Source:** Cole Medin

Before the spec step, force the agent to generate 10-15 clarifying questions about the BRIEF.md, then answer them from context. Catches ambiguity early instead of mid-build.

**Where it fits:** Could be a new `clarify` step before `spec`, or baked into the spec prompt itself.

## Autonomous Validation Loop
**Source:** Cole Medin

After build/fix, add a validation loop: agent runs tests → finds bugs → fixes → re-runs tests → repeats until clean. Currently we do review→fix as separate steps with a human-like handoff. An autonomous loop would be tighter.

**Where it fits:** Could replace or augment the review→fix→reflect sequence with a `validate` step that loops internally.
