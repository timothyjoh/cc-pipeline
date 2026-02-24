import { spawn } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BaseAgent, agentState, AgentContext, AgentResult, StepDef } from './base.js';
import { generatePrompt } from '../prompts.js';

/**
 * Codex agent — shells out to the `codex` CLI with --yolo.
 * Always runs in auto-approval mode. Model can be set per-step or left to
 * the codex CLI default.
 *
 * Usage in workflow.yaml:
 *   agent: codex
 *   model: o4-mini   # optional — omit to use codex's default model
 */
export class CodexAgent extends BaseAgent {
  async run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult> {
    const { projectDir } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const outputPath = join(pipelineDir, 'step-output.log');

    const promptText = generatePrompt(projectDir, context.config, phase, promptPath);
    writeFileSync(join(pipelineDir, 'current-prompt.md'), promptText, 'utf-8');
    writeFileSync(outputPath, '', 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    // Build args: exec subcommand, always --yolo, optionally --model
    const args = ['exec', '--yolo'];
    if (model && model !== 'default') {
      args.push('--model', model);
    }
    // Prompt passed as final positional arg (spawn avoids shell-escaping issues)
    args.push(promptText);

    const header = `$ codex exec --yolo${model && model !== 'default' ? ` --model ${model}` : ''} "<prompt>"\n`;
    writeFileSync(outputPath, header, 'utf-8');

    return new Promise((resolve) => {
      const child = spawn('codex', args, {
        shell: false,
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: projectDir,
      });

      agentState.setChild(child);

      const onData = (chunk: Buffer) => {
        const text = chunk.toString();
        process.stderr.write(text);
        try { appendFileSync(outputPath, text, 'utf-8'); } catch (_) {}
      };

      child.stdout?.on('data', onData);
      child.stderr?.on('data', onData);

      child.on('close', (code) => {
        agentState.clearChild();
        resolve({ exitCode: code ?? 1, outputPath });
      });

      child.on('error', (err) => {
        agentState.clearChild();
        const msg = `Codex agent error: ${err.message}\n`;
        process.stderr.write(msg);
        try { appendFileSync(outputPath, msg, 'utf-8'); } catch (_) {}
        resolve({ exitCode: 1, outputPath });
      });
    });
  }
}

export function createAgent(): CodexAgent {
  return new CodexAgent();
}
