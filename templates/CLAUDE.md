# CLAUDE.md

## ⚠️ FIRST: Read AGENTS.md

If `AGENTS.md` exists, read it NOW before doing anything else. It has project conventions, install steps, test commands, and architecture decisions.

---

## cc-pipeline

This project uses [cc-pipeline](https://github.com/timothyjoh/cc-pipeline) for autonomous development.

## Writing the Brief

If `BRIEF.md` doesn't exist yet, help the user create one:

```
Using the @BRIEF.md.example as a template, we need to discuss this project's
goals and write a BRIEF.md in the project root. Ask me first for a quick
description of the project, then ask me questions one-at-a-time so that we
can construct a good initial project brief.
```

## Running the Pipeline

> **⚠️ Do NOT run the pipeline from within Claude Code.** The pipeline spawns its own Claude Code sessions in tmux — nesting Claude inside Claude is not supported. Run it from a regular terminal instead.

```bash
# From a regular terminal (not Claude Code):
npx @timothyjoh/cc-pipeline@latest run
```

If it errors or gets stuck, investigate the issue, fix it, then resume:

```bash
npx @timothyjoh/cc-pipeline@latest run
```

The pipeline resumes from where it left off — state is tracked in `.pipeline/pipeline.jsonl`.

Check progress anytime:

```bash
npx @timothyjoh/cc-pipeline@latest status
```

## How the Pipeline Works

Each phase runs through these steps in order:

1. **spec** — Break the project vision into a phase spec
2. **research** — Analyze the current codebase
3. **plan** — Create an implementation plan
4. **build** — Implement the plan (interactive Claude in tmux)
5. **review** — Staff engineer-level code review
6. **fix** — Address review findings (if any)
7. **reflect** — Look back and plan the next phase
8. **status** — Update STATUS.md with what was built, how to run it, review findings, test coverage, and what's next
9. **commit** — Git commit and push

Phase outputs are saved to `docs/phases/phase-N/`.

The pipeline stops automatically when the project is complete (`PROJECT COMPLETE` in REFLECTIONS.md).

## Customizing the Pipeline

See `.pipeline/CLAUDE.md` for full configuration docs — how to edit workflow steps, change agents/models, customize prompts, and add new steps.
