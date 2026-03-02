import { BaseAgent, AgentContext, AgentResult, StepDef } from './base.js';
/**
 * ClaudeCode Agent
 * Runs all AI pipeline steps via the Agent SDK query() API.
 * Handles spec/research/plan/review/reflect (text streaming) and
 * build/fix (tool-heavy) steps with the same implementation.
 *
 * Watchdog: if no writes to the step log occur for idleTimeoutMs, the query
 * is aborted and exitCode 1 is returned so the engine retry logic kicks in.
 */
export declare class ClaudeCodeAgent extends BaseAgent {
    run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult>;
}
export declare function createAgent(): ClaudeCodeAgent;
//# sourceMappingURL=claudecode.d.ts.map