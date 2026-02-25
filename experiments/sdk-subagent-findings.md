# SDK Sub-Agent Visibility — Experiment Findings

**Date:** 2026-02-22
**Script:** `experiments/sdk-subagent-test.ts`
**Raw data:** `experiments/sdk-subagent-results.json`

---

## Setup

A single `query()` call asked Claude to spawn two sub-agents in parallel via the Task tool:
1. Research the TypeScript version required by `@anthropic-ai/claude-agent-sdk`
2. Research what hooks the SDK exposes

Hooks registered: `SubagentStart`, `SubagentStop`, `PreToolUse`, `PostToolUse`, `Stop`

---

## Results

### 1. Did sub-agents spawn successfully?

**Yes.** Both sub-agents spawned and completed successfully.

- Agent 1: `af7fec9d8cf9c426c` (TypeScript version question) — 16 tool calls, 62.8s
- Agent 2: `af18d1681ba40a6de` (Hooks question) — 10 tool calls, 140.2s

Claude did NOT run them in true parallel (it spawned them sequentially, one per turn). The prompt asked for parallel but Claude issued them sequentially. This is a Claude behavior detail, not an SDK limitation.

---

### 2. Did the SDK receive events FROM the sub-agents, or just from the parent?

**Boundary events only — sub-agent internals are a black box.**

The parent event stream contained:

| Event | Source | Visibility |
|---|---|---|
| `PreToolUse` (Task) | hook | The full tool input (prompt, description, subagent_type) |
| `SubagentStart` | hook | `agent_id`, `agent_type` — nothing else |
| `system/task_started` | event stream | `task_id`, `tool_use_id`, `description` |
| `SubagentStop` | hook | `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message` (full text) |
| `PostToolUse` (Task) | hook | Full `tool_response`: output content, `agentId`, `totalDurationMs`, `totalTokens`, `totalToolUseCount` |

**What was NOT visible:** The sub-agents' individual tool calls (their internal Bash, Read, WebFetch calls), their intermediate reasoning, or their turn-by-turn messages. Those are locked inside the subprocess and its transcript file.

**Key finding:** Sub-agent tool activity is invisible to the parent event stream. You can observe the boundary (start/stop) and the final output, but not the internal steps.

---

### 3. What does SubagentStop look like?

```json
{
  "session_id": "d0a59917-...",
  "transcript_path": "/Users/.../.claude/projects/.../d0a59917-....jsonl",
  "cwd": "/Users/timothyjohnson/wrk/cc-pipeline",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "af7fec9d8cf9c426c",
  "agent_transcript_path": ".../subagents/agent-af7fec9d8cf9c426c.jsonl",
  "agent_type": "general-purpose",
  "last_assistant_message": "... full final output text ..."
}
```

Key fields:
- **`agent_id`** — unique identifier for the sub-agent
- **`agent_transcript_path`** — full path to the sub-agent's JSONL transcript (you can read this!)
- **`last_assistant_message`** — the complete final output text (no need to parse the transcript)
- **`stop_hook_active`** — always `false` in our run; `true` would mean another stop hook is running

**The `agent_transcript_path` is significant:** you can read the sub-agent's full internal transcript after it stops. This is the escape hatch for sub-agent internals.

---

### 4. Total event shape

**66 total events, 51 hook firings**

| Event type | Count |
|---|---|
| `assistant` | 32 |
| `user` | 30 |
| `system/task_started` | 2 |
| `system/init` | 1 |
| `result/success` | 1 |
| **Total** | **66** |

| Hook | Firings |
|---|---|
| `PreToolUse` | ~23 (all tool calls, flagged 2 Task calls) |
| `PostToolUse` | ~23 (all tool calls, flagged 2 Task calls) |
| `SubagentStart` | 2 |
| `SubagentStop` | 2 |
| `Stop` | 1 |
| **Total** | **~51** |

Notable: `system/task_started` events appeared at event indices 063–064, AFTER the sub-agents had already completed (SubagentStop fired much earlier). They appear to be buffered and flushed late. Do not rely on `task_started` ordering for real-time tracking — use `SubagentStart` hook instead.

---

## Answers to the Two Questions

### Q1: If the SDK sees sub-agent events → can we build a visualizer and skip tmux?

**Partially yes.** You can build a visualizer that shows:
- When each sub-agent starts and what task it was given (PreToolUse + SubagentStart)
- When each sub-agent ends and what it produced (SubagentStop + PostToolUse)
- Duration, token counts, tool use counts (from PostToolUse `tool_response`)
- Full transcript (from `agent_transcript_path` — readable after the fact)

You **cannot** build a live step-by-step visualizer showing each internal tool call in real time — those events do not surface to the parent.

**tmux replacement:** tmux is used for interactive terminal sessions (user types, session persists). The SDK is for headless/autonomous flows. They serve different purposes. For the cc-pipeline autonomous flow (no user interaction), tmux is replaceable with `query()`. For interactive sessions, tmux or something similar is still needed.

### Q2: If SDK only sees the parent → are sub-agents a black box?

**Sub-agent internals are a black box in the live event stream, but not completely.** After a sub-agent stops:
- The `SubagentStop` hook delivers `last_assistant_message` (the full final output)
- `agent_transcript_path` points to a JSONL file with the complete sub-agent transcript
- `PostToolUse` delivers the output content, token counts, and tool use counts

For cc-pipeline purposes (monitoring phase completion, capturing outputs, feeding results to next phase), this is sufficient. The blind spot is real-time visibility into sub-agent progress.

---

## Implications for cc-pipeline Migration

1. **SDK hooks replace output polling.** `SubagentStop` + `PostToolUse Task` give clean completion signals with full output — no more stdout parsing.

2. **Transcript files are the escape hatch.** Read `agent_transcript_path` after SubagentStop to replay or inspect sub-agent work for debugging or phase reflection.

3. **Hybrid approach for real-time UI:** If you need a live progress display showing sub-agent internal steps (Firebert-style), you'd need either: (a) structured logging inside the sub-agent prompt, or (b) a secondary process watching the transcript file as it's written. The SDK stream alone won't provide this.

4. **PostToolUse delivers rich metadata:** `totalDurationMs`, `totalTokens`, `totalToolUseCount`, `agentId` — all available per sub-agent. Good for cost tracking and phase metrics.

5. **`CLAUDECODE` env collision:** Running the SDK inside an existing Claude Code session fails unless `CLAUDECODE` is unset. The `env` option in `query()` handles this cleanly.
