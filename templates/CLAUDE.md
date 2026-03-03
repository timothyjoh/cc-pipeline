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

1. **groom** — Bootstrap Epics from `BRIEF.md` (phase 1), transition to the next Epic, or skip if the current Epic is already in-progress
2. **spec** — Break the current Epic into a phase spec
3. **research** — Analyze the current codebase
4. **plan** — Create an implementation plan
5. **build** — Implement the plan (interactive Claude in tmux)
6. **review** — Staff engineer-level code review
7. **fix** — Address review findings (if any)
8. **reflect** — Look back and update the Epic's remaining work
9. **next** — Write a short `NEXT.md` steering pointer (which Epic, in-progress or complete)
10. **status** — Update STATUS.md with what was built, how to run it, review findings, test coverage, and what's next
11. **commit** — Git commit and push

Phase outputs are saved to `docs/phases/phase-N/`. Epics live in `docs/epics/`.

The pipeline stops automatically when all Epics are complete (`PROJECT COMPLETE` in `GROOM.md`).

## Adding New Epics

The pipeline works through `docs/epics/` one Epic at a time. When all Epics are
complete the pipeline stops. To continue development, add a new Epic and run again.

### Quick way — ask Claude Code to help

Open Claude Code in your project and say:

```
Look at the existing Epics in docs/epics/ and STATUS.md, then help me
write the next Epic. Ask me what capability I want to add, then draft
the Epic file following the existing naming convention.
```

### Manual way — create the file yourself

**Epic files** live at `docs/epics/epic-N-short-name.md` where N is the next number in sequence.
Check what exists and increment: if `epic-3-payments.md` is the last one, create `epic-4-short-name.md`.

**Minimum viable Epic** — the `groom` step will research and fill in detail,
so you only need to provide intent:

```markdown
# Epic N: [Short descriptive name]

## Goal
[One paragraph: what the user can do when this Epic is complete.
 Must be user-testable — a real capability, not an infrastructure layer.]

## Acceptance Criteria
- [ ] [Specific, observable thing a user can do or see]
- [ ] [Another testable outcome]
- [ ] [Another testable outcome]
```

**Rules for good Epics:**
- Each Epic is a **vertical slice** — the user can see and test it independently
- Avoid infrastructure Epics ("set up the database", "add an API layer") — frame around user actions instead
  - ❌ "Epic 3: Refactor the data layer"
  - ✅ "Epic 3: User can filter and search results"
- Size them to feel like 2–4 phases of work; the groom step will estimate phases for you
- One Epic at a time is fine — you don't need to plan the whole future upfront
- Don't add a `## Research & Decisions` section — groom will write that

Once the file exists, just run `npx cc-pipeline run` and the pipeline picks it up automatically.

## Customizing the Pipeline

See `.pipeline/CLAUDE.md` for full configuration docs — how to edit workflow steps, change agents/models, customize prompts, and add new steps.
