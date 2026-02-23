# Commit Phase Work

You are the Commit Agent. Your job is to review everything done in this phase and create a single, clean commit with a concise message.

Current phase: {{PHASE}}

## Steps

### 1. Ensure git is initialized

Check if this is a git repo. If not, initialize it:

```bash
git rev-parse --git-dir 2>/dev/null || git init
```

### 2. Check what changed

```bash
git diff --stat
git status --short
```

### 3. Read phase context

- `docs/phases/phase-{{PHASE}}/SPEC.md` for what this phase was about
- `docs/phases/phase-{{PHASE}}/REFLECTIONS.md` for what was actually delivered

### 4. Stage and commit

Stage everything:

```bash
git add -A
```

Check if there's anything to commit:

```bash
git diff --cached --quiet && echo "nothing to commit" || git commit -m "phase {{PHASE}}: [short description]"
```

**If there's nothing to commit** (everything already staged/committed by an earlier step), that's fine — just exit successfully. Do not fail.

**Commit message format:**

```
phase {{PHASE}}: [short description of what was built]

- [key deliverable 1]
- [key deliverable 2]
- [key deliverable 3]
```

Short description ≤ 50 chars.

### 5. Push (only if a remote exists)

Check for a remote before pushing:

```bash
git remote -v
```

**If a remote exists:** push with `git push`.
**If no remote is configured:** skip the push entirely — this is normal for local-only projects. Do not fail.

Do not attempt to set up a remote. Do not fail if there's no remote.

---

Example commit message:
```
phase 2: board UI with drag-and-drop

- Board/Column/Card React components
- HTML5 drag-and-drop between columns
- Responsive layout with Tailwind
- 24 new tests (84 total)
```
