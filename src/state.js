import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Append a JSON event object to JSONL file.
 * Automatically adds a `ts` timestamp field.
 *
 * @param {string} logFile - Path to JSONL log file
 * @param {object} event - Event object (e.g., { event: 'step_start', phase: 1, step: 'spec' })
 */
export function appendEvent(logFile, event) {
  // Ensure directory exists
  const dir = dirname(logFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Add timestamp
  const record = {
    ...event,
    ts: new Date().toISOString(),
  };

  // Append as JSON line
  appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
}

/**
 * Read all events from JSONL file.
 *
 * @param {string} logFile - Path to JSONL log file
 * @returns {Array<object>} Array of event objects
 */
export function readEvents(logFile) {
  if (!existsSync(logFile)) {
    return [];
  }

  const content = readFileSync(logFile, 'utf8').trim();
  if (!content) {
    return [];
  }

  const events = [];
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // Skip malformed lines (e.g., truncated writes from a crash)
    }
  }
  return events;
}

/**
 * Derive current pipeline state from last relevant events in JSONL log.
 *
 * Logic (from run.sh lines 124-157):
 * - Find last event matching: step_start, step_done, step_complete, step_skip, phase_complete
 * - Derive state based on event type:
 *   - step_start → { phase, step, status: 'running' }
 *   - step_done/step_skip → { phase, step, status: 'complete' }
 *   - phase_complete → { phase, step: 'done', status: 'complete' }
 *   - No relevant events → { phase: 1, step: 'pending', status: 'ready' }
 *
 * @param {string} logFile - Path to JSONL log file
 * @returns {object} State object { phase, step, status }
 */
export function getCurrentState(logFile) {
  const events = readEvents(logFile);

  if (events.length === 0) {
    return { phase: 1, step: 'pending', status: 'ready' };
  }

  // Find last relevant event
  const relevantEvents = ['step_start', 'step_done', 'step_skip', 'phase_complete'];
  const lastEvent = events
    .filter(e => relevantEvents.includes(e.event))
    .pop();

  if (!lastEvent) {
    return { phase: 1, step: 'pending', status: 'ready' };
  }

  const { event, phase = 1, step = 'pending' } = lastEvent;

  switch (event) {
    case 'step_start':
      return { phase, step, status: 'running' };
    case 'step_done':
    case 'step_skip':
      return { phase, step, status: 'complete' };
    case 'phase_complete':
      return { phase, step: 'done', status: 'complete' };
    default:
      return { phase: 1, step: 'pending', status: 'ready' };
  }
}

/**
 * Determine where to resume pipeline execution.
 *
 * Logic (from run.sh lines 569-598):
 * - If step is 'pending' or status is 'complete', advance to next step
 * - If step is 'done', advance to next phase
 * - If status is 'running', resume that step
 *
 * @param {string} logFile - Path to JSONL log file
 * @param {Array} steps - Array of step objects from config (each has { name: string })
 * @returns {object} Resume point { phase, stepName }
 */
export function deriveResumePoint(logFile, steps) {
  const state = getCurrentState(logFile);
  let { phase, step, status } = state;

  // Fresh start
  if (step === 'pending' || status === 'ready') {
    return { phase: 1, stepName: steps[0].name };
  }

  // Currently running a step - resume it
  if (status === 'running') {
    return { phase, stepName: step };
  }

  // Step completed - advance to next
  if (status === 'complete') {
    // Phase complete - advance to next phase
    if (step === 'done') {
      return { phase: phase + 1, stepName: steps[0].name };
    }

    // Find current step index and advance
    const stepIndex = steps.findIndex(s => s.name === step);
    if (stepIndex === -1) {
      // Unknown step, start from beginning
      return { phase: 1, stepName: steps[0].name };
    }

    // Move to next step
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      // End of steps - advance to next phase
      return { phase: phase + 1, stepName: steps[0].name };
    }

    return { phase, stepName: steps[nextIndex].name };
  }

  // Fallback
  return { phase: 1, stepName: steps[0].name };
}
