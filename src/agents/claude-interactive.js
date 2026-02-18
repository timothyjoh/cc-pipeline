import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, basename } from 'node:path';
import { generatePrompt } from '../prompts.js';
import { BaseAgent, agentState } from './base.js';

/**
 * Escape a string for safe use inside double-quoted shell arguments.
 */
function shellEscape(str) {
  return str.replace(/["$`\\!]/g, '\\$&');
}

/**
 * Claude Interactive Agent
 * Runs claude or codex in an interactive tmux session
 * Ports start_interactive, run_interactive, stop_interactive from run.sh
 */
export class ClaudeInteractiveAgent extends BaseAgent {
  /**
   * Main entry point for the agent
   * @param {number} phase - Current phase number
   * @param {object} step - Step definition from workflow.yaml
   * @param {string} promptPath - Relative path to prompt file
   * @param {string} model - Model name to use (optional)
   * @param {object} context - { projectDir, config, logFile }
   * @returns {Promise<{exitCode: number, outputPath: string|null}>}
   */
  async run(phase, step, promptPath, model, context) {
    const { projectDir, config } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const agent = step.agent; // 'claude-interactive' or 'codex-interactive'

    // Generate prompt
    const prompt = generatePrompt(projectDir, config, phase, promptPath);
    const promptFile = join(pipelineDir, 'current-prompt.md');
    const sentinelFile = join(pipelineDir, '.step-done');

    // Write prompt with sentinel instruction
    const sentinelInstruction = `\n\n---\nWhen you have completed ALL tasks above, run this command as your FINAL action:\n\`touch ${sentinelFile}\``;
    writeFileSync(promptFile, prompt + sentinelInstruction, 'utf-8');

    // Remove any existing sentinel
    if (existsSync(sentinelFile)) {
      unlinkSync(sentinelFile);
    }

    try {
      // Start interactive session
      const sessionName = await this.startInteractive(agent, model, projectDir);

      // Deliver prompt
      await this.deliverPrompt(promptFile, sessionName);

      // Poll for sentinel
      await this.pollForSentinel(sentinelFile);

      // Cleanup
      if (existsSync(sentinelFile)) {
        unlinkSync(sentinelFile);
      }
      await this.sleep(1000);

      // Stop session
      await this.stopInteractive(sessionName);

      return {
        exitCode: 0,
        outputPath: null
      };
    } catch (error) {
      // If interrupted or failed, still try to stop the session
      const sessionName = basename(projectDir);
      try {
        await this.stopInteractive(sessionName);
      } catch (e) {
        // Ignore errors during cleanup
      }
      throw error;
    }
  }

  /**
   * Start an interactive Claude/Codex session in tmux
   * Ports start_interactive from run.sh (lines 318-358)
   * @param {string} agent - 'claude-interactive' or 'codex-interactive'
   * @param {string} model - Model name (optional)
   * @param {string} projectDir - Project directory path
   * @returns {Promise<string>} The tmux session name
   */
  async startInteractive(agent, model, projectDir) {
    const sessionName = basename(projectDir);

    // Build command — escape values for safe shell interpolation
    const safeDir = shellEscape(projectDir);
    const safeModel = model ? shellEscape(model) : null;
    let cmd;
    if (agent === 'claude-interactive') {
      cmd = `cd "${safeDir}" && claude --dangerously-skip-permissions`;
      if (safeModel && safeModel !== 'default') {
        cmd = `cd "${safeDir}" && claude --model "${safeModel}" --dangerously-skip-permissions`;
      }
    } else if (agent === 'codex-interactive') {
      cmd = `cd "${safeDir}" && codex`;
      if (safeModel && safeModel !== 'default') {
        cmd = `cd "${safeDir}" && codex --model "${safeModel}"`;
      }
    } else {
      throw new Error(`Unknown interactive agent: ${agent}`);
    }

    const safeSession = shellEscape(sessionName);

    // Create tmux session if not exists
    try {
      execSync(`tmux has-session -t "${safeSession}" 2>/dev/null`);
    } catch (e) {
      execSync(`tmux new-session -d -s "${safeSession}" -c "${safeDir}"`);
    }

    // Clear CLAUDECODE env var to prevent "nested session" detection
    // This gets set if the user previously ran Claude Code in this shell
    // Also enable experimental agent teams feature
    execSync(`tmux send-keys -t "${safeSession}" "unset CLAUDECODE && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1" Enter`);
    await this.sleep(500);

    console.log(`  Starting ${agent} session in tmux...`);
    execSync(`tmux send-keys -t "${safeSession}" "${cmd}" Enter`);

    // Poll for startup - check for startup markers
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      // Check for interruption
      if (agentState.isInterrupted()) {
        throw new Error('Interrupted during startup');
      }

      try {
        const paneContent = execSync(
          `tmux capture-pane -t "${safeSession}" -p -S -5 2>/dev/null`,
          { encoding: 'utf-8' }
        );

        // Check for startup markers
        if (/(bypass permissions|Welcome back|Claude Code v|Codex CLI)/.test(paneContent)) {
          await this.sleep(3000);
          console.log(`  ${agent} session started`);
          return sessionName;
        }
      } catch (e) {
        // Ignore capture errors, keep polling
      }

      await this.sleep(pollInterval);
    }

    // Capture final pane content for diagnostics
    let finalPane = '(unable to capture)';
    try {
      finalPane = execSync(
        `tmux capture-pane -t "${safeSession}" -p -S -20 2>/dev/null`,
        { encoding: 'utf-8' }
      );
    } catch (e) { /* ignore */ }
    console.error(`\n  ⚠️  Tmux pane content at timeout:\n${finalPane}`);
    throw new Error(`${agent} failed to start after 60s`);
  }

  /**
   * Deliver the prompt to the interactive session via tmux.
   * Instead of pasting the full prompt (fragile with large text),
   * we tell Claude to read the prompt file directly using @-mention syntax.
   * @param {string} promptFile - Path to the prompt file
   * @param {string} sessionName - Tmux session name
   */
  async deliverPrompt(promptFile, sessionName) {
    const safeSession = shellEscape(sessionName);
    const instruction = `Read and follow all instructions in @${promptFile}`;
    const safeInstruction = shellEscape(instruction);
    execSync(`tmux send-keys -t "${safeSession}" "${safeInstruction}"`);
    execSync(`sleep 0.5`);
    execSync(`tmux send-keys -t "${safeSession}" Enter`);
  }

  /**
   * Poll for the sentinel file that indicates step completion
   * @param {string} sentinelFile - Path to the sentinel file
   */
  async pollForSentinel(sentinelFile) {
    console.log('  Waiting for step completion...');

    while (!existsSync(sentinelFile)) {
      // Check for interruption
      if (agentState.isInterrupted()) {
        throw new Error('Interrupted during execution');
      }

      await this.sleep(5000);
    }

    console.log('  Step completed');
  }

  /**
   * Stop the interactive session
   * Ports stop_interactive from run.sh (lines 360-375)
   * @param {string} sessionName - Tmux session name
   */
  async stopInteractive(sessionName) {
    console.log('  Stopping interactive session...');
    const safeSession = shellEscape(sessionName);

    try {
      const paneContent = execSync(
        `tmux capture-pane -t "${safeSession}" -p -S -3 2>/dev/null`,
        { encoding: 'utf-8' }
      );

      // Check if already at shell prompt
      if (/(^\$|%\s*$)/.test(paneContent)) {
        console.log('  Session already exited');
        return;
      }
    } catch (e) {
      // If we can't capture, assume session is gone
      console.log('  Session not found');
      return;
    }

    // Send exit command
    execSync(`tmux send-keys -t "${safeSession}" "/exit" Enter Enter`);
    await this.sleep(1000);
    execSync(`tmux send-keys -t "${safeSession}" Escape`);
    await this.sleep(500);
    execSync(`tmux send-keys -t "${safeSession}" Enter Enter`);
    await this.sleep(2000);

    console.log('  Session stopped');
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
