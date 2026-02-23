import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';

/**
 * Claude Piped Agent
 * Runs claude via the Agent SDK query() API for spec, research, plan, review, reflect steps
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
    const { projectDir, config, logFile } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const outputPath = join(pipelineDir, 'step-output.log');

    // Generate prompt with substitutions
    const promptText = generatePrompt(projectDir, config, phase, promptPath);

    // Write prompt to current-prompt.md for inspection
    const promptFile = join(pipelineDir, 'current-prompt.md');
    writeFileSync(promptFile, promptText, 'utf-8');

    // Check interrupt before starting
    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    const controller = new AbortController();
    const onInterrupt = () => controller.abort();
    agentState.on('interrupt', onInterrupt);

    const log = (msg) => {
      if (logFile) {
        try { appendFileSync(logFile, msg + '\n', 'utf-8'); } catch (_) {}
      }
    };

    const outputChunks = [];

    try {
      const queryOptions = {
        maxTurns: 200,
        permissionMode: 'bypassPermissions',
        // CRITICAL: unset CLAUDECODE to prevent SDK conflict when running inside Claude Code
        env: { ...process.env, CLAUDECODE: undefined },
        hooks: {
          SubagentStart: [async (data) => {
            log(`[sdk] subagent_start agent_id=${data.agent_id ?? ''}`);
          }],
          SubagentStop: [async (data) => {
            const msg = data.last_assistant_message ?? '';
            log(`[sdk] subagent_stop agent_id=${data.agent_id ?? ''} msg=${msg.substring(0, 120)}`);
          }],
          PostToolUse: [async (data) => {
            const name = data.tool_name ?? '';
            const dur = data.duration_ms != null ? ` ${data.duration_ms}ms` : '';
            log(`[sdk] tool_use tool=${name}${dur}`);
          }],
        },
      };

      if (model && model !== 'default') {
        queryOptions.model = model;
      }

      for await (const event of query({
        prompt: promptText,
        options: queryOptions,
        abortController: controller,
      })) {
        if (event.type === 'assistant' && event.message?.role === 'assistant') {
          for (const block of event.message.content ?? []) {
            if (block.type === 'text') {
              outputChunks.push(block.text);
            }
          }
        }
      }
    } catch (err) {
      agentState.off('interrupt', onInterrupt);

      if (agentState.interrupted || controller.signal.aborted) {
        writeFileSync(outputPath, outputChunks.join('\n'), 'utf-8');
        return { exitCode: 130, outputPath };
      }

      const errorText = `Error: ${err.message}\n${err.stack ?? ''}`;
      writeFileSync(outputPath, errorText, 'utf-8');
      return { exitCode: 1, outputPath };
    }

    agentState.off('interrupt', onInterrupt);

    writeFileSync(outputPath, outputChunks.join('\n'), 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    return { exitCode: 0, outputPath };
  }
}

/**
 * Factory function for engine.js
 * @returns {ClaudePipedAgent}
 */
export function createAgent() {
  return new ClaudePipedAgent();
}
