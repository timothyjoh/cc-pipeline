import { spawn } from 'node:child_process';
import { createWriteStream, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';

/**
 * Claude Piped Agent
 * Runs `claude -p` with a generated prompt for spec, research, plan, review, reflect steps
 *
 * Port of run_claude_piped from run.sh lines 272-291
 */
export class ClaudePipedAgent extends BaseAgent {
  /**
   * @param {number} phase - Current phase number
   * @param {object} step - Step definition from workflow.yaml
   * @param {string} promptPath - Relative path to prompt file (e.g., "prompts/spec.md")
   * @param {string} model - Model name to use (optional)
   * @param {object} context - { projectDir, config, logFile }
   * @returns {Promise<{exitCode: number, outputPath: string}>}
   */
  async run(phase, step, promptPath, model, context) {
    const { projectDir, config } = context;
    const pipelineDir = join(projectDir, '.pipeline');

    // Generate prompt with substitutions
    const prompt = generatePrompt(projectDir, config, phase, promptPath);

    // Write prompt to current-prompt.md
    const promptFile = join(pipelineDir, 'current-prompt.md');
    writeFileSync(promptFile, prompt, 'utf-8');

    // Build command arguments
    const args = ['-p', '--dangerously-skip-permissions'];
    if (model && model !== 'default') {
      args.push('--model', model);
    }

    // Output path
    const outputPath = join(pipelineDir, 'step-output.log');
    const outputStream = createWriteStream(outputPath, { flags: 'w' });

    // Spawn claude process — pipe prompt via stdin to avoid OS arg length limits
    const child = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectDir
    });

    // Write prompt to stdin
    child.stdin.write(prompt);
    child.stdin.end();

    // Pipe stdout and stderr to output file (2>&1 equivalent)
    child.stdout.pipe(outputStream);
    child.stderr.pipe(outputStream);

    // Register with AgentState for signal handling
    agentState.setChild(child);

    // Wait for completion — use 'close' to ensure stdio streams are fully flushed
    const exitCode = await new Promise((resolve) => {
      child.on('close', (code) => {
        resolve(code ?? 1);
      });
    });

    // Clean up
    agentState.clearChild();
    outputStream.end();

    return { exitCode, outputPath };
  }
}

/**
 * Factory function for engine.js
 * @returns {ClaudePipedAgent}
 */
export function createAgent() {
  return new ClaudePipedAgent();
}
