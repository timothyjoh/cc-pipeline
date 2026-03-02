/**
 * Append a JSON event object to JSONL file.
 * Automatically adds a `ts` timestamp field.
 *
 * @param {string} logFile - Path to JSONL log file
 * @param {object} event - Event object (e.g., { event: 'step_start', phase: 1, step: 'spec' })
 */
export declare function appendEvent(logFile: string, event: Record<string, unknown>): void;
/**
 * Read all events from JSONL file.
 *
 * @param {string} logFile - Path to JSONL log file
 * @returns {Array<object>} Array of event objects
 */
export declare function readEvents(logFile: string): any[];
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
export declare function getCurrentState(logFile: string): {
    phase: number;
    step: string;
    status: string;
};
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
export declare function deriveResumePoint(logFile: string, steps: Array<{
    name: string;
}>): {
    phase: number;
    stepName: string;
};
//# sourceMappingURL=state.d.ts.map