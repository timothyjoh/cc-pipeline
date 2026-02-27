import { spawn } from 'node:child_process';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BaseAgent, agentState, AgentContext, AgentResult, StepDef } from './base.js';

/**
 * Bash agent - executes shell commands
 * Ports run_bash from run.sh: substitute {{PHASE}} and execute via spawn
 */
export class BashAgent extends BaseAgent {
  async run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult> {
    const { command } = step;

    if (!command) {
      throw new Error('Bash agent requires a command in step definition');
    }

    // Substitute {{PHASE}} placeholder
    const cmd = command.replace(/\{\{PHASE\}\}/g, phase.toString());

    console.log(`  Executing: ${cmd}`);

    const logDir = join(context.projectDir, '.pipeline', 'logs', `phase-${phase}`);
    mkdirSync(logDir, { recursive: true });
    const outputPath = join(logDir, `step-${step.name}.log`);
    writeFileSync(outputPath, `$ ${cmd}\n`, 'utf-8');

    return new Promise((resolve) => {
      // Pipe stdout/stderr so output is captured for TUI and not swallowed
      const child = spawn(cmd, {
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: context.projectDir
      });

      // Track child process for signal handling
      agentState.setChild(child);

      const onData = (chunk: Buffer) => {
        try { appendFileSync(outputPath, chunk.toString(), 'utf-8'); } catch (_) {}
      };

      child.stdout?.on('data', onData);
      child.stderr?.on('data', onData);

      child.on('close', (code) => {
        agentState.clearChild();
        resolve({
          exitCode: code ?? 1,
          outputPath
        });
      });

      child.on('error', (err) => {
        agentState.clearChild();
        const msg = `Bash agent error: ${err.message}\n`;
        try { appendFileSync(outputPath, msg, 'utf-8'); } catch (_) {}
        resolve({
          exitCode: 1,
          outputPath
        });
      });
    });
  }
}
