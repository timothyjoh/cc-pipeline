# System Prompts Research

Analysis of leaked system prompts from major AI coding tools.
Source: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools (110K+ stars)

## Key Patterns Worth Stealing

### 1. TodoWrite / Task Tracking (Claude Code, Cursor)
Both Claude Code and Cursor heavily emphasize TODO tracking during execution:
- "Use TodoWrite tools VERY frequently to ensure you are tracking tasks"
- "Mark todos as completed as soon as you are done — do not batch"
- Cursor uses `todo_write` with `merge=true` to reconcile before every edit

**Relevance to cc-pipeline:** Our build prompt could tell the team lead to use TodoWrite to track teammate progress. Currently we just say "orchestrate" — this is more specific.

### 2. Think Tool / Reasoning (Devin)
Devin has an explicit `<think>` scratchpad that's mandatory before:
- Critical git decisions
- Transitioning from exploring to editing
- Reporting completion (must "critically examine" work before claiming done)
- After test/CI failures (think big picture before diving into fixes)

**Relevance:** Our review/reflect prompts could benefit from explicit "think before acting" instructions.

### 3. Parallel Tool Calls (Cursor)
Cursor is aggressive about parallelism:
- "DEFAULT TO PARALLEL unless output of A required for input of B"
- "Parallel tool execution can be 3-5x faster"
- Batch read-only operations, independent edits
- "Limit to 3-5 tool calls at a time or they might time out"

**Relevance:** Our agent teams already parallelize at the teammate level, but the build prompt could encourage parallel tool calls within each teammate too.

### 4. Code Conventions First (All)
Universal pattern across Claude Code, Cursor, Devin, Windsurf:
- "First understand the file's code conventions"
- "NEVER assume a library is available — check package.json first"
- "Look at neighboring files, mimic code style"
- "When you create a new component, first look at existing components"

**Relevance:** Our research step already does this, but the build prompt should reinforce "follow patterns from RESEARCH.md."

### 5. No Comments Unless Asked (Claude Code, Devin)
- Claude Code: "IMPORTANT: DO NOT ADD ANY COMMENTS unless asked"
- Devin: "Do not add comments to the code you write, unless the user asks"

**Relevance:** Could add this to our build prompt — AI-generated comments are usually noise.

### 6. Concise Output (Claude Code)
Claude Code is extremely aggressive about brevity:
- "Fewer than 4 lines unless user asks for detail"
- "Minimize output tokens as much as possible"
- "One word answers are best"
- "NEVER add unnecessary preamble or postamble"

**Relevance:** Our piped steps (spec, plan, review) want detailed output, but the build step should be concise — focus on coding, not explaining.

### 7. Verify Before Claiming Done (Claude Code, Devin, Cursor)
- Claude Code: "Run lint and typecheck commands when completed"
- Devin: "Critically examine your work before reporting completion"
- Cursor: "Gate before new edits — reconcile TODO list"

**Relevance:** Our build prompt has quality gates but could be more emphatic. The review step catches issues, but catching them in build is cheaper.

### 8. Never Commit Unless Asked (Claude Code)
- "NEVER commit changes unless the user explicitly asks"

**Relevance:** Our pipeline has a dedicated commit step, so this is handled architecturally. Good validation of our approach.

## Interesting Architectural Differences

| Tool | Planning | Execution | Review |
|------|----------|-----------|--------|
| Claude Code | TodoWrite | Sequential + Task tool | Lint/typecheck |
| Cursor | todo_write with merge | Parallel tool calls | Summary spec |
| Devin | Explicit plan mode | Standard mode with think gates | CI-based |
| Windsurf | Inline | Sequential | Terminal run |
| cc-pipeline | Separate spec/plan steps | Agent teams (parallel) | Dedicated review step |

Our pipeline's separated planning → building → reviewing is more structured than any of these. They all do it in one session. That's our advantage for larger projects.

## TODO
- [ ] Add "no comments unless asked" to build prompt
- [ ] Add TodoWrite encouragement to build prompt for team lead task tracking
- [ ] Consider adding "think before acting" gate to fix prompt (Devin pattern)
- [ ] Test whether explicit "run lint/typecheck" instruction in build prompt catches more issues before review
