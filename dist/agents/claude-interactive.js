import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { BaseAgent, agentState } from './base.js';
import { generatePrompt } from '../prompts.js';
import { pipelineEvents } from '../events.js';
/**
 * Claude Interactive Agent
 * Runs claude via the Agent SDK query() API for build/fix steps.
 * Replaces the old tmux-based interactive session approach.
 */
export class ClaudeInteractiveAgent extends BaseAgent {
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
                try {
                    appendFileSync(logFile, msg + '\n', 'utf-8');
                }
                catch (_) { }
            }
        };
        const appendOutput = (line) => {
            try {
                appendFileSync(outputPath, line + '\n', 'utf-8');
            }
            catch (_) { }
        };
        const outputChunks = [];
        let stepCostUSD = 0;
        try {
            const queryOptions = {
                maxTurns: 500,
                permissionMode: 'bypassPermissions',
                env: { ...process.env, CLAUDECODE: undefined },
                hooks: {
                    PreToolUse: [{ hooks: [async (data) => {
                                    const line = `[tool:start] ${data.tool_name} ${JSON.stringify(data.tool_input ?? {}).slice(0, 120)}`;
                                    log(line);
                                    appendOutput(line);
                                }] }],
                    PostToolUse: [{ hooks: [async (data) => {
                                    const success = !data.tool_response?.is_error;
                                    const line = `[tool:done]  ${data.tool_name} ${success ? '✓' : '✗'}`;
                                    log(line);
                                    appendOutput(line);
                                }] }],
                    SubagentStart: [{ hooks: [async (data) => {
                                    const line = `[subagent:start] ${data.agent_id}`;
                                    log(line);
                                    appendOutput(line);
                                }] }],
                    SubagentStop: [{ hooks: [async (data) => {
                                    const line = `[subagent:done]  ${data.agent_id}`;
                                    log(line);
                                    appendOutput(line);
                                    if (data.last_assistant_message) {
                                        appendOutput(data.last_assistant_message);
                                    }
                                }] }],
                    Stop: [{ hooks: [async (_data) => {
                                    log(`[session:stop]`);
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
                if (event.type === 'assistant' && event.message?.role === 'assistant') {
                    for (const block of event.message.content ?? []) {
                        if (block.type === 'text') {
                            outputChunks.push(block.text);
                        }
                    }
                }
                // Capture cost and emit session:stop from the result event
                if (event.type === 'result') {
                    stepCostUSD = event.total_cost_usd ?? 0;
                    const reason = event.stop_reason ?? 'end_turn';
                    pipelineEvents.emit('session:stop', { phase, step: step.name, reason });
                }
            }
        }
        catch (err) {
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
        return { exitCode: 0, outputPath, usage: { costUSD: stepCostUSD } };
    }
}
/**
 * Factory function for engine.js
 */
export function createAgent() {
    return new ClaudeInteractiveAgent();
}
//# sourceMappingURL=claude-interactive.js.map