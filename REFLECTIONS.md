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
