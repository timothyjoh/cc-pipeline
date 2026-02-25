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
  usage?: { costUSD: number };
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
}

/**
 * Shared state for tracking the current child process
 * The engine signal handler needs access to this to kill the process on Ctrl-C
 */
class AgentState extends EventEmitter {
  currentChild: any;
  interrupted: boolean;

  constructor() {
    super();
    this.currentChild = null;
    this.interrupted = false;
  }

  setChild(child: any): void {
    this.currentChild = child;
  }

  getChild(): any {
    return this.currentChild;
  }

  clearChild(): void {
    this.currentChild = null;
  }

  setInterrupted(value: boolean): void {
    this.interrupted = value;
    if (value) {
      this.emit('interrupt');
    }
  }

  isInterrupted(): boolean {
    return this.interrupted;
  }
}

// Singleton instance
export const agentState = new AgentState();

/**
 * Base interface for all agents.
 * All agents must implement the run() method with this signature.
 */
export class BaseAgent {
  async run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult> {
    throw new Error('Agent must implement run() method');
  }
}
