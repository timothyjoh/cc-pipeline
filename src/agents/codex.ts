import { spawn, ChildProcess } from 'node:child_process';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { BaseAgent, agentState, AgentContext, AgentResult, StepDef } from './base.js';
import { generatePrompt } from '../prompts.js';

const MAX_ATTEMPTS = 3;
const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_CHECK_MS = 30_000;   // poll every 30 s

/**
 * Codex agent — shells out to the `codex` CLI with --yolo.
 * Always runs in auto-approval mode. Model can be set per-step or left to
 * the codex CLI default.
 *
 * An inactivity timeout kills and retries the process if no output is seen
 * for INACTIVITY_MS. After MAX_ATTEMPTS consecutive inactivity failures the
 * step is marked as an error with all accumulated output preserved.
 *
 * Usage in workflow.yaml:
 *   agent: codex
 *   model: o4-mini   # optional — omit to use codex's default model
 */
export class CodexAgent extends BaseAgent {
  async run(phase: number, step: StepDef, promptPath: string | null, model: string, context: AgentContext): Promise<AgentResult> {
    const { projectDir } = context;
    const pipelineDir = join(projectDir, '.pipeline');
    const logDir = join(pipelineDir, 'logs', `phase-${phase}`);
    mkdirSync(logDir, { recursive: true });
    const outputPath = join(logDir, `step-${step.name}.log`);

    const promptText = generatePrompt(projectDir, context.config, phase, promptPath);
    writeFileSync(join(pipelineDir, 'current-prompt.md'), promptText, 'utf-8');
    writeFileSync(outputPath, '', 'utf-8');

    if (agentState.interrupted) {
      return { exitCode: 130, outputPath };
    }

    const args = ['exec', '--yolo'];
    if (model && model !== 'default') {
      args.push('--model', model);
    }
    args.push(promptText);

    const header = `$ codex exec --yolo${model && model !== 'default' ? ` --model ${model}` : ''} "<prompt>"\n`;
    writeFileSync(outputPath, header, 'utf-8');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (agentState.interrupted) {
        return { exitCode: 130, outputPath };
      }

      if (attempt > 1) {
        const sep = `\n--- codex: attempt ${attempt}/${MAX_ATTEMPTS} (previous attempt had no activity for ${INACTIVITY_MS / 60000} min) ---\n\n`;
        try { appendFileSync(outputPath, sep, 'utf-8'); } catch (_) {}
      }

      const { exitCode, timedOut } = await this.spawnOnce(args, projectDir, outputPath);

      if (!timedOut) {
        // Normal exit (success or non-inactivity error) — return immediately.
        return { exitCode, outputPath };
      }

      // Inactivity timeout — log and loop to next attempt.
      const msg = `[codex: no output for ${INACTIVITY_MS / 60000} min — attempt ${attempt}/${MAX_ATTEMPTS} aborted]\n`;
      try { appendFileSync(outputPath, msg, 'utf-8'); } catch (_) {}
    }

    // All attempts exhausted.
    try {
      appendFileSync(outputPath, `\n[codex: all ${MAX_ATTEMPTS} attempts timed out due to inactivity — giving up]\n`, 'utf-8');
    } catch (_) {}
    return { exitCode: 1, outputPath };
  }

  private spawnOnce(
    args: string[],
    projectDir: string,
    outputPath: string,
  ): Promise<{ exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      let settled = false;
      let lastActivity = Date.now();

      const settle = (result: { exitCode: number; timedOut: boolean }) => {
        if (settled) return;
        settled = true;
        clearInterval(inactivityTimer);
        agentState.clearChild();
        resolve(result);
      };

      const child: ChildProcess = spawn('codex', args, {
        shell: false,
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: projectDir,
      });

      agentState.setChild(child);

      const onData = (chunk: Buffer) => {
        lastActivity = Date.now();
        try { appendFileSync(outputPath, chunk.toString(), 'utf-8'); } catch (_) {}
      };

      child.stdout?.on('data', onData);
      child.stderr?.on('data', onData);

      const inactivityTimer = setInterval(() => {
        if (Date.now() - lastActivity < INACTIVITY_MS) return;
        // No output for too long — kill the process.
        try { process.kill(child.pid!, 'SIGTERM'); } catch (_) {}
        setTimeout(() => {
          try { process.kill(child.pid!, 'SIGKILL'); } catch (_) {}
        }, 2000);
        settle({ exitCode: 1, timedOut: true });
      }, INACTIVITY_CHECK_MS);

      child.on('close', (code) => settle({ exitCode: code ?? 1, timedOut: false }));

      child.on('error', (err) => {
        const msg = `Codex agent error: ${err.message}\n`;
        try { appendFileSync(outputPath, msg, 'utf-8'); } catch (_) {}
        settle({ exitCode: 1, timedOut: false });
      });
    });
  }
}

export function createAgent(): CodexAgent {
  return new CodexAgent();
}
