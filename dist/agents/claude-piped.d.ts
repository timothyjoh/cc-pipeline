import { BaseAgent } from './base.js';
/**
 * Claude Piped Agent
 * Runs claude via the Agent SDK query() API for spec, research, plan, review, reflect steps
 */
export declare class ClaudePipedAgent extends BaseAgent {
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
export declare function createAgent(): ClaudePipedAgent;
//# sourceMappingURL=claude-piped.d.ts.map