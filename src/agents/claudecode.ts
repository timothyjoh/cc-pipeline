import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState, AgentContext, AgentResult, StepDef } from './base.js';
import { generatePrompt } from '../prompts.js';
import { pipelineEvents } from '../events.js';

/**
 * ClaudeCode Agent
 * Runs all AI pipeline steps via the Agent SDK query() API.
 * Handles spec/research/plan/review/reflect (text streaming) and
 * build/fix (tool-heavy) steps with the same implementation.
 */
export class ClaudeCodeAgent extends BaseAgent {
  async run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult> {
    const { projectDir, config } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const logDir = join(pipelineDir, 'logs', `phase-${phase}`);
    mkdirSync(logDir, { recursive: true });
    const outputPath = join(logDir, `step-${step.name}.log`);

    const promptText = generatePrompt(projectDir, config, phase, promptPath);
    writeFileSync(join(pipelineDir, 'current-prompt.md'), promptText, 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    const controller = new AbortController();
    const onInterrupt = () => controller.abort();
    agentState.on('interrupt', onInterrupt);

    // Clear output file so TUI file-tailer sees only this step's content
    writeFileSync(outputPath, '', 'utf-8');

    const appendOutput = (line: string) => {
      try { appendFileSync(outputPath, line + '\n', 'utf-8'); } catch (_) {}
    };

    const outputChunks: string[] = [];
    let stepCostUSD = 0;

    try {
      const queryOptions: any = {
        maxTurns: 500,
        permissionMode: 'bypassPermissions',
        // Unset CLAUDECODE to prevent SDK conflict when running inside Claude Code
        env: { ...process.env, CLAUDECODE: undefined },
        hooks: {
          PreToolUse: [{ hooks: [async (data: any) => {
            appendOutput(`[tool:start] ${data.tool_name} ${JSON.stringify(data.tool_input ?? {}).slice(0, 120)}`);
          }] }],
          PostToolUse: [{ hooks: [async (data: any) => {
            const success = !data.tool_response?.is_error;
            appendOutput(`[tool:done]  ${data.tool_name} ${success ? '✓' : '✗'}`);
          }] }],
          SubagentStart: [{ hooks: [async (data: any) => {
            appendOutput(`[subagent:start] ${data.agent_id ?? ''}`);
          }] }],
          SubagentStop: [{ hooks: [async (data: any) => {
            appendOutput(`[subagent:done]  ${data.agent_id ?? ''}`);
          }] }],
          Stop: [{ hooks: [async (_data: any) => {}] }],
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
              const text: string = (block as any).text;
              outputChunks.push(text);
              // Stream text lines to output file for TUI file-tailing
              const textLines = text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .map(l => '[text] ' + l)
                .join('\n');
              if (textLines) appendOutput(textLines);
              pipelineEvents.emit('text:chunk', { phase, step: step.name, text });
            }
          }
        }
        if ((event as any).type === 'result') {
          stepCostUSD = (event as any).total_cost_usd ?? 0;
          const reason = (event as any).stop_reason ?? 'end_turn';
          pipelineEvents.emit('session:stop', { phase, step: step.name, reason });
        }
      }
    } catch (err: any) {
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

    // Write final collected output (for steps without streaming, e.g. build)
    if (outputChunks.length > 0) {
      writeFileSync(outputPath, outputChunks.join('\n'), 'utf-8');
    }

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    return { exitCode: 0, outputPath, usage: { costUSD: stepCostUSD } };
  }
}

export function createAgent(): ClaudeCodeAgent {
  return new ClaudeCodeAgent();
}
