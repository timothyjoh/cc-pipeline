import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';
import { pipelineEvents } from '../events.js';

/**
 * Claude Piped Agent
 * Runs claude via the Agent SDK query() API for spec, research, plan, review, reflect steps
 */
export class ClaudePipedAgent extends BaseAgent {
  async run(phase: number, step: any, promptPath: string | null, model: string, context: any) {
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

    const log = (msg: string) => {
      if (logFile) {
        try { appendFileSync(logFile, msg + '\n', 'utf-8'); } catch (_) {}
      }
    };

    // Clear output file at start so TUI file-tailer sees only this step's content
    writeFileSync(outputPath, '', 'utf-8');

    const outputChunks: string[] = [];
    let stepCostUSD = 0;

    try {
      const queryOptions: any = {
        maxTurns: 200,
        permissionMode: 'bypassPermissions',
        // CRITICAL: unset CLAUDECODE to prevent SDK conflict when running inside Claude Code
        env: { ...process.env, CLAUDECODE: undefined },
        hooks: {
          SubagentStart: [{ hooks: [async (data: any) => {
            log(`[sdk] subagent_start agent_id=${data.agent_id ?? ''}`);
            appendFileSync(outputPath, `[subagent:start] ${data.agent_id ?? ''}\n`, 'utf-8');
          }] }],
          SubagentStop: [{ hooks: [async (data: any) => {
            const msg = data.last_assistant_message ?? '';
            log(`[sdk] subagent_stop agent_id=${data.agent_id ?? ''} msg=${msg.substring(0, 120)}`);
            appendFileSync(outputPath, `[subagent:done]  ${data.agent_id ?? ''}\n`, 'utf-8');
          }] }],
          PreToolUse: [{ hooks: [async (data: any) => {
            const line = `[tool:start] ${data.tool_name} ${JSON.stringify(data.tool_input ?? {}).slice(0, 120)}`;
            log(line);
            appendFileSync(outputPath, line + '\n', 'utf-8');
          }] }],
          PostToolUse: [{ hooks: [async (data: any) => {
            const success = !data.tool_response?.is_error;
            const line = `[tool:done]  ${data.tool_name} ${success ? '✓' : '✗'}`;
            log(line);
            appendFileSync(outputPath, line + '\n', 'utf-8');
          }] }],
        },
      };

      if (model && model !== 'default') {
        queryOptions.model = model;
      }

      queryOptions.abortController = controller;
      for await (const event of query({
        prompt: promptText,
        options: queryOptions,
      })) {
        if ((event as any).type === 'assistant' && (event as any).message?.role === 'assistant') {
          for (const block of (event as any).message.content ?? []) {
            if ((block as any).type === 'text') {
              outputChunks.push((block as any).text);
              // Write text lines to output file in real time for TUI file-tailing
              const textLines = (block as any).text
                .split('\n')
                .map((l: string) => l.trim())
                .filter((l: string) => l.length > 0)
                .map((l: string) => '[text] ' + l)
                .join('\n');
              if (textLines) appendFileSync(outputPath, textLines + '\n', 'utf-8');
              pipelineEvents.emit('text:chunk', { phase, step: step.name, text: (block as any).text });
            }
          }
        }
        // Capture cost from the terminal result event
        if ((event as any).type === 'result') {
          stepCostUSD = (event as any).total_cost_usd ?? 0;
        }
      }
    } catch (err: any) {
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

    return { exitCode: 0, outputPath, usage: { costUSD: stepCostUSD } };
  }
}

/**
 * Factory function for engine.js
 */
export function createAgent(): ClaudePipedAgent {
  return new ClaudePipedAgent();
}
