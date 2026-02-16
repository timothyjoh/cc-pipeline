// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

/**
 * Print startup banner with box-drawing characters.
 * @param {object} config - Workflow config from yaml
 * @param {string} projectDir - Project directory path
 * @param {object} currentState - Current state { phase, step, status }
 */
export function printBanner(config, projectDir, currentState) {
  const workflowName = config.name || 'Pipeline';
  const projectName = projectDir.split('/').pop();
  const stepNames = config.steps.map(s => s.name).join(', ');

  const lines = [
    '╔═══════════════════════════════════════╗',
    `║   ${workflowName}`,
    `║   Project: ${projectName}`,
    `║   Steps: ${COLORS.cyan}${stepNames}${COLORS.reset}`,
  ];

  if (currentState) {
    const stateStr = `phase=${currentState.phase} step=${currentState.step}`;
    lines.push(`║   State: ${COLORS.dim}${stateStr}${COLORS.reset}`);
  }

  lines.push('╚═══════════════════════════════════════╝');

  lines.forEach(line => console.log(line));
}
