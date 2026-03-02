import { BaseAgent } from './base.js';
/**
 * Claude Interactive Agent
 * Runs claude via the Agent SDK query() API for build/fix steps.
 * Replaces the old tmux-based interactive session approach.
 */
export declare class ClaudeInteractiveAgent extends BaseAgent {
    run(phase: number, step: any, promptPath: string | null, model: string, context: any): Promise<{
        exitCode: number;
        outputPath: string;
        usage?: undefined;
    } | {
        exitCode: number;
        outputPath: string;
        usage: {
            costUSD: number;
        };
    }>;
}
/**
 * Factory function for engine.js
 */
export declare function createAgent(): ClaudeInteractiveAgent;
//# sourceMappingURL=claude-interactive.d.ts.map