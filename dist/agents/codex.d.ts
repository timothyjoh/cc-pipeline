import { BaseAgent, AgentContext, AgentResult, StepDef } from './base.js';
/**
 * Codex agent — shells out to the `codex` CLI with --yolo.
 * Always runs in auto-approval mode. Model can be set per-step or left to
 * the codex CLI default.
 *
 * An inactivity timeout kills and retries the process if no output is seen
 * for INACTIVITY_MS. After MAX_ATTEMPTS consecutive inactivity failures the
 * step is marked as an error with all accumulated output preserved.
 *
 * Usage in workflow.yaml:
 *   agent: codex
 *   model: o4-mini   # optional — omit to use codex's default model
 */
export declare class CodexAgent extends BaseAgent {
    run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult>;
    private spawnOnce;
}
export declare function createAgent(): CodexAgent;
//# sourceMappingURL=codex.d.ts.map