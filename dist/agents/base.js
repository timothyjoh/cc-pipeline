import { EventEmitter } from 'node:events';
/**
 * Shared state for tracking the current child process
 * The engine signal handler needs access to this to kill the process on Ctrl-C
 */
class AgentState extends EventEmitter {
    currentChild;
    interrupted;
    constructor() {
        super();
        this.currentChild = null;
        this.interrupted = false;
    }
    setChild(child) {
        this.currentChild = child;
    }
    getChild() {
        return this.currentChild;
    }
    clearChild() {
        this.currentChild = null;
    }
    setInterrupted(value) {
        this.interrupted = value;
        if (value) {
            this.emit('interrupt');
        }
    }
    isInterrupted() {
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
    async run(phase, step, promptPath, model, context) {
        throw new Error('Agent must implement run() method');
    }
}
//# sourceMappingURL=base.js.map