# CLAUDE.md — Pipeline Configuration Guide

This is the `.pipeline/` directory for [cc-pipeline](https://github.com/timothyjoh/cc-pipeline). It controls how autonomous builds work.

## Directory Structure

```
.pipeline/
├── CLAUDE.md          ← You are here
├── workflow.yaml      ← Pipeline configuration (steps, agents, models)
├── pipeline.jsonl     ← Event log (auto-generated at runtime, don't edit)
└── prompts/           ← Prompt templates for each step
    ├── spec.md        ← Breaks the project vision into a phase spec
    ├── research.md    ← Analyzes current codebase state
    ├── plan.md        ← Creates an implementation plan
    ├── build.md       ← Instructions for the build agent (interactive)
    ├── review.md      ← Staff engineer code review
    ├── fix.md         ← Address review findings (interactive)
    ├── reflect.md     ← Look back + plan next phase
    └── commit.md      ← Git commit message template
```

## workflow.yaml

This is the main config file. It defines the step order, which agent runs each step, and optional model overrides.

### Agent Types

| Agent | How it runs | Best for |
|-------|------------|----------|
| `claude-piped` | `claude -p "<prompt>"` (non-interactive) | Planning, analysis, reviews, docs |
| `claude-interactive` | Claude in a tmux session with full tool access | Building code, fixing issues |
| `bash` | Direct shell command | Git commits, scripts |

### Adding/Removing Steps

Steps run in order. Each step needs:
- `name` — Unique identifier
- `description` — What it does
- `agent` — Which agent type runs it
- `prompt` — Path to the prompt template (relative to `.pipeline/`)

Optional fields:
- `model` — Override the model for this step (e.g., `opus`, `sonnet`, `haiku`)
- `output` — Expected output filename (saved to `docs/phases/phase-N/`)
- `skip_unless` — Only run if this file exists in the phase output dir
- `test_gate` — Placeholder for future test gating

### Example: Adding a Security Audit Step

```yaml
steps:
  # ... existing steps ...

  - name: security
    description: "Security audit of new code"
    agent: claude-piped
    model: opus
    prompt: prompts/security.md
    output: "SECURITY.md"

  # Put it before commit so issues are caught before pushing
  - name: commit
    agent: bash
    command: "git add -A && git commit -m 'Phase {{PHASE}} complete' && git push origin master"
```

Then create `.pipeline/prompts/security.md` with your prompt template.

### Model Overrides

Set per-step in workflow.yaml, or override all steps at runtime:

```bash
npx @timothyjoh/cc-pipeline@latest run --model opus
```

## Prompt Templates

Prompts use `{{PLACEHOLDER}}` substitution:

| Placeholder | Value |
|-------------|-------|
| `{{PHASE}}` | Current phase number |
| `{{BRIEF}}` | Contents of BRIEF.md |
| `{{PREV_REFLECTIONS}}` | Path to previous phase's REFLECTIONS.md |

### Editing Prompts

The prompts control the quality and style of each step. Feel free to customize them:

- **spec.md** — Change how phases are scoped (vertical slices, horizontal layers, etc.)
- **build.md** — Adjust the build strategy (agent teams, solo, TDD approach)
- **review.md** — Tune review strictness, add domain-specific checks
- **reflect.md** — Change what gets captured between phases

## Resetting the Pipeline

- **Resume from interruption:** Just run again — it picks up from the last event
- **Restart current phase:** Delete events for the current phase from `pipeline.jsonl`
- **Full reset:** Delete `pipeline.jsonl` entirely (keeps all config)
- **Nuclear reset:** Delete the entire `.pipeline/` directory and re-run `npx @timothyjoh/cc-pipeline@latest init`
