import YAML from 'yaml';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
  usageCheck: { when: string };
  usageLimits: { sessionBudgetUSD: number; weeklyBudgetUSD: number };
}

/**
 * Load and parse the workflow configuration from .pipeline/workflow.yaml
 * Normalizes snake_case YAML keys to camelCase JS properties
 * @param {string} projectDir - The project directory path
 * @returns {object} Normalized config object
 */
export function loadConfig(projectDir: string): PipelineConfig {
  const workflowPath = join(projectDir, '.pipeline', 'workflow.yaml');

  if (!existsSync(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }

  const rawContent = readFileSync(workflowPath, 'utf-8');
  const raw = YAML.parse(rawContent);

  // Normalize top-level config
  const config: PipelineConfig = {
    name: raw.name || 'Unnamed Pipeline',
    version: raw.version || 1,
    phasesDir: raw.phases_dir || 'docs/phases',
    maxPhases: raw.max_phases ?? 100,
    steps: [],
    usageCheck: raw.usage_check || { when: 'phase_boundary' },
    usageLimits: {
      // Cost budget per pipeline run (USD). Default: $5.
      sessionBudgetUSD: raw.usage_limits?.session_budget_usd ?? 5.0,
      // Cost budget per week (USD). Default: $25.
      weeklyBudgetUSD: raw.usage_limits?.weekly_budget_usd ?? 25.0,
    },
  };

  // Normalize steps array
  if (raw.steps && Array.isArray(raw.steps)) {
    config.steps = raw.steps.map((step: any) => ({
      name: step.name,
      description: step.description || '',
      agent: step.agent,
      prompt: step.prompt,
      model: step.model,
      skipUnless: step.skip_unless,
      output: step.output,
      testGate: step.test_gate,
      command: step.command,
      continueOnError: step.continue_on_error ?? false
    }));
  }

  return config;
}

/**
 * Find a step by name
 * @param {object} config - The workflow configuration
 * @param {string} name - The step name to find
 * @returns {object|null} The step object or null if not found
 */
export function getStepByName(config: PipelineConfig, name: string): StepConfig | null {
  return config.steps.find(step => step.name === name) || null;
}

/**
 * Find the index of a step by name
 * @param {object} config - The workflow configuration
 * @param {string} name - The step name to find
 * @returns {number} The step index or -1 if not found
 */
export function getStepIndex(config: PipelineConfig, name: string): number {
  return config.steps.findIndex(step => step.name === name);
}

/**
 * Get the next step name after the current step
 * @param {object} config - The workflow configuration
 * @param {string} currentStepName - The current step name
 * @returns {string} The next step name or 'done' if at the end
 */
export function getNextStep(config: PipelineConfig, currentStepName: string): string {
  const currentIndex = getStepIndex(config, currentStepName);

  if (currentIndex === -1) {
    throw new Error(`Step not found: ${currentStepName}`);
  }

  const nextIndex = currentIndex + 1;

  if (nextIndex >= config.steps.length) {
    return 'done';
  }

  return config.steps[nextIndex].name;
}

/**
 * Get the first step name
 * @param {object} config - The workflow configuration
 * @returns {string} The first step name
 */
export function getFirstStep(config: PipelineConfig): string {
  if (!config.steps || config.steps.length === 0) {
    throw new Error('No steps defined in workflow');
  }

  return config.steps[0].name;
}
