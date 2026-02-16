import { spawn } from 'node:child_process';
import { BaseAgent, agentState } from './base.js';

/**
 * Bash agent - executes shell commands
 * Ports run_bash from run.sh: substitute {{PHASE}} and execute via spawn
 */
export class BashAgent extends BaseAgent {
  async run(phase, step, promptPath, model, context) {
    const { command } = step;

    if (!command) {
      throw new Error('Bash agent requires a command in step definition');
    }

    // Substitute {{PHASE}} placeholder
    const cmd = command.replace(/\{\{PHASE\}\}/g, phase.toString());

    console.log(`  Executing: ${cmd}`);

    return new Promise((resolve) => {
      // Spawn shell process
      const child = spawn(cmd, {
        shell: true,
        stdio: 'inherit',
        cwd: context.projectDir
      });

      // Track child process for signal handling
      agentState.setChild(child);

      child.on('close', (code) => {
        agentState.clearChild();
        resolve({
          exitCode: code || 0,
          outputPath: null
        });
      });

      child.on('error', (err) => {
        agentState.clearChild();
        console.error(`Bash agent error: ${err.message}`);
        resolve({
          exitCode: 1,
          outputPath: null
        });
      });
    });
  }
}
