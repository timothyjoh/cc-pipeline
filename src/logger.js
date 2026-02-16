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
  const BOX_WIDTH = 60;

  // Helper to pad line with spaces and add right border
  const boxLine = (text, color = '') => {
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI codes for length calc
    const padding = ' '.repeat(Math.max(0, BOX_WIDTH - 2 - stripped.length));
    return `║ ${color}${text}${COLORS.reset}${padding} ║`;
  };

  const lines = [
    '╔' + '═'.repeat(BOX_WIDTH) + '╗',
    boxLine(`${COLORS.cyan}${workflowName}${COLORS.reset}`),
    boxLine(`Project: ${projectName}`),
    boxLine(''),
  ];

  // Show steps with current step highlighted
  lines.push(boxLine('Pipeline Steps:', COLORS.yellow));
  config.steps.forEach((step, idx) => {
    const isCurrent = currentState && step.name === currentState.step;
    const marker = isCurrent ? `${COLORS.cyan}▶${COLORS.reset}` : ' ';
    const stepText = `${marker} ${idx + 1}. ${step.name}`;
    const stepColor = isCurrent ? COLORS.cyan : '';
    lines.push(boxLine(stepText, stepColor));
  });

  // Show phase and status
  if (currentState && currentState.phase) {
    lines.push(boxLine(''));
    const phaseText = `Phase: ${currentState.phase} | Status: ${currentState.status}`;
    lines.push(boxLine(phaseText, COLORS.dim));
  }

  lines.push('╚' + '═'.repeat(BOX_WIDTH) + '╝');

  lines.forEach(line => console.log(line));
}
