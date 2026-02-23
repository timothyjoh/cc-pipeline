# Task: Migrate ClaudeInteractiveAgent to SDK query()

**Branch:** `explore/agent-sdk-ts` (already on it)
**Scope:** `src/agents/claude-interactive.js` (SDK migration) + `src/tui/` (Ink TUI) + `src/cli.js` (`--ui` flag). Do NOT touch `src/agents/claude-piped.js`, `src/agents/bash.js`, or the engine.

---

## Context

`ClaudeInteractiveAgent` currently spawns an interactive Claude Code session inside tmux:
1. Creates a named tmux session
2. Runs `claude --dangerously-skip-permissions` inside it
3. Delivers a prompt by writing to a temp file and sending a keystroke
4. Polls the tmux pane output every few seconds looking for a sentinel string (`[PIPELINE_COMPLETE]`)
5. Kills the tmux session when done

This creates a hard tmux dependency, brittle output polling, and zero visibility into what CC is actually doing.

**Goal:** Replace all of that with SDK `query()` — same approach as `ClaudePipedAgent`, but tuned for long interactive builds. The engine calls this agent with the same interface and expects the same return value.

---

## What Stays the Same

- `run(phase, step, promptPath, model, context)` method signature
- Return value: `{ exitCode: number, outputPath: string }`
- `outputPath` = `.pipeline/step-output.log` in the project dir
- Engine imports still work — no changes to `engine.js`

---

## What Changes

**Before:** spawn tmux → deliver prompt via keystroke → poll pane for sentinel → kill session
**After:** `query(prompt, options)` → collect events via hooks → write output → return

---

## Implementation

**File:** `src/agents/claude-interactive.js` (overwrite in place, stay JS ESM)

### Core pattern (same as ClaudePipedAgent)

```js
import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';

export class ClaudeInteractiveAgent extends BaseAgent {
  async run(phase, step, promptPath, model, context) {
    const { projectDir, config, logFile } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const outputPath = join(pipelineDir, 'step-output.log');

    const promptText = generatePrompt(projectDir, config, phase, promptPath);
    writeFileSync(join(pipelineDir, 'current-prompt.md'), promptText, 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    const controller = new AbortController();
    agentState.on('interrupt', () => controller.abort());

    // ... query(), collect output, write file, return exitCode
  }
}
```

### Key differences from ClaudePipedAgent

**1. High maxTurns**

The build step involves many back-and-forth turns (write file → run tests → fix → repeat). Set generously:

```js
maxTurns: 500,   // build steps need many turns; 200 was sometimes not enough
```

**2. Rich hook logging — every tool call**

This is the core value-add over tmux. Log every tool call to the output file so we can see exactly what CC did:

```js
hooks: {
  PreToolUse: [async (data) => {
    const line = `[tool:start] ${data.tool_name} ${JSON.stringify(data.tool_input ?? {}).slice(0, 120)}`;
    log(line);
    appendFileSync(outputPath, line + '\n', 'utf-8');
  }],
  PostToolUse: [async (data) => {
    const success = !data.tool_response?.is_error;
    const line = `[tool:done]  ${data.tool_name} ${success ? '✓' : '✗'}`;
    log(line);
    appendFileSync(outputPath, line + '\n', 'utf-8');
  }],
  SubagentStart: [async (data) => {
    const line = `[subagent:start] ${data.agent_id}`;
    log(line);
    appendFileSync(outputPath, line + '\n', 'utf-8');
  }],
  SubagentStop: [async (data) => {
    const line = `[subagent:done]  ${data.agent_id}`;
    log(line);
    appendFileSync(outputPath, line + '\n', 'utf-8');
    if (data.last_assistant_message) {
      appendFileSync(outputPath, data.last_assistant_message + '\n', 'utf-8');
    }
  }],
  Stop: [async (data) => {
    log(`[session:stop] reason=${data.stop_reason}`);
  }],
}
```

**3. SSE event emitter stub**

Add an EventEmitter that fires structured events as they happen. This is the hook point for the future Ink TUI — the TUI just subscribes to this emitter. Keep it simple for now:

```js
import { EventEmitter } from 'node:events';

// Module-level singleton so TUI can attach from outside
export const pipelineEvents = new EventEmitter();

// Inside run(), emit events alongside logging:
// pipelineEvents.emit('tool:start', { phase, step, tool: data.tool_name, input: data.tool_input });
// pipelineEvents.emit('tool:done',  { phase, step, tool: data.tool_name, success });
// pipelineEvents.emit('subagent:start', { phase, step, agentId: data.agent_id });
// pipelineEvents.emit('subagent:done',  { phase, step, agentId: data.agent_id, output: data.last_assistant_message });
// pipelineEvents.emit('session:stop',   { phase, step, reason: data.stop_reason });
```

---

## Ink TUI + `--ui` Flag

### Add `ink` and `react` dependencies

```bash
npm install ink react
```

### New files: `src/tui/`

**`src/tui/App.js`** — Ink React component. Displays:
- Header: current phase + step name + elapsed time (update every second via `setInterval`)
- Tool call log: last 12 tool calls, newest at bottom. Each line: `[tool:start]` or `[tool:done] ✓/✗`
- Status bar: `running` / `done` / `error` in appropriate colors (green/red)

```jsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

export function App({ events }) {
  const { exit } = useApp();
  const [tools, setTools] = useState([]);
  const [status, setStatus] = useState('running');
  const [phase, setPhase] = useState('');
  const [step, setStep] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startTime = Date.now();

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    events.on('tool:start', (d) => {
      setPhase(d.phase); setStep(d.step);
      setTools(prev => [...prev.slice(-11), { kind: 'start', tool: d.tool, ts: Date.now() }]);
    });
    events.on('tool:done', (d) => {
      setTools(prev => [...prev.slice(-11), { kind: 'done', tool: d.tool, success: d.success, ts: Date.now() }]);
    });
    events.on('session:stop', (d) => {
      setStatus(d.reason === 'end_turn' ? 'done' : 'error');
      setTimeout(exit, 500);
    });
  }, []);

  const statusColor = { running: 'blue', done: 'green', error: 'red' }[status];
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>cc-pipeline </Text>
        <Text color="cyan">phase {phase} · {step} </Text>
        <Text dimColor>{mins}:{secs}</Text>
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        {tools.map((t, i) => (
          <Text key={i} dimColor={t.kind === 'start'}>
            {t.kind === 'start' ? '  → ' : t.success ? '  ✓ ' : '  ✗ '}{t.tool}
          </Text>
        ))}
      </Box>
      <Text color={statusColor}>● {status}</Text>
    </Box>
  );
}
```

**`src/tui/index.js`** — Entry point. Imports `pipelineEvents` and renders the app:

```js
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { pipelineEvents } from '../agents/claude-interactive.js';

export function launchTUI() {
  render(React.createElement(App, { events: pipelineEvents }));
}
```

### Add `--ui` flag to `src/cli.js`

In the `run` command section, add:
- `--ui` flag — launch Ink TUI
- `--no-ui` flag — force plain output (useful for CI)
- Auto-detect: if neither flag is given and `process.stdout.isTTY` is true, launch TUI automatically

```js
// In run command, after parsing options:
const useTUI = options.ui ?? (options.noUi ? false : process.stdout.isTTY);

if (useTUI) {
  const { launchTUI } = await import('./tui/index.js');
  launchTUI();
}

// Then run the engine as normal
await runPipeline(cwd, options);
```

Update the help text:
```
  --ui            Launch Ink TUI (default: auto-detect TTY)
  --no-ui         Force plain output (for CI/pipes)
```

---

## **4. Collect assistant text output**

Same as ClaudePipedAgent — collect all assistant text blocks and write to outputPath at the end:

```js
// On each event from query():
// if event.type === 'assistant', collect content[].text blocks
// Write collected text to outputPath at end
```

**5. env: CLAUDECODE unset** (same gotcha as ClaudePipedAgent)

```js
env: { ...process.env, CLAUDECODE: undefined }
```

### Return codes
- Normal completion: `exitCode: 0`
- Aborted/interrupted: `exitCode: 130`
- Error thrown: `exitCode: 1`, write error to outputPath

---

## Tests

Look at `src/claude-interactive.test.js` (existing) and `src/claude-piped.test.js` (reference for mock pattern).

Update/add tests:
- Mock `query()` from `@anthropic-ai/claude-agent-sdk`
- Verify output file written on success
- Verify exitCode 130 on interrupt (agentState.interrupted set before run)
- Verify exitCode 1 on thrown error
- Verify tool hooks fire and write to outputPath
- Verify `pipelineEvents` emitter fires `tool:start` and `tool:done` events
- Verify model skipped when `model === 'default'`
- Verify `createAgent()` returns a `ClaudeInteractiveAgent` instance
- Verify `--ui` flag causes `launchTUI()` to be called
- Verify `--no-ui` flag skips `launchTUI()` even when `process.stdout.isTTY` is true
- Verify TTY auto-detect: `launchTUI()` called when `isTTY=true` and no flag; skipped when `isTTY=false`

Run `npm test` — all 97 existing tests must still pass.

---

## What to Remove

- All tmux-related code: `tmux new-session`, `tmux send-keys`, pane output polling, sentinel detection
- Any `@file` prompt delivery logic
- Process kill/cleanup for tmux

---

## Deliverables

1. `src/agents/claude-interactive.js` — rewritten to use SDK query() with rich hooks + SSE emitter stub
2. `src/tui/App.js` — Ink TUI React component
3. `src/tui/index.js` — TUI entry point, subscribes to pipelineEvents
4. `src/cli.js` — `--ui` / `--no-ui` flags + TTY auto-detect
5. `package.json` — `ink` and `react` added as dependencies
6. Tests updated/added (keep all 97 existing passing); add tests for `--ui` TTY auto-detect logic
7. Brief summary of what changed, what the event log looks like, any surprises

**Do NOT:**
- Touch claude-piped.js
- Touch the engine
- Remove the `claude-interactive` step type from workflow.yaml
- Convert to TypeScript

When done, commit to `explore/agent-sdk-ts` with message:
`feat: migrate ClaudeInteractiveAgent to SDK query() + Ink TUI with --ui flag`
