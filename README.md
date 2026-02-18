# cc-pipeline

**Autonomous Claude Code pipeline engine.** Install into any repo, write a BRIEF.md describing your project, and let Claude build it phase by phase.

## What Is This?

cc-pipeline orchestrates autonomous development workflows using Claude Code. You provide a project vision in plain language, and the pipeline:

- Breaks down the vision into phases
- Plans and implements each phase
- Runs tests, reviews code, and commits automatically
- Iterates until the project is complete

Think of it as a CI/CD system for AI-driven development—but instead of deploying code, it writes it.

## Prerequisites

- **Node.js** >=18
- **Claude CLI** (`claude`) installed and configured ([get it here](https://docs.claude.ai/docs/claude-cli))

## Installation

This package is published to [GitHub Packages](https://github.com/timothyjoh/cc-pipeline/packages). First, configure npm to use the GitHub registry for the `@timothyjoh` scope:

```bash
echo "@timothyjoh:registry=https://npm.pkg.github.com" >> ~/.npmrc
```

Then install globally:

```bash
npm install -g @timothyjoh/cc-pipeline
```

Or run directly with npx:

```bash
npx @timothyjoh/cc-pipeline init
```

> **Note:** You may need to [authenticate with GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) if installing from a private network.

## Quick Start

```bash
# 1. Initialize pipeline in your project
cd your-project
cc-pipeline init

# 2. Create your project brief
cp BRIEF.md.example BRIEF.md
# Edit BRIEF.md to describe what you want built

# 3. Run the pipeline
cc-pipeline run

# 4. Check status anytime
cc-pipeline status
```

## Commands

### `cc-pipeline init`

Scaffolds `.pipeline/` directory and `BRIEF.md.example` into your project:

```
your-project/
├── .pipeline/
│   ├── workflow.yaml    # Pipeline configuration
│   └── prompts/         # Agent prompts (spec, plan, build, review, etc.)
└── BRIEF.md.example     # Template for your project vision
```

### `cc-pipeline run [options]`

Executes the pipeline, running phases until completion.

**Options:**

- `--phases <n>` — Limit to N phases (useful for testing)
- `--model <name>` — Override model for this run (e.g., `opus`, `sonnet`, `haiku`)

**Examples:**

```bash
cc-pipeline run                  # Run until complete
cc-pipeline run --phases 3       # Run just 3 phases
cc-pipeline run --model opus     # Use opus for all steps
```

The pipeline automatically resumes from interruptions. Press Ctrl-C to pause; run `cc-pipeline run` again to continue.

### `cc-pipeline status`

Shows current pipeline state: phase number, current step, and recent events.

```bash
cc-pipeline status
```

## How It Works

### Phases

The pipeline works in **phases**, each representing a unit of progress (e.g., "user authentication", "payment integration"). Each phase follows the same workflow of steps.

### Steps

Each phase runs through a series of **steps** defined in `workflow.yaml`:

1. **spec** — Claude reads BRIEF.md and breaks out a spec for this phase
2. **research** — Claude analyzes the current codebase state
3. **plan** — Claude creates an actionable implementation plan
4. **build** — Claude (interactive) implements the plan with autonomous agent teams
5. **review** — Claude performs staff engineer-level code review
6. **fix** — Claude (interactive) addresses review findings
7. **reflect** — Claude looks back at progress and forward to the next phase
8. **commit** — Bash agent commits and pushes changes

### Agents

Each step runs via an **agent** that determines how Claude executes:

- **`claude-piped`** — Non-interactive, document generation (spec, research, plan, review, reflect)
  - Runs: `claude -p "<prompt>"`
  - Best for: Planning, analysis, documentation

- **`claude-interactive`** — Interactive Claude in tmux session (build, fix)
  - Launches Claude with full tool access
  - Best for: Coding, debugging, multi-step implementation

- **`bash`** — Direct shell command execution (commit)
  - Runs: Git commands, scripts, etc.
  - Best for: Mechanical tasks

### Models

You can specify models per step in `workflow.yaml` or override globally via `--model`:

```yaml
steps:
  - name: spec
    agent: claude-piped
    model: sonnet          # Use sonnet for this step
    prompt: prompts/spec.md
```

Valid models: `opus`, `sonnet`, `haiku`

### State & Resume

Pipeline state is tracked in `.pipeline/pipeline.jsonl`—an append-only event log. The current phase and step are derived from the log, so you can:

- Press **Ctrl-C** to interrupt safely
- Run **`cc-pipeline run`** again to resume exactly where you left off

No manual state management required.

### Project Completion

When Claude detects the project is complete, it writes `PROJECT COMPLETE` in the first line of `REFLECTIONS.md`. The pipeline stops automatically.

## Configuration

The pipeline behavior is controlled by `.pipeline/workflow.yaml`. Key fields:

```yaml
name: "Default Pipeline"
version: 1

# Where phase outputs are stored
phases_dir: "docs/phases"

# Steps executed in each phase
steps:
  - name: spec
    description: "Break project vision into phase spec"
    agent: claude-piped
    model: sonnet              # Optional model override
    prompt: prompts/spec.md    # Prompt template
    output: "SPEC.md"          # Expected output file

  - name: build
    description: "Implement the plan"
    agent: claude-interactive
    prompt: prompts/build.md
    test_gate: true            # Placeholder for future test gating

  - name: fix
    description: "Address review findings"
    agent: claude-interactive
    prompt: prompts/fix.md
    skip_unless: "MUST-FIX.md" # Skip if condition not met
```

### Customizing Steps

You can modify `workflow.yaml` to:
- Add or remove steps
- Change agent types
- Adjust models per step
- Add conditional execution (`skip_unless`)
- Customize prompts

## Example BRIEF.md

```markdown
# Project Brief

## Overview
A command-line task manager with persistent storage.

## Tech Stack
- Node.js + SQLite
- No external dependencies

## Features (Priority Order)
1. **Add/list/complete tasks** — Core CRUD operations
2. **Due dates & filtering** — Filter by status, due date
3. **Tags & search** — Organize and find tasks

## Constraints
- Must work offline
- Single-file database

## Testing
- Node test runner for unit tests
- Cover core CRUD operations

## Definition of Done
~3 phases for MVP, complete when all features work with tests passing
```

## Project Structure

After initialization:

```
your-project/
├── .pipeline/
│   ├── workflow.yaml
│   ├── pipeline.jsonl          # Event log (auto-created on first run)
│   └── prompts/
│       ├── spec.md
│       ├── research.md
│       ├── plan.md
│       ├── build.md
│       ├── review.md
│       ├── fix.md
│       └── reflect.md
├── docs/
│   └── phases/
│       ├── phase-1/
│       │   ├── SPEC.md
│       │   ├── RESEARCH.md
│       │   ├── PLAN.md
│       │   ├── REVIEW.md
│       │   └── REFLECTIONS.md
│       └── phase-2/
│           └── ...
├── BRIEF.md                     # Your project vision
└── [your code here]
```

## Tips

- **Start small:** Write a minimal BRIEF.md focused on MVP features. You can always extend later.
- **Interrupt safely:** Ctrl-C works cleanly. The pipeline resumes from the exact step.
- **Review phase outputs:** Check `docs/phases/phase-N/` to see specs, plans, and reviews.
- **Customize workflow:** Edit `.pipeline/workflow.yaml` to match your preferences (different agents, models, or step order).
- **Watch the logs:** `.pipeline/pipeline.jsonl` contains a full event trace for debugging.

## Troubleshooting

**Pipeline won't start:**
- Ensure `claude` CLI is installed and working (`claude --version`)
- Run `cc-pipeline init` if `.pipeline/` doesn't exist

**Step fails repeatedly:**
- Check `docs/phases/phase-N/` for error messages in output files
- Review `.pipeline/pipeline.jsonl` for event details
- Try `--model opus` for more capable reasoning on hard steps

**Want to reset:**
- Delete `.pipeline/pipeline.jsonl` to start fresh (preserves config)
- Or delete entire `.pipeline/` directory and run `cc-pipeline init` again

## Development

```bash
# Clone the repo
git clone https://github.com/timothyjoh/cc-pipeline.git
cd cc-pipeline

# Install dependencies
npm install

# Run tests
npm test

# Link for local development
npm link
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

---

Built with [Claude Code](https://docs.claude.ai/docs/claude-cli) by Anthropic.
