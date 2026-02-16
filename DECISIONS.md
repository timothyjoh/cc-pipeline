# Decisions Log

## 2026-02-16: Node.js over Bash
**Context:** Original pipeline was ~630 lines of bash. Signal handling (Ctrl-C) was a nightmare — process groups, `wait` not interrupting, backgrounded sleep hacks.
**Decision:** Rewrite in Node.js. `child_process.spawn` gives proper signal forwarding, async/await replaces polling loops.
**Tradeoff:** Adds Node dependency, but pipeline users likely have Node anyway.

## 2026-02-16: ESM + No Build Step
**Decision:** Use ES modules (type: "module"), no TypeScript, no bundler. Keep it simple.
**Rationale:** Fewer deps, faster install, easier to hack on. Node >=18 supports ESM natively.

## 2026-02-16: `yaml` as Only Dependency
**Decision:** Single runtime dep for YAML parsing. Everything else uses Node builtins.
**Rationale:** Fast install, minimal supply chain risk. JSONL is just JSON + fs. Child processes are built-in.

## 2026-02-16: Language/Framework Agnostic
**Decision:** Pipeline is Node.js but the *target project* can be anything.
**Rationale:** BRIEF.md is the interface. Claude Code handles any language. Pipeline just orchestrates.
