import { BaseAgent, AgentContext, AgentResult, StepDef } from './base.js';
/**
 * Bash agent - executes shell commands
 * Ports run_bash from run.sh: substitute {{PHASE}} and execute via spawn
 */
export declare class BashAgent extends BaseAgent {
    run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult>;
}
//# sourceMappingURL=bash.d.ts.map