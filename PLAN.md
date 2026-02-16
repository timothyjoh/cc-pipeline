# cc-pipeline Build Plan

## Phase 1: Core Engine
Port the bash pipeline engine to Node.js with proper process management.

**Deliverables:**
- `src/engine.js` — Main pipeline loop (phase iteration, step execution, resume)
- `src/state.js` — JSONL-derived state (read/write events, derive current phase/step)
- `src/logger.js` — Structured JSONL logging + pretty console output
- `src/config.js` — workflow.yaml parser
- `src/prompts.js` — Prompt template generator with context injection (BRIEF.md, previous phases, etc.)

**Verification:** `node bin/cc-pipeline.js run --phases 1` starts a pipeline, logs JSONL events, and executes the spec step via `claude -p`.

## Phase 2: Agent Implementations
Implement all agent types that execute pipeline steps.

**Deliverables:**
- `src/agents/claude-piped.js` — Spawn `claude -p` with proper signal handling (SIGTERM → SIGKILL)
- `src/agents/claude-interactive.js` — tmux-based interactive CC for build/fix steps
- `src/agents/bash.js` — Shell command execution (for commit step)
- `src/agents/base.js` — Shared agent interface/contract

**Verification:** Each agent can be run independently. Ctrl-C during any agent cleanly terminates within 1 second.

## Phase 3: CLI Polish & Init Command
Complete the user-facing CLI experience.

**Deliverables:**
- `cc-pipeline init` works end-to-end (scaffold + BRIEF template)
- `cc-pipeline run` works end-to-end with all agents
- `cc-pipeline status` reads JSONL and displays current state
- Graceful Ctrl-C at any point
- Resume from interruption (reads JSONL, determines where to pick up)
- Banner display on start (project name, steps, current state)

**Verification:** Full init → run → Ctrl-C → resume cycle works. `npx cc-pipeline init` in a fresh dir scaffolds correctly.

## Phase 4: Testing & Documentation
Ensure quality and usability for public release.

**Deliverables:**
- Unit tests for state.js, config.js, prompts.js, logger.js
- Integration test: init → mock run → status cycle
- README.md with usage, examples, configuration guide
- LICENSE (MIT)
- npm publish dry run

**Verification:** `npm test` passes. README covers all commands and options.

## Reference Implementation
The working bash version lives at `~/wrk/swimlanes/.pipeline/run.sh` (~630 lines). 
Key files to reference:
- `.pipeline/run.sh` — full pipeline engine
- `.pipeline/workflow.yaml` — step definitions
- `.pipeline/prompts/*.md` — prompt templates
- `docs/phases/phase-N/` — example output structure
