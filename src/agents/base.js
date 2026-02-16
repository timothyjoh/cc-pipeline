import { EventEmitter } from 'node:events';

/**
 * Shared state for tracking the current child process
 * The engine signal handler needs access to this to kill the process on Ctrl-C
 */
class AgentState extends EventEmitter {
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
 *
 * @param {number} phase - Current phase number
 * @param {object} step - Step definition from workflow.yaml
 * @param {string} promptPath - Relative path to prompt file (for claude agents)
 * @param {string} model - Model name to use
 * @param {object} context - { projectDir, config, logFile }
 * @returns {Promise<{exitCode: number, outputPath: string|null}>}
 */
export class BaseAgent {
  async run(phase, step, promptPath, model, context) {
    throw new Error('Agent must implement run() method');
  }
}
