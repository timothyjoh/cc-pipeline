# Task: TypeScript Conversion + Shared Events + TUI Revamp

**Branch:** `explore/agent-sdk-ts`
**Scope:** Full `src/` TypeScript conversion + shared events module + redesigned TUI step-list.

---

## Part 1 — TypeScript Conversion

### Setup

`typescript` and `tsx` are already in `devDependencies`. Add a `tsconfig.json` at the project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "experiments"]
}
```

### Rename all source files

Rename every `.js` file in `src/` (including subdirectories) to `.ts`. This includes:
- `src/cli.ts`
- `src/engine.ts`
- `src/config.ts`
- `src/logger.ts`
- `src/prompts.ts`
- `src/state.ts`
- `src/agents/base.ts`
- `src/agents/bash.ts`
- `src/agents/claude-piped.ts`
- `src/agents/claude-interactive.ts`
- `src/commands/init.ts`, `run.ts`, `status.ts`, `reset.ts`, `update.ts`
- `src/tui/App.ts` (JSX-free, React.createElement stays)
- `src/tui/index.ts`
- All `*.test.js` → `*.test.ts`

### Update `bin/cc-pipeline.js`

Change to use `tsx` for development / direct invocation:

```js
#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use tsx to run TypeScript directly
import('../node_modules/tsx/dist/esm/index.js').catch(() => {});
```

Actually — simpler: just update the shebang and import:

```js
#!/usr/bin/env node
import { run } from '../src/cli.ts' with { type: 'ts' };
```

Wait — that won't work with Node directly. Best approach for this project (no build step desired):

Keep `bin/cc-pipeline.js` as-is but add a `tsx` loader:

```json
// package.json scripts
"scripts": {
  "start": "tsx src/cli.ts",
  "test": "node --import tsx/esm --test src/**/*.test.ts",
  "build": "tsc"
}
```

And update `bin/cc-pipeline.js`:
```js
#!/usr/bin/env node
// Use tsx to execute TypeScript source directly
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx/esm', join(__dirname, '../src/cli.ts'), ...process.argv.slice(2)],
  { stdio: 'inherit' }
);
process.exit(result.status ?? 1);
```

### Add types

Add these where missing (not exhaustive — use judgment):

```ts
// src/agents/base.ts
export interface AgentContext {
  projectDir: string;
  config: PipelineConfig;
  logFile: string;
}

export interface AgentResult {
  exitCode: number;
  outputPath: string;
  error?: string;
}

export abstract class BaseAgent {
  abstract run(phase: number, step: StepDef, promptPath: string, model: string, context: AgentContext): Promise<AgentResult>;
}
```

Type the event payloads (see Part 2). Add `PipelineConfig` type from `src/config.ts`. Add `StepDef` type from the workflow YAML shape. Don't gold-plate — `any` is fine for things like hook payloads from the SDK.

---

## Part 2 — Shared Events Module

### Create `src/events.ts`

This is the single source of truth for the `pipelineEvents` emitter. Move it OUT of `claude-interactive.ts`.

```ts
import { EventEmitter } from 'node:events';

// Typed event payloads
export interface StepStartEvent   { phase: number; step: string; agent: string }
export interface StepDoneEvent    { phase: number; step: string; agent: string; exitCode: number }
export interface PhaseStartEvent  { phase: number }
export interface PhaseDoneEvent   { phase: number }
export interface ToolStartEvent   { phase: number; step: string; tool: string; input: unknown }
export interface ToolDoneEvent    { phase: number; step: string; tool: string; success: boolean }
export interface SubagentStartEvent { phase: number; step: string; agentId: string }
export interface SubagentDoneEvent  { phase: number; step: string; agentId: string; output?: string }
export interface SessionStopEvent   { phase: number; step: string; reason: string }

export interface PipelineEvents {
  'step:start':     [StepStartEvent]
  'step:done':      [StepDoneEvent]
  'phase:start':    [PhaseStartEvent]
  'phase:done':     [PhaseDoneEvent]
  'tool:start':     [ToolStartEvent]
  'tool:done':      [ToolDoneEvent]
  'subagent:start': [SubagentStartEvent]
  'subagent:done':  [SubagentDoneEvent]
  'session:stop':   [SessionStopEvent]
}

class TypedEventEmitter extends EventEmitter {}

export const pipelineEvents = new TypedEventEmitter();
```

### Wire the engine (`src/engine.ts`)

Import `pipelineEvents` from `src/events.ts` and emit at every step/phase transition. The engine already calls `appendEvent(logFile, {...})` — add `pipelineEvents.emit(...)` right alongside each one:

```ts
// step_start
appendEvent(logFile, { event: 'step_start', phase, step: stepDef.name, agent: stepDef.agent });
pipelineEvents.emit('step:start', { phase, step: stepDef.name, agent: stepDef.agent });

// step_done
appendEvent(logFile, { event: 'step_done', phase, step: stepDef.name, status, exitCode });
pipelineEvents.emit('step:done', { phase, step: stepDef.name, agent: stepDef.agent, exitCode: result.exitCode });

// phase_complete
appendEvent(logFile, { event: 'phase_complete', phase });
pipelineEvents.emit('phase:done', { phase });

// at the start of each phase (find where the phase loop begins)
pipelineEvents.emit('phase:start', { phase });
```

### Update `src/agents/claude-interactive.ts`

Remove the `pipelineEvents` export and `EventEmitter` import. Import from `src/events.ts` instead:

```ts
import { pipelineEvents } from '../events.ts';
```

The `tool:start`, `tool:done`, `subagent:start`, `subagent:done`, `session:stop` emits stay as-is — just sourced from the shared module now.

### Update `src/agents/claude-piped.ts`

Add the same `tool:start` / `tool:done` hook logging and `pipelineEvents.emit` calls as `claude-interactive.ts`. The piped steps (spec, research, plan, review, reflect) should also emit tool events — right now they're dark. Gives full visibility across all step types.

---

## Part 3 — TUI Revamp

### Replace `src/tui/App.ts`

Redesign to show a **step-list panel** at the top + **tool log** below.

**Layout:**

```
┌─────────────────────────────────────┐
│ cc-pipeline  phase 2 · build  04:32 │
├─────────────────────────────────────┤
│ ✓ spec                              │
│ ✓ research                          │
│ ✓ plan                              │
│ ▶ build          ← current, cyan    │
│   review                            │
│   reflect                           │
│   status                            │
│   commit                            │
├─────────────────────────────────────┤
│   → Bash {"cmd":"npm test"}         │
│   ✓ Bash                            │
│   → Write {"path":"src/engine.ts"}  │
│   ✓ Write                           │
│   → Bash {"cmd":"npm test"}         │
├─────────────────────────────────────┤
│ ● running                           │
└─────────────────────────────────────┘
```

**Data the TUI needs:**
- Step list — read from `.pipeline/workflow.yaml` at startup (the workflow steps for the current phase, or all phases)
- `step:start` / `step:done` events from the engine — update which step is current/completed
- `tool:start` / `tool:done` from agents — fill the tool log
- `session:stop` — set final status

**Implementation notes:**

1. Read the workflow YAML at startup to get the full step list:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// parse workflow.yaml to get step names
// steps order: spec, research, plan, build, review, fix, reflect, status, commit
```

2. Track `completedSteps: Set<string>` and `currentStep: string` state — update on `step:start` / `step:done` events.

3. Step list rendering:
   - Completed (`completedSteps.has(step.name)`): `✓ {name}` dimColor
   - Current (`currentStep === step.name`): `▶ {name}` cyan bold
   - Pending: `  {name}` dimColor

4. Tool log: last 8 entries, same `→` / `✓` / `✗` format as before, with truncated input.

5. Pass `projectDir` to the TUI so it can load workflow.yaml. Update `src/tui/index.ts`:

```ts
export function launchTUI(projectDir: string): void {
  render(React.createElement(App, { events: pipelineEvents, projectDir }));
}
```

And in `src/cli.ts`:
```ts
launchTUI(process.cwd());
```

---

## Tests

- All existing tests must still pass (currently 108)
- Update all `*.test.js` → `*.test.ts` and fix any type errors
- Add test: `pipelineEvents` is imported from `src/events.ts` (not claude-interactive)
- Add test: engine emits `step:start` event with correct payload
- Add test: `claude-piped` emits `tool:start` events (new behavior)

Run: `node --import tsx/esm --test 'src/**/*.test.ts'`

---

## Deliverables

1. `tsconfig.json` — project root
2. `src/**/*.ts` — all source files renamed + typed
3. `bin/cc-pipeline.js` — updated to invoke via tsx
4. `package.json` scripts updated
5. `src/events.ts` — shared typed emitter
6. `src/engine.ts` — emits step/phase lifecycle events
7. `src/agents/claude-piped.ts` — imports from events.ts, adds tool event emissions
8. `src/agents/claude-interactive.ts` — imports from events.ts (no longer exports pipelineEvents)
9. `src/tui/App.ts` — step-list panel + tool log
10. `src/tui/index.ts` — passes projectDir
11. All tests passing

**Do NOT:**
- Change workflow.yaml format
- Change the .pipeline/ prompt templates
- Change the engine's core step execution logic
- Touch anything in `experiments/`

Commit message: `feat: convert to TypeScript + shared events module + step-list TUI`
