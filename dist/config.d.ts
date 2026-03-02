export interface StepConfig {
    name: string;
    description: string;
    agent: string;
    prompt?: string;
    model?: string;
    skipUnless?: string;
    output?: string;
    testGate?: unknown;
    command?: string;
    continueOnError?: boolean;
}
export interface PipelineConfig {
    name: string;
    version: number;
    phasesDir: string;
    maxPhases: number;
    steps: StepConfig[];
    usageCheck: {
        when: string;
    };
    usageLimits: {
        sessionBudgetUSD: number;
        weeklyBudgetUSD: number;
    };
}
/**
 * Load and parse the workflow configuration from .pipeline/workflow.yaml
 * Normalizes snake_case YAML keys to camelCase JS properties
 * @param {string} projectDir - The project directory path
 * @returns {object} Normalized config object
 */
export declare function loadConfig(projectDir: string): PipelineConfig;
/**
 * Find a step by name
 * @param {object} config - The workflow configuration
 * @param {string} name - The step name to find
 * @returns {object|null} The step object or null if not found
 */
export declare function getStepByName(config: PipelineConfig, name: string): StepConfig | null;
/**
 * Find the index of a step by name
 * @param {object} config - The workflow configuration
 * @param {string} name - The step name to find
 * @returns {number} The step index or -1 if not found
 */
export declare function getStepIndex(config: PipelineConfig, name: string): number;
/**
 * Get the next step name after the current step
 * @param {object} config - The workflow configuration
 * @param {string} currentStepName - The current step name
 * @returns {string} The next step name or 'done' if at the end
 */
export declare function getNextStep(config: PipelineConfig, currentStepName: string): string;
/**
 * Get the first step name
 * @param {object} config - The workflow configuration
 * @returns {string} The first step name
 */
export declare function getFirstStep(config: PipelineConfig): string;
//# sourceMappingURL=config.d.ts.map