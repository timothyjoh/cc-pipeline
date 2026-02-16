# CLAUDE.md — Project Context for Claude Code

## What Is This?
cc-pipeline is an autonomous Claude Code pipeline engine. Users install it into any repo, write a BRIEF.md describing their project, and the pipeline builds it phase by phase.

## Architecture
- **Node.js CLI** — ESM modules, no build step, single dep (yaml)
- **Entry:** `bin/cc-pipeline.js` → `src/cli.js` → commands
- **Engine:** `src/engine.js` — main loop, phase iteration, step execution
- **Agents:** `src/agents/*.js` — claude-piped, claude-interactive, bash
- **State:** JSONL-derived (no separate state file), append-only event log
- **Config:** `workflow.yaml` defines steps, agents, models per step

## Commands
- `cc-pipeline init` — Scaffold .pipeline/ + BRIEF.md.example into target project
- `cc-pipeline run [--phases N] [--model NAME]` — Execute pipeline
- `cc-pipeline status` — Show current state from JSONL

## Key Design Decisions
- **Hybrid execution:** `claude -p` (piped) for doc steps (spec, research, plan, review, reflect); interactive Claude in tmux for build/fix
- **Signal handling:** `child_process.spawn` with SIGTERM → SIGKILL for clean Ctrl-C
- **State from JSONL:** Current phase/step derived from last events in pipeline.jsonl
- **Language agnostic:** Pipeline is Node but target project can be anything

## Reference Implementation
The working bash version is at `~/wrk/swimlanes/.pipeline/run.sh` (~630 lines). Port the logic, not the bash idioms.

## Testing
```bash
npm test
```

## File Conventions
- `src/` — All source code (ESM)
- `templates/` — Files copied during `init`
- `bin/` — CLI entry point
- No TypeScript, no bundler, no transpilation
