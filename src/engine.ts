import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { getCurrentState, appendEvent, deriveResumePoint } from './state.js';
import { loadConfig } from './config.js';
import { printBanner } from './logger.js';
import { agentState } from './agents/base.js';
import { BashAgent } from './agents/bash.js';
import { ClaudeCodeAgent } from './agents/claudecode.js';
import { CodexAgent } from './agents/codex.js';
import { pipelineEvents } from './events.js';
import { computeUsagePercentages } from './usage.js';

const DEFAULT_MAX_PHASES = 100;

/**
 * Main pipeline engine loop.
 *
 * Logic from run.sh lines 549-636:
 * - Load config from workflow.yaml
 * - Derive current state from JSONL
 * - Print banner
 * - Loop through phases, executing steps
 * - Check for PROJECT COMPLETE in reflections
 * - Handle phase limits and maxPhases
 * - Signal handling for clean shutdown
 */
export async function runEngine(projectDir: string, options: any = {}) {
  const quiet: boolean = !!options.quiet; // suppress banner/step logs when TUI is active
  const log = (...args: unknown[]) => { if (!quiet) console.log(...args); };
  const logErr = (...args: unknown[]) => { if (!quiet) console.error(...args); };

  const pipelineDir = join(projectDir, '.pipeline');
  const logFile = join(pipelineDir, 'pipeline.jsonl');
  const workflowFile = join(pipelineDir, 'workflow.yaml');

  // Validate pipeline exists
  if (!existsSync(workflowFile)) {
    throw new Error('No .pipeline/workflow.yaml found. Run `cc-pipeline init` first.');
  }

  // Load config
  const config = loadConfig(projectDir);
  const maxPhases = config.maxPhases ?? DEFAULT_MAX_PHASES;

  // Derive current state
  const state = getCurrentState(logFile);
  const resumePoint = deriveResumePoint(logFile, config.steps);

  // Print banner (skipped in TUI mode)
  if (!quiet) printBanner(config, projectDir, state);
  log(`\nResumed state: phase=${resumePoint.phase} step=${resumePoint.stepName} status=${state.status}`);

  // Signal handling — track interrupted state, kill child processes, and allow cancelling sleep
  let interrupted = false;
  let cancelSleep: (() => void) | null = null;
  let phase = resumePoint.phase;
  let currentStepName = resumePoint.stepName;

  const handleSignal = (signal: string) => {
    if (interrupted) return; // Already handling a signal, ignore duplicates
    log(`\nReceived ${signal}, shutting down gracefully...`);
    interrupted = true;
    agentState.setInterrupted(true);
    if (cancelSleep) cancelSleep();

    // Write interrupted event
    appendEvent(logFile, { event: 'interrupted', phase, step: currentStepName });

    // Kill current child process if any
    const child = agentState.getChild();
    if (child && child.pid) {
      log(`Terminating child process ${child.pid}...`);

      // Send SIGTERM first
      try {
        process.kill(child.pid, 'SIGTERM');
      } catch (err) {
        // Process may have already exited
      }

      // Send SIGKILL after 2 seconds if still running
      setTimeout(() => {
        try {
          process.kill(child.pid, 'SIGKILL');
        } catch (err) {
          // Process already exited, ignore
        }
      }, 2000);
    }

    // Exit after cleanup — use correct exit code per signal
    const exitCode = signal === 'SIGTERM' ? 143 : 130;
    setTimeout(() => {
      process.exit(exitCode);
    }, 3000);
  };
  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);

  const cleanup = () => {
    process.removeListener('SIGINT', handleSignal);
    process.removeListener('SIGTERM', handleSignal);
  };

  try {
    // Accumulated SDK cost for this pipeline run (used for session_percentage)
    let sessionCostUSD = 0;

    // Main loop (phase and currentStepName already declared above for signal handler)
    let phasesRun = 0;

    const phaseLimit = options.phases || 0;

    while (phase <= maxPhases) {
      pipelineEvents.emit('phase:start', { phase });

      // Execute all steps in phase
      let stepIndex = config.steps.findIndex((s: any) => s.name === currentStepName);
      if (stepIndex === -1) stepIndex = 0;

      for (let i = stepIndex; i < config.steps.length; i++) {
        if (interrupted) {
          // Signal handler already wrote the interrupted event
          throw new Error('Pipeline interrupted by signal');
        }

        const stepDef = config.steps[i];
        currentStepName = stepDef.name;

        // Retry logic: 3 attempts with backoff (0s, 30s, 60s)
        const retryDelays = [0, 30000, 60000];
        let lastResult = null;

        for (let attempt = 0; attempt < retryDelays.length; attempt++) {
          if (attempt > 0) {
            const delaySec = retryDelays[attempt] / 1000;
            log(`\n  Retry ${attempt}/2 for step "${stepDef.name}" in ${delaySec}s...`);
            await new Promise<void>(resolve => {
              const timer = setTimeout(resolve, retryDelays[attempt]);
              cancelSleep = () => { clearTimeout(timer); resolve(); };
            });
            cancelSleep = null;
            if (interrupted) throw new Error('Pipeline interrupted by signal');
          }

          const stepResult = await runStep(phase, stepDef, projectDir, config, logFile, options, sessionCostUSD);
          sessionCostUSD += stepResult.costUSD ?? 0;
          lastResult = stepResult.status;

          // If interrupted during step execution, bail immediately
          if (interrupted) throw new Error('Pipeline interrupted by signal');

          if (lastResult === 'ok' || lastResult === 'skipped') break;

          // Bash steps and steps marked continue_on_error never retry — move on
          if (stepDef.agent === 'bash' || stepDef.continueOnError) break;

          // Log retry
          if (attempt < retryDelays.length - 1) {
            appendEvent(logFile, {
              event: 'step_retry',
              phase,
              step: stepDef.name,
              attempt: attempt + 1,
            });
          }
        }

        // After GROOM step: check if it signaled project complete
        if (stepDef.name === 'groom' && lastResult === 'ok') {
          const groomFile = join(projectDir, config.phasesDir, `phase-${phase}`, 'GROOM.md');
          if (existsSync(groomFile)) {
            const groomContent = readFileSync(groomFile, 'utf8');
            if (/PROJECT COMPLETE/i.test(groomContent)) {
              appendEvent(logFile, { event: 'project_complete', phase });
              log(`PROJECT COMPLETE — all Epics finished (detected by GROOM in phase ${phase}).`);
              pipelineEvents.emit('phase:done', { phase });
              return;
            }
          }
        }

        // If still failed after all retries, stop the pipeline
        if (lastResult === 'error' && stepDef.agent !== 'bash' && !stepDef.continueOnError) {
          logErr(`\n  Step "${stepDef.name}" failed after 3 attempts. Pipeline stopped.`);
          logErr(`  Run \`cc-pipeline run\` to retry from this step.`);
          appendEvent(logFile, {
            event: 'pipeline_stopped',
            phase,
            step: stepDef.name,
            reason: 'max_retries_exceeded',
          });
          process.exit(1);
        }
      }

      // Phase complete
      appendEvent(logFile, { event: 'phase_complete', phase });
      pipelineEvents.emit('phase:done', { phase });

      phasesRun++;

      // Check phase limit
      if (phaseLimit > 0 && phasesRun >= phaseLimit) {
        log(`Completed ${phasesRun} phase(s) as requested. Stopping.`);
        return;
      }

      // Advance to next phase
      phase++;
      currentStepName = config.steps[0].name;

      // Brief pause between phases (interruptible)
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 5000);
        cancelSleep = () => { clearTimeout(timer); resolve(); };
      });
      cancelSleep = null;
      if (interrupted) {
        // Signal handler already wrote the interrupted event
        throw new Error('Pipeline interrupted by signal');
      }
    }

    log(`Hit max phases (${maxPhases}). Stopping.`);
  } finally {
    cleanup();
  }
}

/**
 * Execute a single pipeline step.
 * Returns { status: 'ok'|'error'|'skipped', costUSD: number }
 */
async function runStep(
  phase: number,
  stepDef: any,
  projectDir: string,
  config: any,
  logFile: string,
  options: any = {},
  sessionCostUSD: number = 0,
): Promise<{ status: string; costUSD: number }> {
  const { name: stepName, agent, skipUnless, output, testGate } = stepDef;
  const log = (...args: unknown[]) => { if (!options.quiet) console.log(...args); };

  // Check skipUnless condition
  if (skipUnless) {
    const checkFile = join(projectDir, config.phasesDir, `phase-${phase}`, skipUnless);
    if (!existsSync(checkFile)) {
      appendEvent(logFile, {
        event: 'step_skip',
        phase,
        step: stepName,
        reason: `${skipUnless} not found`,
      });
      log(`Skipping ${stepName} (${skipUnless} not found)`);
      return { status: 'skipped', costUSD: 0 };
    }
  }

  // CLI --model overrides workflow.yaml per-step model
  const model = options.model || stepDef.model || 'default';
  appendEvent(logFile, {
    event: 'step_start',
    phase,
    step: stepName,
    agent,
    model,
  });
  const stepStartTime = Date.now();
  pipelineEvents.emit('step:start', { phase, step: stepName, agent, model });

  log(`\nRunning step: ${stepName} (phase ${phase}, agent: ${agent})`);

  // Route to agent and execute
  let result: any;
  const context = { projectDir, config, logFile };
  const promptPath = stepDef.prompt || null;

  try {
    switch (agent) {
      case 'bash': {
        const bashAgent = new BashAgent();
        result = await bashAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      // Legacy aliases kept for backwards compat with existing workflow.yaml files
      case 'claudecode':
      case 'claude-piped':
      case 'claude-interactive': {
        const ccAgent = new ClaudeCodeAgent();
        result = await ccAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      case 'codex': {
        const codexAgent = new CodexAgent();
        result = await codexAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
  } catch (err: any) {
    console.error(`Error executing agent ${agent}: ${err.message}`);
    result = { exitCode: 1, outputPath: null, error: err.message };
  }

  // If interrupted, don't log step_done — the signal handler already wrote
  // the 'interrupted' event, and we want that to be the last event so
  // resume logic treats this step as needing retry (status: 'running').
  if (agentState.isInterrupted()) {
    return { status: 'error', costUSD: 0 };
  }

  // Capture cost from agent result (SDK agents return usage.costUSD)
  const stepCostUSD: number = result.usage?.costUSD ?? 0;

  // Log step done
  const status = result.exitCode === 0 ? 'ok' : 'error';

  // For the 'status' step, include session_percentage and weekly_percentage
  // so pipeline observers can track API usage over time.
  const usageFields: Record<string, number> = {};
  if (stepName === 'status' && status === 'ok') {
    const accumulatedCost = sessionCostUSD + stepCostUSD;
    const percentages = computeUsagePercentages(accumulatedCost, config.usageLimits);
    usageFields.session_percentage = percentages.session_percentage;
    usageFields.weekly_percentage = percentages.weekly_percentage;
  }

  // On error, read the step output file for a description of what went wrong
  let description: string | undefined;
  if (status === 'error') {
    description = result.error;
    if (!description && result.outputPath) {
      try {
        const raw = readFileSync(result.outputPath, 'utf-8').trim();
        if (raw) description = raw.slice(-2000); // last 2000 chars to stay concise
      } catch (_) {}
    }
  }

  const elapsed_s = Math.round((Date.now() - stepStartTime) / 1000);
  appendEvent(logFile, {
    event: 'step_done',
    phase,
    step: stepName,
    agent,
    status,
    exitCode: result.exitCode,
    elapsed_s,
    ...(result.error && { error: result.error }),
    ...(description && { description }),
    ...usageFields,
  });
  pipelineEvents.emit('step:done', { phase, step: stepName, agent, exitCode: result.exitCode, elapsed_s });

  // Validate output if specified
  if (output) {
    const outputFile = join(projectDir, config.phasesDir, `phase-${phase}`, output);
    if (existsSync(outputFile)) {
      appendEvent(logFile, {
        event: 'output_verified',
        phase,
        step: stepName,
        file: output,
      });
    } else {
      appendEvent(logFile, {
        event: 'output_missing',
        phase,
        step: stepName,
        file: output,
      });
      log(`WARNING: Expected output ${output} not found after ${stepName}`);
    }
  }

  // Test gate (placeholder)
  if (testGate === true) {
    log(`  [STUB] Would run test gate for ${stepName}`);
  }

  return { status, costUSD: stepCostUSD };
}
