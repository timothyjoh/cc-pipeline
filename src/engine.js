import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { getCurrentState, appendEvent, deriveResumePoint } from './state.js';
import { loadConfig } from './config.js';
import { printBanner } from './logger.js';
import { agentState } from './agents/base.js';
import { BashAgent } from './agents/bash.js';
import { ClaudePipedAgent } from './agents/claude-piped.js';
import { ClaudeInteractiveAgent } from './agents/claude-interactive.js';

const MAX_PHASES = 20;

/**
 * Main pipeline engine loop.
 *
 * Logic from run.sh lines 549-636:
 * - Load config from workflow.yaml
 * - Derive current state from JSONL
 * - Print banner
 * - Loop through phases, executing steps
 * - Check for PROJECT COMPLETE in reflections
 * - Handle phase limits and MAX_PHASES
 * - Signal handling for clean shutdown
 *
 * @param {string} projectDir - Absolute path to project root
 * @param {object} options - { phases?: number, model?: string }
 */
export async function runEngine(projectDir, options = {}) {
  const pipelineDir = join(projectDir, '.pipeline');
  const logFile = join(pipelineDir, 'pipeline.jsonl');
  const workflowFile = join(pipelineDir, 'workflow.yaml');

  // Validate pipeline exists
  if (!existsSync(workflowFile)) {
    throw new Error('No .pipeline/workflow.yaml found. Run `cc-pipeline init` first.');
  }

  // Load config
  const config = loadConfig(projectDir);

  // Derive current state
  const state = getCurrentState(logFile);
  const resumePoint = deriveResumePoint(logFile, config.steps);

  // Print banner
  printBanner(config, projectDir, state);
  console.log(`\nResumed state: phase=${resumePoint.phase} step=${resumePoint.stepName} status=${state.status}`);

  // Signal handling — track interrupted state, kill child processes, and allow cancelling sleep
  let interrupted = false;
  let cancelSleep = null;
  let phase = resumePoint.phase;
  let currentStepName = resumePoint.stepName;

  const handleSignal = (signal) => {
    if (interrupted) return; // Already handling a signal, ignore duplicates
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    interrupted = true;
    agentState.setInterrupted(true);
    if (cancelSleep) cancelSleep();

    // Write interrupted event
    appendEvent(logFile, { event: 'interrupted', phase, step: currentStepName });

    // Kill current child process if any
    const child = agentState.getChild();
    if (child && child.pid) {
      console.log(`Terminating child process ${child.pid}...`);

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
    // Main loop (phase and currentStepName already declared above for signal handler)
    let phasesRun = 0;

    const phaseLimit = options.phases || 0;

    while (phase <= MAX_PHASES) {
      // Check for PROJECT COMPLETE
      if (phase > 1) {
        const prevPhaseDir = join(projectDir, config.phasesDir, `phase-${phase - 1}`);
        const reflectFile = join(prevPhaseDir, 'REFLECTIONS.md');
        if (existsSync(reflectFile)) {
          const firstLine = readFileSync(reflectFile, 'utf8').split('\n')[0];
          if (firstLine && /PROJECT COMPLETE/i.test(firstLine)) {
            appendEvent(logFile, { event: 'project_complete', phase: phase - 1 });
            console.log(`PROJECT COMPLETE detected in phase ${phase - 1} reflections.`);
            return;
          }
        }
      }

      // Execute all steps in phase
      let stepIndex = config.steps.findIndex(s => s.name === currentStepName);
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
            console.log(`\n  ⏳ Retry ${attempt}/2 for step "${stepDef.name}" in ${delaySec}s...`);
            await new Promise(resolve => {
              const timer = setTimeout(resolve, retryDelays[attempt]);
              cancelSleep = () => { clearTimeout(timer); resolve(); };
            });
            cancelSleep = null;
            if (interrupted) throw new Error('Pipeline interrupted by signal');
          }

          lastResult = await runStep(phase, stepDef, projectDir, config, logFile, options);

          // If interrupted during step execution, bail immediately
          if (interrupted) throw new Error('Pipeline interrupted by signal');

          if (lastResult === 'ok' || lastResult === 'skipped') break;

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

        // If still failed after all retries, stop the pipeline
        if (lastResult === 'error') {
          console.error(`\n  ❌ Step "${stepDef.name}" failed after 3 attempts. Pipeline stopped.`);
          console.error(`  Run \`cc-pipeline run\` to retry from this step.`);
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

      phasesRun++;

      // Check phase limit
      if (phaseLimit > 0 && phasesRun >= phaseLimit) {
        console.log(`Completed ${phasesRun} phase(s) as requested. Stopping.`);
        return;
      }

      // Advance to next phase
      phase++;
      currentStepName = config.steps[0].name;

      // Brief pause between phases (interruptible)
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 5000);
        cancelSleep = () => { clearTimeout(timer); resolve(); };
      });
      cancelSleep = null;
      if (interrupted) {
        // Signal handler already wrote the interrupted event
        throw new Error('Pipeline interrupted by signal');
      }
    }

    console.log(`Hit MAX_PHASES (${MAX_PHASES}). Stopping.`);
  } finally {
    cleanup();
  }
}

/**
 * Execute a single pipeline step.
 *
 * @param {number} phase - Current phase number
 * @param {object} stepDef - Step definition from workflow.yaml
 * @param {string} projectDir - Project root directory
 * @param {object} config - Full config object
 * @param {string} logFile - Path to JSONL log
 */
async function runStep(phase, stepDef, projectDir, config, logFile, options = {}) {
  const { name: stepName, agent, skipUnless, output, testGate } = stepDef;

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
      console.log(`Skipping ${stepName} (${skipUnless} not found)`);
      return 'skipped';
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

  console.log(`\nRunning step: ${stepName} (phase ${phase}, agent: ${agent})`);

  // Route to agent and execute
  let result;
  const context = { projectDir, config, logFile };
  const promptPath = stepDef.prompt || null;

  try {
    switch (agent) {
      case 'bash': {
        const bashAgent = new BashAgent();
        result = await bashAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      case 'claude-piped': {
        const pipedAgent = new ClaudePipedAgent();
        result = await pipedAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      case 'claude-interactive':
      case 'codex-interactive': {
        const interactiveAgent = new ClaudeInteractiveAgent();
        result = await interactiveAgent.run(phase, stepDef, promptPath, model, context);
        break;
      }
      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
  } catch (err) {
    console.error(`Error executing agent ${agent}: ${err.message}`);
    result = { exitCode: 1, outputPath: null, error: err.message };
  }

  // Log step done
  const status = result.exitCode === 0 ? 'ok' : 'error';
  appendEvent(logFile, {
    event: 'step_done',
    phase,
    step: stepName,
    agent,
    status,
    exitCode: result.exitCode,
    ...(result.error && { error: result.error }),
  });

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
      console.log(`WARNING: Expected output ${output} not found after ${stepName}`);
    }
  }

  // Test gate (placeholder)
  if (testGate === true) {
    console.log(`  [STUB] Would run test gate for ${stepName}`);
  }

  return status;
}

