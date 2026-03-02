import { EventEmitter } from 'node:events';
export interface AgentContext {
    projectDir: string;
    config: any;
    logFile: string | null;
}
export interface AgentResult {
    exitCode: number;
    outputPath: string | null;
    error?: string;
    usage?: {
        costUSD: number;
    };
}
export interface StepDef {
    name: string;
    agent: string;
    prompt?: string;
    model?: string;
    command?: string;
    skipUnless?: string;
    output?: string;
    testGate?: boolean;
    description?: string;
    continueOnError?: boolean;
    /** Milliseconds of log-file inactivity before the watchdog aborts the step. Default: 20 minutes. */
    idleTimeoutMs?: number;
}
/**
 * Shared state for tracking the current child process
 * The engine signal handler needs access to this to kill the process on Ctrl-C
 */
declare class AgentState extends EventEmitter {
    currentChild: any;
    interrupted: boolean;
    constructor();
    setChild(child: any): void;
    getChild(): any;
    clearChild(): void;
    setInterrupted(value: boolean): void;
    isInterrupted(): boolean;
}
export declare const agentState: AgentState;
/**
 * Base interface for all agents.
 * All agents must implement the run() method with this signature.
 */
export declare class BaseAgent {
    run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult>;
}
export {};
//# sourceMappingURL=base.d.ts.map