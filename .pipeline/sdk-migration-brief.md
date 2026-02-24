# Task: Migrate ClaudePipedAgent to SDK query()

**Branch:** `explore/agent-sdk-ts` (already on it)
**Scope:** Replace `src/agents/claude-piped.js` only. Do NOT touch `src/agents/claude-interactive.js`, `src/agents/bash.js`, or anything tmux-related.

---

## What's Changing

`ClaudePipedAgent` currently spawns `claude -p` as a subprocess and captures stdout.
Replace it with `@anthropic-ai/claude-agent-sdk`'s `query()` API (already installed in package.json).

The engine (`src/engine.js`) calls:
```js
const pipedAgent = new ClaudePipedAgent();
result = await pipedAgent.run(phase, stepDef, promptPath, model, context);
```

The return value must stay identical:
```js
{ exitCode: number, outputPath: string }
```

Everything else in the engine stays untouched.

---

## The New Implementation

**File:** `src/agents/claude-piped.js` (overwrite in place — stay as JS ESM, no TypeScript conversion)

### Key SDK usage

```js
import { query } from '@anthropic-ai/claude-agent-sdk';
```

Basic pattern from the experiments (`experiments/sdk-subagent-test.ts`):
```js
const messages = [];
for await (const event of query({
  prompt: promptText,
  options: {
    maxTurns: 200,
    permissionMode: 'bypassPermissions',
    ...(model && model !== 'default' ? { model } : {}),
    env: { ...process.env, CLAUDECODE: undefined },  // ← CRITICAL: prevents SDK conflict when running inside CC
  },
  abortController: controller,
})) {
  // collect events
}
```

### Collecting output

Collect all `assistant` role text messages from the event stream and write them to `outputPath`:
```js
// event.type === 'assistant' && event.message.role === 'assistant'
// event.message.content is an array of content blocks
// text blocks: { type: 'text', text: '...' }
```

Write the collected text to `join(pipelineDir, 'step-output.log')` — same path the engine expects.

### Signal/interrupt handling

Check `agentState.interrupted` before and after the query. If interrupted mid-flight, abort via `AbortController`:
```js
const controller = new AbortController();
agentState.on('interrupt', () => controller.abort());
// ... query with abortController: controller
if (agentState.interrupted) return { exitCode: 130, outputPath };
```

### Return codes

- Success (query completes normally): `exitCode: 0`
- Aborted/interrupted: `exitCode: 130`
- Any thrown error: `exitCode: 1`, log the error to outputPath

### Hooks (optional but nice)

Register hooks for observability — log to the pipeline's log file:
```js
hooks: {
  SubagentStart: [async (data) => { /* log agent_id started */ }],
  SubagentStop: [async (data) => { /* log agent_id stopped, append last_assistant_message */ }],
  PostToolUse: [async (data) => { /* log tool name, duration if Task tool */ }],
}
```

Hooks are optional — don't block on them. Keep logging minimal.

---

## Gotchas (from experiments/sdk-subagent-findings.md)

1. **`CLAUDECODE` must be unset** in the env passed to query — otherwise the SDK detects it's running inside Claude Code and throws. Pass `env: { ...process.env, CLAUDECODE: undefined }`.

2. **Model handling:** The engine may pass `'default'` as model string — treat that as "don't specify a model" (let SDK use its default). Only pass `model` option when it's a real model identifier.

3. **`permissionMode: 'bypassPermissions'`** — required for headless operation (same as `--dangerously-skip-permissions` in the old subprocess).

4. **Output path:** Engine reads `step-output.log` from `.pipeline/` dir. Write there even on error (write the error message so it's inspectable).

5. **ESM import:** The SDK is ESM-compatible. The project is already `"type": "module"` so imports work fine.

---

## Tests

Look at `src/smoke.test.js` and any existing agent tests. Add or update tests for the new implementation:
- Mock the SDK `query()` call (don't make real API calls in tests)
- Verify the output file is written
- Verify exitCode 0 on success, 130 on abort, 1 on error
- Verify model is not passed when `model === 'default'`

Run: `npm test` — all existing tests must still pass.

---

## Deliverables

1. `src/agents/claude-piped.js` — rewritten to use SDK query()
2. Tests updated/added for the new implementation (keep all existing tests green)
3. Brief summary of what changed and any surprises

Do NOT:
- Touch claude-interactive.js
- Touch the engine
- Convert any other files to TypeScript
- Change the public API of ClaudePipedAgent

When done, commit to `explore/agent-sdk-ts` with message: `feat: migrate ClaudePipedAgent to SDK query()`
