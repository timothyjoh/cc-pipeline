import { EventEmitter } from 'node:events';
import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';

/**
 * Module-level event emitter — TUI subscribes to this from outside.
 * Events: 'tool:start', 'tool:done', 'subagent:start', 'subagent:done', 'session:stop'
 */
export const pipelineEvents = new EventEmitter();

/**
 * Claude Interactive Agent
 * Runs claude via the Agent SDK query() API for build/fix steps.
 * Replaces the old tmux-based interactive session approach.
 */
export class ClaudeInteractiveAgent extends BaseAgent {
  /**
   * @param {number} phase - Current phase number
   * @param {object} step - Step definition from workflow.yaml
   * @param {string} promptPath - Relative path to prompt file
   * @param {string} model - Model name to use (optional)
   * @param {object} context - { projectDir, config, logFile }
   * @returns {Promise<{exitCode: number, outputPath: string}>}
   */
  async run(phase, step, promptPath, model, context) {
    const { projectDir, config, logFile } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const outputPath = join(pipelineDir, 'step-output.log');

    const promptText = generatePrompt(projectDir, config, phase, promptPath);
    writeFileSync(join(pipelineDir, 'current-prompt.md'), promptText, 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    const controller = new AbortController();
    const onInterrupt = () => controller.abort();
    agentState.on('interrupt', onInterrupt);

    // Initialize output file
    writeFileSync(outputPath, '', 'utf-8');

    const log = (msg) => {
      if (logFile) {
        try { appendFileSync(logFile, msg + '\n', 'utf-8'); } catch (_) {}
      }
    };

    const appendOutput = (line) => {
      try { appendFileSync(outputPath, line + '\n', 'utf-8'); } catch (_) {}
    };

    const outputChunks = [];

    try {
      const queryOptions = {
        maxTurns: 500,
        permissionMode: 'bypassPermissions',
        env: { ...process.env, CLAUDECODE: undefined },
        hooks: {
          PreToolUse: [async (data) => {
            const line = `[tool:start] ${data.tool_name} ${JSON.stringify(data.tool_input ?? {}).slice(0, 120)}`;
            log(line);
            appendOutput(line);
            pipelineEvents.emit('tool:start', { phase, step: step.name, tool: data.tool_name, input: data.tool_input });
          }],
          PostToolUse: [async (data) => {
            const success = !data.tool_response?.is_error;
            const line = `[tool:done]  ${data.tool_name} ${success ? '✓' : '✗'}`;
            log(line);
            appendOutput(line);
            pipelineEvents.emit('tool:done', { phase, step: step.name, tool: data.tool_name, success });
          }],
          SubagentStart: [async (data) => {
            const line = `[subagent:start] ${data.agent_id}`;
            log(line);
            appendOutput(line);
            pipelineEvents.emit('subagent:start', { phase, step: step.name, agentId: data.agent_id });
          }],
          SubagentStop: [async (data) => {
            const line = `[subagent:done]  ${data.agent_id}`;
            log(line);
            appendOutput(line);
            if (data.last_assistant_message) {
              appendOutput(data.last_assistant_message);
            }
            pipelineEvents.emit('subagent:done', { phase, step: step.name, agentId: data.agent_id, output: data.last_assistant_message });
          }],
          Stop: [async (data) => {
            log(`[session:stop] reason=${data.stop_reason}`);
            pipelineEvents.emit('session:stop', { phase, step: step.name, reason: data.stop_reason });
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
        appendOutput(outputChunks.join('\n'));
        return { exitCode: 130, outputPath };
      }

      const errorText = `Error: ${err.message}\n${err.stack ?? ''}`;
      writeFileSync(outputPath, errorText, 'utf-8');
      return { exitCode: 1, outputPath };
    }

    agentState.off('interrupt', onInterrupt);

    // Append collected assistant text
    if (outputChunks.length > 0) {
      appendOutput(outputChunks.join('\n'));
    }

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    return { exitCode: 0, outputPath };
  }
}

/**
 * Factory function for engine.js
 * @returns {ClaudeInteractiveAgent}
 */
export function createAgent() {
  return new ClaudeInteractiveAgent();
}
