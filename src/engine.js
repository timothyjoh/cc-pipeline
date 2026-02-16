import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { getCurrentState, appendEvent, deriveResumePoint } from './state.js';
import { loadConfig } from './config.js';
import { printBanner } from './logger.js';

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

  // Signal handling — track interrupted state and allow cancelling sleep
  let interrupted = false;
  let cancelSleep = null;

  const handleSignal = (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    interrupted = true;
    if (cancelSleep) cancelSleep();
  };
  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);

  const cleanup = () => {
    process.removeListener('SIGINT', handleSignal);
    process.removeListener('SIGTERM', handleSignal);
  };

  try {
    // Main loop
    let phase = resumePoint.phase;
    let currentStepName = resumePoint.stepName;
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
          appendEvent(logFile, { event: 'interrupted', phase, step: currentStepName });
          throw new Error('Pipeline interrupted by signal');
        }

        const stepDef = config.steps[i];
        await runStep(phase, stepDef, projectDir, config, logFile);
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
        appendEvent(logFile, { event: 'interrupted', phase, step: currentStepName });
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
async function runStep(phase, stepDef, projectDir, config, logFile) {
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
      return;
    }
  }

  // Log step start
  const model = stepDef.model || 'default';
  appendEvent(logFile, {
    event: 'step_start',
    phase,
    step: stepName,
    agent,
    model,
  });

  console.log(`\nRunning step: ${stepName} (phase ${phase}, agent: ${agent})`);

  // Route to agent
  // NOTE: Actual agent implementations are Phase 2 work
  // For now, just simulate execution
  switch (agent) {
    case 'claude-piped':
      console.log(`  [STUB] Would run: claude -p with prompt ${stepDef.prompt}`);
      break;
    case 'claude-interactive':
    case 'codex-interactive':
      console.log(`  [STUB] Would run: ${agent} in tmux with prompt ${stepDef.prompt}`);
      break;
    case 'bash':
      console.log(`  [STUB] Would run: ${stepDef.command}`);
      break;
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }

  // Simulate work
  await sleep(500);

  // Log step done
  appendEvent(logFile, {
    event: 'step_done',
    phase,
    step: stepName,
    agent,
    status: 'ok',
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

  // Log step complete
  appendEvent(logFile, { event: 'step_complete', phase, step: stepName });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

