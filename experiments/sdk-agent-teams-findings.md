# SDK Agent Teams — Experiment Findings

**Date:** 2026-02-22
**Script:** `experiments/sdk-agent-teams-test.ts`
**Raw data:** `experiments/sdk-agent-teams-results.json`
**Env:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `permissionMode: bypassPermissions`

---

## 1. Did agent teams actually spawn? What backend was used?

**Yes — agent teams spawned and completed successfully.**

The `TeamCreate` tool was called first, creating:
- Team name: `sdk-research`
- Team config: `~/.claude/teams/sdk-research/config.json`
- Lead agent ID: `team-lead@sdk-research`

Two teammates were then spawned via the `Task` tool with `run_in_background: true` and `team_name: "sdk-research"`:

| Teammate | Agent ID | Internal ID | Model |
|---|---|---|---|
| `hooks-researcher` | `hooks-researcher@sdk-research` | `ae6f2d34f8a10c4ff` | claude-opus-4-6 |
| `coordination-researcher` | `coordination-researcher@sdk-research` | `a3ac3fecb4b5a5404` | claude-opus-4-6 |

**Backend used: `in-process`** — NOT tmux, NOT iTerm2.

The `PostToolUse Task` response included:
```json
{
  "status": "teammate_spawned",
  "tmux_session_name": "in-process",
  "tmux_pane_id": "in-process",
  "backendType": "in-process"
}
```

The `in-process` backend means teammates ran as in-process Node.js workers within the same Claude Code session, not in separate terminal panes. This is the default when not running inside tmux. Teammates use `claude-opus-4-6` by default (more expensive than the parent's `claude-sonnet-4-6`).

---

## 2. What events did the SDK see? How does it differ from the subagent experiment?

### Parent session event log (13 total events):

```
[000] system/init
[001] assistant   ← Claude plans TeamCreate
[002] assistant   ← Claude calls TeamCreate
[003] user        ← TeamCreate result
[004] assistant   ← Claude plans Task spawns
[005] assistant   ← Claude calls Task (hooks-researcher + coordination-researcher)
[006] user        ← Task result: "teammate_spawned"
[007] assistant   ← Claude calls second Task (or same turn, interleaved)
[008] user        ← Task result: "teammate_spawned"
[009] assistant   ← "Both teammates running, I'll wait"
[010] system/task_started  ← hooks-researcher task registered
[011] system/task_started  ← coordination-researcher task registered
[012] result/success       ← PARENT EXITS (4 turns, 15.8s)
```

### Critical difference from subagent experiment:

| Aspect | Subagents (Task tool) | Agent Teams (Task + team) |
|---|---|---|
| Parent waits for completion | **Yes** | **No** |
| Parent event count | 66 events | **13 events** |
| Parent turns | ~20+ | **4 turns** |
| Parent duration | ~165s | **15.8s** |
| Task response | Full output content | `"status": "teammate_spawned"` |
| Teammate output visible to SDK | Yes (PostToolUse) | **No — goes to inbox file** |
| `SubagentStop` fires in parent | Yes | **No** |

**The fundamental difference:** With `run_in_background: true` + `team_name`, the `Task` tool returns immediately with `"status": "teammate_spawned"` instead of waiting for the teammate to finish. The parent session then exits. Teammates run asynchronously and communicate results via inbox files, not back through the parent `query()` stream.

---

## 3. Did `TeammateIdleHookInput` or `TaskCompletedHookInput` fire?

**No — neither fired in the parent session.**

Hooks that fired in the parent:

| Hook | Count |
|---|---|
| `PreToolUse:TeamCreate` | 1 |
| `PostToolUse:TeamCreate` | 1 |
| `PreToolUse:Task` | 2 |
| `PostToolUse:Task` | 2 |
| `SubagentStart` | 2 |
| `Stop` | 1 |
| **`TeammateIdle`** | **0** |
| **`TaskCompleted`** | **0** |
| **`SubagentStop`** | **0** |

`TeammateIdle` and `TaskCompleted` fire within the teammate's own process, not the parent. In a tmux/interactive session, the lead Claude session stays alive and can receive these as injected messages. In this headless `query()` flow, the parent exited before teammates completed.

One interesting observation: `SubagentStart` DID fire (twice) — the SDK still sees teammate spawns as "subagent starts." This is a hook-level unification: teams and subagents share the same `SubagentStart` signal.

---

## 4. Can we see teammate activity (their tool calls, messages) or just boundaries?

**Just boundaries — and even those are partial.**

What the parent SDK stream saw per teammate:
- ✅ Spawn intent (`PreToolUse Task` with full prompt)
- ✅ Spawn confirmation (`PostToolUse Task` with `status: "teammate_spawned"`)
- ✅ `SubagentStart` hook with `agent_id` and `agent_type`
- ❌ No internal tool calls (WebSearch, Glob, Read, etc.)
- ❌ No intermediate reasoning
- ❌ No `SubagentStop`
- ❌ No completion signal of any kind in the `query()` stream

Both teammates completed (confirmed by inbox files), but the parent `query()` loop had already exited when that happened.

**Teammate output goes to the inbox file** at `~/.claude/teams/sdk-research/inboxes/team-lead.json`, not back through the parent stream. Both teammates sent their research findings there and then sent idle notifications — all after the parent's `query()` had returned.

---

## 5. What do the coordination files look like?

### File Structure Created

```
~/.claude/
├── teams/sdk-research/
│   ├── config.json          ← Team config (members, lead, metadata)
│   └── inboxes/
│       └── team-lead.json   ← Lead's inbox (4 messages arrived)
└── tasks/sdk-research/
    ├── .lock                ← File lock for concurrency
    ├── 1.json               ← Task: hooks-researcher (status: in_progress)
    └── 2.json               ← Task: coordination-researcher (status: in_progress)
```

### config.json structure:
```json
{
  "name": "sdk-research",
  "leadAgentId": "team-lead@sdk-research",
  "leadSessionId": "c4d1a158-...",
  "members": [
    { "name": "team-lead", "agentType": "team-lead", "tmuxPaneId": "" },
    { "name": "hooks-researcher", "backendType": "in-process", "model": "claude-opus-4-6" },
    { "name": "coordination-researcher", "backendType": "in-process", "model": "claude-opus-4-6" }
  ]
}
```

### task file structure:
```json
{
  "id": "1",
  "subject": "hooks-researcher",
  "status": "in_progress",
  "blocks": [],
  "blockedBy": [],
  "metadata": { "_internal": true }
}
```

Both tasks remained `in_progress` — teammates sent their results via SendMessage to the inbox but did **not** call `TaskUpdate(completed)`. In a headless run, the lead isn't alive to process the results, so the task lifecycle doesn't close cleanly.

### inbox message structure:
```json
[
  {
    "from": "hooks-researcher",
    "text": "Here are my complete findings...",
    "summary": "Complete Claude Agent SDK TypeScript hooks research",
    "timestamp": "2026-02-22T12:57:00.272Z",
    "color": "blue",
    "read": false
  },
  {
    "from": "hooks-researcher",
    "text": "{\"type\":\"idle_notification\",\"from\":\"hooks-researcher\",...}",
    "timestamp": "2026-02-22T12:57:04.842Z",
    "read": false
  }
  ...
]
```

Key observation: messages are `read: false` because the lead session exited before consuming them. In an interactive session, the lead processes inbox messages in real-time.

---

## 6. Total token cost vs. subagent experiment

Exact token counts for teammates weren't captured (parent exited before they completed). However, from the team config and model assignments:

| | Subagent Experiment | Agent Teams Experiment |
|---|---|---|
| Parent model | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Subagent/teammate model | claude-sonnet-4-6 | **claude-opus-4-6** |
| Parent events | 66 | **13** |
| Parent turns | ~20 | **4** |
| Parent wait | Blocks until done | **Returns immediately** |
| Teammate visibility | Full output in PostToolUse | **None — goes to inbox** |

The team system defaults teammates to `claude-opus-4-6`, which is significantly more expensive than Sonnet. The parent is cheaper (exits faster), but each teammate costs more per token. Net cost for equivalent work would be higher with teams.

---

## Summary: Architecture Implications for cc-pipeline

### The Core Problem: `query()` + teams = fire-and-forget

When teammates run with `run_in_background: true`, `query()` returns as soon as the parent session says "I've spawned the teammates." There is **no mechanism in the current `query()` API to await teammate completion**. Results land in inbox files, not in the SDK event stream.

### What this means for cc-pipeline:

1. **Teams are not a drop-in replacement for subagents.** Subagents block and return results; teams are async and communicate via files.

2. **To use teams in cc-pipeline, you'd need a polling loop** on the inbox file, or use `unstable_v2_createSession()` + `send()` to keep the parent alive and receive inbox delivery as injected messages.

3. **`TeammateIdle` / `TaskCompleted` hooks only fire in the teammate's own process,** not the parent. They're useful inside a live interactive session (tmux/iterm2) where the parent stays alive, not in a short-lived `query()` call.

4. **The coordination files are simple and inspectable:** flat JSON arrays, file-locked, easy to poll. A cc-pipeline supervisor could watch `~/.claude/teams/{name}/inboxes/team-lead.json` for new messages without going through the SDK at all.

5. **Backend type matters hugely:** `in-process` = invisible and fast but no persistence if parent dies. `tmux` = persistent, visible, survives parent exit. For cc-pipeline's autonomous flow, `in-process` is fine; for debugging, `tmux` is better.

6. **The subagent system is the right primitive for cc-pipeline's current phases** — it blocks, returns output through the SDK stream, and doesn't require polling. Teams make sense for longer-running parallel work where you don't need to wait.
