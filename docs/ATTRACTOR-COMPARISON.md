# Attractor vs cc-pipeline: Comparative Analysis

*Written 2026-02-18. Based on StrongDM's [Attractor](https://github.com/strongdm/attractor) repo (3 NLSpec files, ~5700 lines) and cc-pipeline v0.5.0.*

---

## TL;DR

Attractor is a **general-purpose DAG pipeline engine** for orchestrating any multi-stage AI workflow — it's infrastructure for building software factories. cc-pipeline is an **opinionated phased build tool** specifically for turning project briefs into working software using Claude Code. They solve related but different problems at different layers of the stack. Attractor is the engine; cc-pipeline is a car built on a simpler engine with the same destination.

---

## 1. Architecture Comparison

### Attractor: Graph-Based DAG Orchestration

- **Pipeline definition**: Graphviz DOT files — nodes are AI tasks, edges are transitions with conditions
- **Node types**: LLM calls (codergen), human gates, conditional branches, parallel fan-out/fan-in, tool execution, supervisor loops
- **Edge routing**: 5-step deterministic algorithm (condition match → preferred label → suggested IDs → weight → lexical)
- **State**: Rich context object with variable expansion, fidelity modes (full/summary/none), thread-based session reuse
- **Retry**: Per-node with exponential backoff, goal gates that block pipeline exit until critical nodes succeed, retry targets for re-routing
- **Scope**: Any AI workflow — code gen, review, deployment, analysis. Not opinionated about what you build.

### cc-pipeline: Linear Phased Build Engine

- **Pipeline definition**: YAML workflow with ordered steps per phase
- **Step types**: spec, research, plan, build, review, fix, commit, reflect, status
- **Routing**: Linear — steps execute in order, retry on failure, skip on conditions
- **State**: JSONL event log, phase reflections carry forward
- **Retry**: 3 attempts with 30s/60s backoff, process.exit(1) on max retries
- **Scope**: Specifically building software from a brief using Claude Code in tmux

### Key Structural Differences

| Aspect | Attractor | cc-pipeline |
|--------|-----------|-------------|
| **Topology** | Arbitrary DAG (branches, loops, fan-out) | Linear step sequence per phase |
| **Definition format** | Graphviz DOT | YAML |
| **Agent backend** | Any (Claude, Codex, Gemini via unified SDK) | Claude Code only (interactive tmux) |
| **Human-in-the-loop** | First-class hexagon nodes with option selection | None (fully autonomous per phase) |
| **Parallelism** | Native fan-out/fan-in nodes | Agent Teams (experimental, within build step) |
| **Visualization** | DOT renders to SVG/PNG automatically | STATUS.md text summary |

**Verdict**: Attractor is dramatically more flexible but also dramatically more complex. cc-pipeline's opinionated linearity is a feature — you don't need DAG routing when the workflow is always spec→plan→build→review→fix→commit→reflect.

---

## 2. Quality Assurance: Scenarios vs Adversarial Review

This is the most interesting comparison and the one Butter flagged.

### Attractor's Scenario Approach

From the Nate B Jones video and StrongDM's documentation:
- **Scenarios live outside the codebase** — behavioral specs the agent never sees during development
- **Function as a holdout set** (ML terminology) — prevents the agent from "teaching to the test"
- **Evaluate from the outside**: "Does the software do X?" not "Does test Y pass?"
- **Digital twin environments**: Simulated versions of external services for integration testing

### cc-pipeline's Adversarial Review Round

- **Review step**: A separate Claude Code session reads the code and writes a critical review
- **Fix step**: Another session addresses the review findings
- **Reflection step**: Captures lessons learned for the next phase
- **The agent CAN see the tests** — in fact, it writes them during the build step

### Head-to-Head Analysis

**What scenarios catch that adversarial review doesn't:**
- Agent gaming its own tests (writing tests that pass by construction)
- Subtle behavioral regressions invisible in code review
- Integration-level issues that only surface with real service interactions
- "Looks correct in code review but doesn't actually work" failures

**What adversarial review catches that scenarios don't:**
- Code quality, maintainability, readability issues
- Architectural problems (coupling, abstraction leaks)
- Security vulnerabilities in the implementation
- Missing edge cases the scenario author didn't think of
- Convention violations, documentation gaps

**The honest answer**: They test different things. Scenarios test **behavioral correctness** from the outside. Adversarial review tests **code quality** from the inside. Neither is overkill — they're complementary.

### Is the Scenario Approach Overkill for cc-pipeline?

**No, but the full StrongDM version might be.** Their digital twin universe (simulated Okta, Jira, Slack, etc.) is heavy infrastructure for a general-purpose build tool. But the core idea — **external behavioral tests the agent can't see during build** — is lightweight and powerful.

**Minimum viable scenarios for cc-pipeline:**
1. User writes behavioral acceptance criteria in BRIEF.md (they already do this)
2. After the build step, a *separate* evaluation step runs those criteria against the built software
3. The evaluator has access to the running app but NOT the source code
4. Pass/fail feeds back into the fix cycle

This is essentially our review step but from the **user's perspective** instead of the **developer's perspective**.

---

## 3. What Attractor Does That We Don't

### 3.1 Graph-Based Workflow (Good for Them, Not for Us)
DAG routing is powerful but our linear workflow is simpler and sufficient. We don't need conditional branches — every project goes through the same steps. **Skip.**

### 3.2 Goal Gates (Worth Stealing)
Nodes marked `goal_gate=true` MUST succeed before the pipeline can exit. If they fail, the pipeline re-routes to a retry target. We have retry logic per step, but no concept of "the pipeline cannot finish until X succeeds." 

**Steal this**: Mark the build step and test-pass as goal gates. The pipeline shouldn't advance to commit if tests don't pass, even if the review/fix cycle has been exhausted.

### 3.3 Context Fidelity Modes (Worth Considering)
Attractor has `full`, `summary`, and `none` fidelity modes for LLM context — controlling how much history each node sees. This prevents context bloat on long pipelines.

**Steal this**: Our phases start with fresh Claude Code sessions, which is similar to `none` fidelity. But within a phase, the build→review→fix cycle accumulates context. A summary mode between phases (via REFLECTIONS.md) is already what we do, but we could be more deliberate.

### 3.4 Model Stylesheet (Nice to Have)
CSS-like syntax for assigning different models to different node types. Haiku for tests, Opus for architecture decisions, Sonnet for implementation.

**We already have this** partially — `workflow.yaml` allows per-step model overrides. Could be more granular (per-phase-per-step).

### 3.5 Parallel Fan-Out (Future Consideration)
Attractor natively supports parallel branches. We rely on Agent Teams for parallelism within a step, but can't run multiple steps in parallel.

**Park this**: Not needed for our linear workflow, but if we ever add independent sub-features that can be built in parallel across phases, this matters.

### 3.6 Human-in-the-Loop Gates (Intentionally Skipped)
Attractor has hexagon nodes that pause for human approval. We're explicitly going for autonomous operation — the human writes the brief and checks the output, but doesn't approve individual steps.

**Keep skipping**: Our target is "dark factory" autonomous operation. Human gates would regress toward Level 3 (developer as manager) instead of Level 4-5.

### 3.7 Event Stream Architecture
Every action emits typed events for UI rendering. We have JSONL logging but no real-time event stream.

**Nice to have** for a future TUI/web dashboard showing pipeline progress.

---

## 4. What cc-pipeline Does That Attractor Doesn't

### 4.1 Phased Multi-Feature Development
Attractor runs one workflow. cc-pipeline runs the same workflow *N times* across phases, with each phase building on the last. The reflection→spec loop that accumulates learnings across phases is unique.

### 4.2 Opinionated Build Prompts
Our prompt templates encode hard-won knowledge about how to get good output from Claude Code — Agent Teams patterns, anti-patterns ("Do NOT use Task tool"), vertical slice enforcement. Attractor's `prompt` attribute is a raw string.

### 4.3 Agent Teams Integration
We explicitly enable and prompt for Claude Code's experimental Agent Teams feature. Attractor is agent-agnostic and doesn't optimize for any specific coding agent's features.

### 4.4 Zero-Config Developer Experience
`npx cc-pipeline@latest init` → write a brief → `npx cc-pipeline run`. Attractor requires you to implement the engine from the spec first (it's an NLSpec, not a tool).

### 4.5 Frontend Design Skill
We install Anthropic's frontend-design skill automatically. Attractor doesn't touch design or UI quality.

### 4.6 Adversarial Code Review
Our review→fix cycle is a first-class step. Attractor has no built-in concept of "review the code you just wrote" — you'd have to build it into your DOT graph.

---

## 5. Recommendations

### Adopt Now (Low Effort, High Value)

1. **Goal Gates for Tests**: Add a concept where the build step's test results are a gate — if tests fail after the fix cycle, the phase fails rather than silently committing broken code. Currently we commit whatever the fix step produces.

2. **External Acceptance Criteria**: Encourage users to write behavioral acceptance criteria in BRIEF.md that get evaluated *after* build, separately from the agent's own tests. This is the lightweight version of scenarios.

3. **"No Gaming" Prompt Injection**: Add to the build prompt: "Write tests that genuinely verify behavior, not tests designed to pass. A separate evaluator will verify your work against criteria you cannot see." This is the psychological version of scenario holdout — even without actual hidden tests, telling the agent its work will be independently evaluated changes its behavior.

### Adopt Later (Medium Effort)

4. **Scenario Step**: Add an optional `evaluate` step after `build` that runs acceptance criteria from a separate file (`.pipeline/scenarios.md`) against the built software. The evaluate step's Claude Code session does NOT have access to the source — only to the running application and the scenarios.

5. **Event Stream**: Emit structured events during pipeline execution for a future TUI/dashboard.

### Don't Adopt (Wrong Layer)

6. **DOT-based workflow definition**: Our YAML is simpler and sufficient. Graph routing adds complexity without value for a linear pipeline.

7. **Custom agent loop**: We use Claude Code directly, which is the right call. Building a custom agentic loop from scratch (as Attractor's coding-agent-loop-spec defines) is a massive undertaking that only makes sense if you need multi-provider support or deep programmatic control.

8. **Digital twin environments**: Too much infrastructure for a general-purpose build tool. Let users bring their own test environments.

---

## Summary

Attractor is an ambitious, beautifully engineered spec for building software factories from scratch. It's the infrastructure layer — you'd build something like cc-pipeline *on top of* Attractor. But for our use case (opinionated phased builds with Claude Code), we're better served by staying simple and stealing specific ideas:

- **Goal gates** for test enforcement
- **External evaluation** as a lightweight scenario system  
- **Anti-gaming prompts** to get the behavioral benefits of holdout sets without the infrastructure

Our adversarial review round is genuinely good and catches things scenarios wouldn't (code quality, architecture, conventions). The ideal system has both: internal adversarial review AND external behavioral evaluation. That's the roadmap.

---

*"The dark factory doesn't need more engineers, but it desperately needs better ones." — Nate B Jones*
