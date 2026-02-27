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
npx cc-pipeline run
```

If it errors or gets stuck, investigate the issue, fix it, then resume:

```bash
npx cc-pipeline run
```

The pipeline resumes from where it left off — state is tracked in `.pipeline/pipeline.jsonl`.

Check progress anytime:

```bash
npx cc-pipeline@latest status
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

## Adding New Epics

The pipeline works through `docs/epics/` one Epic at a time. When all Epics are
complete the pipeline stops. To continue development, add a new Epic and run again.

**Epic files** live at `docs/epics/epic-N.md` where N is the next number in sequence.
Check what exists and increment: if `epic-3.md` is the last one, create `epic-4.md`.

**Minimum viable Epic** — the pipeline's groom step will fill in research and detail,
so you only need to provide intent:

```markdown
# Epic N: [Short name]

## Goal
[One paragraph: what the user can do when this Epic is complete.
 Must be user-testable — a real capability, not an infrastructure layer.]

## Acceptance Criteria
- [ ] [Specific, observable thing a user can do or see]
- [ ] [Another testable outcome]
```

**Rules for good Epics:**
- Each Epic is a vertical slice — the user can test and get value from it independently
- Avoid infrastructure Epics ("set up the database", "add an API layer") — frame around user actions instead
- Size them to feel like 2–4 phases of work; the groom step will flag if it seems too large
- One Epic at a time is fine — you don't need to plan the whole future upfront

Once the file exists, just run `npx cc-pipeline run` and the pipeline picks it up automatically.

## Customizing the Pipeline

See `.pipeline/CLAUDE.md` for full configuration docs — how to edit workflow steps, change agents/models, customize prompts, and add new steps.
