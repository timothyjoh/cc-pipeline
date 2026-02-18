# Agent Teams Research

## What Are Agent Teams?

Claude Code experimental feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) that enables multi-agent parallel execution. Fundamentally different from the Task tool / sub-agents.

**Key differences from Task tool sub-agents:**
- Each teammate gets their own context window
- Shared task list with dependency tracking and file-lock claiming
- Inter-agent mailbox (teammates can message each other, not just report to lead)
- tmux split-pane mode (each teammate visible in its own pane)

## Enabling

### Option 1: Settings file (recommended, persistent)
Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Option 2: Environment variable (per-session)
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Option 3: cc-pipeline sets it automatically
The pipeline sets the env var in the tmux session before launching Claude.

## tmux Control Mode

One article reports that agents didn't spawn in separate panes without `tmux -CC` (control mode). Control mode maps tmux panes to native iTerm2 tabs/windows.

- `tmux -CC` — control mode, needed for iTerm2 native pane mapping
- Regular `tmux new-session -d` — may work but panes may not split automatically
- `--teammate-mode tmux` — Claude Code flag to prefer tmux split panes

**TODO:** Test whether `tmux -CC` is actually required or just an iTerm2 preference.

## Different Models Per Teammate

You can assign different models to each teammate:
```
Spawn a team of 3 agents:
- Agent 1 (opus): Backend implementation
- Agent 2 (sonnet): Frontend implementation  
- Agent 3 (haiku): Test writing
```

**Opportunity for cc-pipeline:** Build prompt could specify model per teammate role:
- Tester → haiku (cheaper, tests are simpler)
- Builder → opus (smarter, implementation is harder)
- Or respect the `--model` flag from the CLI

## Token/Cost Considerations

- Each teammate has its own context window → multiplies token usage
- A 3-agent team on a codebase analysis ran ~13 minutes
- Max plan users report heavy weekly limit impact from intense team runs
- Monitor with `/usage` command in Claude Code

## Architecture Details

- Config: `~/.claude/teams/{team-name}/config.json`
- Tasks: `~/.claude/tasks/{team-name}/`
- Display modes: in-process (default), split-pane (tmux), auto (detects environment)
- Setting: `"teammateMode": "tmux"` in settings.json

## References

- [How to Set Up and Use Claude Code Agent Teams](https://darasoba.medium.com/how-to-set-up-and-use-claude-code-agent-teams-and-actually-get-great-results-9a34f8648f6d) — Darasoba, Feb 7 2026
- [Claude Code Multi-Agent tmux Setup](https://www.dariuszparys.com/claude-code-multi-agent-tmux-setup/) — Dariusz Parys, Feb 2026

## Open Questions / TODOs

- [ ] Test `tmux -CC` vs regular tmux — is control mode required for pane splitting?
- [ ] Test settings.json approach vs env var — which is more reliable?
- [ ] Experiment with model-per-teammate in build prompt (haiku for tests, opus for code)
- [ ] Investigate `--teammate-mode tmux` flag — can we pass it when launching Claude?
- [ ] Measure token usage difference: solo build vs agent team build
- [ ] Check if agent teams work with `--dangerously-skip-permissions`
