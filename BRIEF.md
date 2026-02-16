# cc-pipeline

**An autonomous Claude Code pipeline engine.** Install into any repo, write a BRIEF.md, and let Claude build your project phase by phase.

## What It Does

cc-pipeline runs Claude Code through a deterministic loop of phases. Each phase follows the same steps:

**spec → research → plan → build → review → fix → reflect → commit**

It reads your `BRIEF.md` (project description + requirements), generates phase specs, builds incrementally, reviews its own work, fixes issues, and reflects on progress. Each phase builds on the last until the project is complete.

## Design Principles

- **Language/framework agnostic** — works on any codebase (Python, Rust, Go, whatever)
- **Node.js engine** — but only for the pipeline itself; your project can be anything
- **BRIEF.md is the contract** — one file describes what you want built
- **Deterministic phases** — same steps every time, predictable and debuggable
- **JSONL logging** — structured, append-only event log for every action
- **Resumable** — Ctrl-C and restart; picks up where it left off
- **Configurable** — workflow.yaml controls steps, agents, models per step

## User Experience

```bash
# Install into any project
npx cc-pipeline init

# Creates:
#   .pipeline/          — engine, config, prompts
#   BRIEF.md.example    — template to copy and customize

# Edit your BRIEF.md, then:
npx cc-pipeline run          # unlimited phases
npx cc-pipeline run --phases 3   # run 3 phases and stop
npx cc-pipeline status       # show current state from JSONL
```

## Package Structure

```
cc-pipeline/
├── bin/
│   └── cc-pipeline.js       # CLI entry point
├── src/
│   ├── cli.js               # argument parsing, commands
│   ├── engine.js             # main pipeline loop
│   ├── agents/
│   │   ├── claude-piped.js   # claude -p (doc steps)
│   │   ├── claude-interactive.js  # tmux-based (build/fix)
│   │   └── bash.js           # shell commands (commit)
│   ├── state.js              # JSONL-derived state
│   ├── logger.js             # structured JSONL + console output
│   ├── prompts.js            # prompt generation with context injection
│   └── config.js             # workflow.yaml parsing
├── templates/
│   ├── workflow.yaml         # default step config
│   ├── prompts/              # default prompt templates
│   │   ├── spec.md
│   │   ├── research.md
│   │   ├── plan.md
│   │   ├── build.md
│   │   ├── review.md
│   │   ├── fix.md
│   │   ├── reflect.md
│   │   └── commit.md
│   └── BRIEF.md.example      # template for users
├── package.json
├── README.md
└── LICENSE
```

## Key Technical Decisions

- **Hybrid execution:** `claude -p` (piped) for doc-output steps; interactive Claude in tmux for build/fix
- **Node child_process.spawn** for proper signal handling (Ctrl-C works!)
- **State from JSONL** — no separate state file; derive current phase/step from event log
- **Phase docs** in `docs/phases/phase-N/` — SPEC.md, PLAN.md, REVIEW.md, etc.
- **Workflow is YAML-driven** — users can customize steps, models, agents per step

## MVP Scope

1. `cc-pipeline init` — scaffold .pipeline/ + BRIEF.md.example
2. `cc-pipeline run` — execute phases with all 8 steps
3. `cc-pipeline status` — show current state
4. Ctrl-C graceful shutdown
5. Resume from interruption
6. JSONL structured logging
7. Default workflow with sensible prompts

## Stretch Goals

- `cc-pipeline run --model sonnet` — override model for a run
- Codex CLI agent support (second opinion on reviews)
- Web UI for monitoring pipeline progress
- Plugin system for custom agents/steps
