# CLAUDE.md — cc-pipeline Instructions

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

Execute the pipeline and monitor it:

```bash
npx @timothyjoh/cc-pipeline run
```

If it errors or gets stuck, investigate the issue, fix it, then resume:

```bash
npx @timothyjoh/cc-pipeline run
```

The pipeline resumes from where it left off — state is tracked in `.pipeline/pipeline.jsonl`.

Check progress anytime:

```bash
npx @timothyjoh/cc-pipeline status
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
8. **commit** — Git commit and push

Phase outputs are saved to `docs/phases/phase-N/`.

The pipeline stops automatically when the project is complete (`PROJECT COMPLETE` in REFLECTIONS.md).
