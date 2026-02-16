# Reflections

*Append after each phase.*

---

## Phase 1 Reflection: Core Engine

### (1) What did this phase accomplish?

All five Phase 1 deliverables are implemented and importable:

- **`src/engine.js`** — Main pipeline loop with phase iteration, step execution, `skipUnless` checks, output file verification, test gate placeholders, `PROJECT COMPLETE` detection, interruptible inter-phase sleep, and proper signal handling (SIGINT/SIGTERM with cleanup). Agent execution is stubbed — step routing exists but delegates to console stubs.
- **`src/state.js`** — JSONL append-only event log with `appendEvent`, `readEvents`, `getCurrentState` (derives phase/step/status from last relevant event), and `deriveResumePoint` (handles fresh start, running resume, step advance, and phase advance).
- **`src/config.js`** — Parses `workflow.yaml` via the `yaml` dep, normalizes snake_case → camelCase, exposes helpers (`getStepByName`, `getStepIndex`, `getNextStep`, `getFirstStep`).
- **`src/logger.js`** — Box-drawing banner with ANSI colors, shows workflow name, project name, steps, and current state.
- **`src/prompts.js`** — Template substitution for `{{PHASE}}`, `{{PREV_REFLECTIONS}}`, `{{BRIEF}}`, `{{FILE_TREE}}` (file tree is still a placeholder string).

CLI wiring updated: `bin/cc-pipeline.js` entry point, `src/commands/run.js` delegates to engine, `src/commands/status.js` reads JSONL and displays state + last 10 events.

Smoke tests pass (5/5) — import-only tests verifying all modules export expected functions.

### (2) PLAN.md updates needed?

Minor updates worth noting but not blocking:

- **Phase 1 verification criterion** says `node bin/cc-pipeline.js run --phases 1` should "execute the spec step via `claude -p`". Currently it executes stubs, not actual `claude -p`. This is fine — agent implementations are Phase 2 — but the verification line is misleading. Consider rewording to "starts a pipeline, logs JSONL events, and routes steps to agent stubs."
- **`{{FILE_TREE}}`** in `prompts.js` is a placeholder. Not listed in any phase deliverable. Should be added to Phase 2 or Phase 3 scope.
- **Phase 4** mentions unit tests for the core modules — the smoke test only checks exports. Real logic tests (state derivation, config parsing, prompt substitution) should be explicitly called out.

### (3) Architecture concerns

- **Redundant step events:** `runStep` emits `step_start`, `step_done`, AND `step_complete` for every step — three events for one step execution. The distinction between `step_done` and `step_complete` is unclear. `getCurrentState` treats them identically. Recommend collapsing to `step_start` + `step_complete` (or `step_done`) before agents are wired in, since the JSONL schema becomes a compatibility contract once real data exists.
- **`config.js` helpers may be dead code:** `getStepByName`, `getStepIndex`, `getNextStep`, `getFirstStep` are exported but unused — engine.js does its own `findIndex` inline. Either use the helpers in the engine or drop them to avoid divergence.
- **No error/retry events:** The JSONL schema has no `step_error` or `step_retry` event type. When agents fail (Phase 2), the engine will need these. Worth designing the event schema now before data accumulates.
- **`prompts.js` injects file path, not content** for `{{PREV_REFLECTIONS}}` — it writes `"Previous phase reflections (read this file): /path"` rather than inlining the content. This works if the agent reads files from disk, but `claude -p` receives stdin, so it may need the actual content. Verify against the reference implementation's behavior.
- **Banner right-padding:** Box-drawing lines are fixed-width (39 chars) but content lines aren't padded/truncated, so the box won't close properly for long workflow names or step lists.

### (4) What should next phase watch out for?

- **Signal forwarding to child processes is the hard part.** The engine handles SIGINT for itself, but spawned `claude -p` and tmux processes need their own signal handling. The bash reference implementation had significant complexity here (`run.sh` process groups, `wait` interruption). Don't underestimate this.
- **`claude -p` stdin/stdout plumbing.** The piped agent needs to: (a) build the full prompt via `generatePrompt`, (b) pipe it to `claude -p --model X`, (c) capture stdout to the output file, (d) handle non-zero exit codes. Test with actual `claude` CLI early — don't develop against mocks only.
- **tmux session lifecycle.** Interactive agent needs to: create/attach tmux session, send commands, detect completion (poll for output file? wait for process exit?). The reference `run.sh` approach should be studied carefully.
- **The step event schema** should be finalized before agents start writing real events. Adding `step_error`, removing the `step_done`/`step_complete` duplication, and possibly adding `agent_output` events should happen at the start of Phase 2, not mid-implementation.
- **All new files are untracked.** `src/config.js`, `src/engine.js`, `src/logger.js`, `src/prompts.js`, `src/smoke.test.js`, `src/state.js` are `??` in git status. Commit before starting Phase 2 to establish a clean baseline.

---

## Phase 2 Reflection: Agent Implementations

### (1) What did this phase accomplish?

All four Phase 2 deliverables are implemented and wired into the engine:

- **`src/agents/base.js`** — `AgentState` singleton (EventEmitter) tracks current child process and interrupted flag. `BaseAgent` abstract class defines the `run(phase, step, promptPath, model, context)` contract. AgentState is the coordination point between the engine's signal handler and running agents.
- **`src/agents/claude-piped.js`** — `ClaudePipedAgent` spawns `claude -p --dangerously-skip-permissions`, writes the generated prompt to `current-prompt.md`, pipes it via stdin (avoiding OS arg length limits), captures stdout+stderr to `step-output.log`. Uses `close` event (not `exit`) to ensure streams flush. Registers with AgentState for signal forwarding.
- **`src/agents/claude-interactive.js`** — `ClaudeInteractiveAgent` manages tmux lifecycle: creates session, polls pane content for startup markers (up to 60s), delivers prompt via `tmux load-buffer`/`paste-buffer`, polls for a `.step-done` sentinel file, then sends `/exit` + Escape + Enter to cleanly shut down the Claude session. Supports both `claude-interactive` and `codex-interactive` agents. Interrupt checks at every poll iteration.
- **`src/agents/bash.js`** — `BashAgent` substitutes `{{PHASE}}` in the step's `command` field, spawns via `shell: true` with `stdio: 'inherit'`. Registered with AgentState for signal handling.

Engine updated (+62 lines): stubs replaced with real agent instantiation via switch/case routing. Error handling wraps agent execution — failures produce `{ exitCode: 1 }` rather than crashing the pipeline. The redundant `step_complete` event from Phase 1 was removed; schema is now `step_start` → `step_done` (addressing the Phase 1 concern). `step_done` also removed from `getCurrentState`'s relevant events list was cleaned up — wait, it's still there but correctly as the sole completion event.

State module: `step_complete` removed from the relevant events filter in `getCurrentState`, confirming the schema simplification.

### (2) PLAN.md updates needed?

- **Phase 2 is complete as specified.** All four deliverables (`base.js`, `claude-piped.js`, `claude-interactive.js`, `bash.js`) are implemented and integrated.
- **Phase 2 verification criterion** ("Each agent can be run independently. Ctrl-C during any agent cleanly terminates within 1 second.") is partially met. Agents are wired and can execute, but clean termination within 1 second isn't guaranteed — `stopInteractive` has ~3.5s of sleeps in its shutdown sequence, and the engine's signal handler allows 3s before `process.exit`. Consider adjusting the criterion to "within 5 seconds" or accept that interactive sessions need more time.
- **`{{FILE_TREE}}` placeholder** (noted in Phase 1) is still unresolved. It's not in Phase 3's scope either. Should be added to Phase 3 or deferred to Phase 4.
- **Test gate** is still a stub (`[STUB] Would run test gate`). Not listed in any phase. Should be Phase 3 scope (it's part of "run works end-to-end") or Phase 4.

### (3) Architecture concerns

- **`execSync` in the interactive agent is a blocking hazard.** `startInteractive`, `deliverPrompt`, and `stopInteractive` all use `execSync` for tmux commands. While each individual call is fast, a hung `tmux` (e.g., session in a bad state) will freeze the entire Node process with no timeout. The rest of the codebase correctly uses async `spawn`. Consider switching to async exec or at least adding `{ timeout: 5000 }` to the `execSync` calls.
- **Interactive agent creates new agent instances per step** (engine.js:222 `new ClaudeInteractiveAgent()`). This is fine for stateless agents, but if agent state ever needs to persist across steps (e.g., reusing a tmux session), the factory pattern won't support it. Not a problem today, but worth noting.
- **No output capture for interactive agent.** `ClaudePipedAgent` captures output to `step-output.log`, but `ClaudeInteractiveAgent` returns `outputPath: null`. If a step has an `output` field, the engine checks for it in the phase directory (engine.js:248), but the interactive agent itself doesn't produce or verify output files. This means interactive steps that specify `output` in workflow.yaml rely entirely on Claude writing the file — no fallback or warning from the agent itself.
- **`shellEscape` is hand-rolled** (claude-interactive.js:10-12). It handles `"$\`\\!` but may miss edge cases (e.g., newlines, single quotes in project directory names). Consider using a well-tested approach or at minimum adding a comment about known limitations.
- **Prompt delivered via tmux paste-buffer** can fail silently. If the prompt is very large, tmux's paste buffer may truncate it. The reference implementation likely had the same limitation, but it's worth documenting the max prompt size.
- **Error swallowed in engine catch block.** Engine.js:230-233 catches agent errors and converts them to `{ exitCode: 1 }` but the pipeline continues to the next step. For some agents (like `claude-piped` producing a spec), a failure should probably halt the phase, not silently continue. The JSONL records `status: 'error'` in `step_done` but nothing reads it.
- **Agent instantiation per step** — every call to `runStep` creates a fresh agent instance (`new BashAgent()`, `new ClaudePipedAgent()`, etc.). These are effectively stateless function calls wrapped in classes. The class hierarchy adds indirection without benefit — plain functions would be simpler and more idiomatic for this codebase. Not worth changing now, but if the pattern spreads, reconsider.

### (4) What should Phase 3 watch out for?

- **End-to-end testing requires `claude` CLI and `tmux`.** Phase 3 verification ("Full init → run → Ctrl-C → resume cycle works") can't be tested in CI or without the Claude CLI installed. Plan for manual verification and consider a `--dry-run` flag that exercises the engine with mock agents.
- **Resume after interactive step interruption.** If Ctrl-C hits during an interactive step's sentinel polling, the tmux session may survive (the catch block in `ClaudeInteractiveAgent.run` tries to stop it, but `sessionName` is re-derived from `basename(projectDir)` which may differ from the one `startInteractive` created). Test this path explicitly.
- **`cc-pipeline init` needs to be tested in isolation.** The init command scaffolds files — verify it doesn't overwrite existing `.pipeline/` content (e.g., a user's `workflow.yaml` customizations).
- **Banner display** still has the right-padding bug from Phase 1 (box won't close for long names). Phase 3 adds "Banner display on start" as a deliverable — fix the padding.
- **`step_error` events.** The engine logs `status: 'error'` inside `step_done` events, but there's no dedicated `step_error` event type and no retry logic. If Phase 3 is adding robust resume, the engine needs to distinguish "step failed, retry" from "step failed, skip" from "step failed, halt." Design this before implementing resume.
- **The `status` command** needs to handle the cleaned-up event schema. Phase 1's `step_complete` was removed — make sure `commands/status.js` doesn't reference it.
- **Graceful Ctrl-C during `claude -p`** — the piped agent registers the child with AgentState and the engine sends SIGTERM → SIGKILL. But the piped agent's Promise resolves on `close`, so the engine may try to log `step_done` after the signal handler has already called `process.exit(130)`. There's a potential race between the agent's cleanup and the signal handler's forced exit. Test with a long-running `claude -p` call and Ctrl-C.
