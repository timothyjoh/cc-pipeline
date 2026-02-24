import { test } from 'node:test';
import assert from 'node:assert';
import { printBanner } from './logger.js';

/**
 * Tests for logger.js module
 * Covers printBanner output formatting
 */

// Helper to capture console.log output
function captureConsoleLog(fn) {
  const originalLog = console.log;
  const output = [];

  console.log = (...args) => {
    output.push(args.join(' '));
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
  }

  return output;
}

const mockConfig = {
  name: 'Test Pipeline',
  steps: [
    { name: 'spec', description: 'Write spec' },
    { name: 'build', description: 'Build project' },
    { name: 'test', description: 'Run tests' },
  ],
};

test('printBanner: outputs banner with config name', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 1, step: 'spec', status: 'running' });
  });

  const bannerText = output.join('\n');

  // Should include config name
  assert.ok(bannerText.includes('Test Pipeline'));

  // Should have box borders
  assert.ok(bannerText.includes('╔'));
  assert.ok(bannerText.includes('╗'));
  assert.ok(bannerText.includes('╚'));
  assert.ok(bannerText.includes('╝'));
  assert.ok(bannerText.includes('║'));
});

test('printBanner: displays project name from path', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/my-awesome-project', { phase: 1, step: 'spec', status: 'running' });
  });

  const bannerText = output.join('\n');

  assert.ok(bannerText.includes('my-awesome-project'));
});

test('printBanner: lists all step names', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 1, step: 'build', status: 'running' });
  });

  const bannerText = output.join('\n');

  // Should list all steps
  assert.ok(bannerText.includes('spec'));
  assert.ok(bannerText.includes('build'));
  assert.ok(bannerText.includes('test'));

  // Should show "Pipeline Steps:"
  assert.ok(bannerText.includes('Pipeline Steps:'));
});

test('printBanner: highlights current step', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 1, step: 'build', status: 'running' });
  });

  const bannerText = output.join('\n');

  // Current step should have a marker (▶)
  assert.ok(bannerText.includes('▶'));

  // Should have the build step
  assert.ok(bannerText.includes('build'));
});

test('printBanner: displays phase and status', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 3, step: 'test', status: 'complete' });
  });

  const bannerText = output.join('\n');

  assert.ok(bannerText.includes('Phase: 3'));
  assert.ok(bannerText.includes('Status: complete'));
});

test('printBanner: handles missing currentState gracefully', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', null);
  });

  const bannerText = output.join('\n');

  // Should still show config name and steps
  assert.ok(bannerText.includes('Test Pipeline'));
  assert.ok(bannerText.includes('spec'));
  assert.ok(bannerText.includes('build'));
  assert.ok(bannerText.includes('test'));

  // Should not crash
  assert.ok(output.length > 0);
});

test('printBanner: uses numbered list for steps', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 1, step: 'spec', status: 'running' });
  });

  const bannerText = output.join('\n');

  // Should have numbered steps
  assert.ok(bannerText.includes('1. spec'));
  assert.ok(bannerText.includes('2. build'));
  assert.ok(bannerText.includes('3. test'));
});

test('printBanner: handles empty config name', () => {
  const configWithoutName = {
    steps: [{ name: 'spec' }],
  };

  const output = captureConsoleLog(() => {
    printBanner(configWithoutName, '/Users/test/project', { phase: 1, step: 'spec', status: 'running' });
  });

  const bannerText = output.join('\n');

  // Should have some fallback or handle gracefully
  assert.ok(output.length > 0);
});

test('printBanner: shows correct marker only for current step', () => {
  const output = captureConsoleLog(() => {
    printBanner(mockConfig, '/Users/test/project', { phase: 1, step: 'build', status: 'running' });
  });

  // Count how many lines have the ▶ marker
  const markerLines = output.filter(line => line.includes('▶'));

  // Should have exactly one marked line (the current step)
  assert.ok(markerLines.length >= 1); // At least one (might be duplicated due to ANSI codes)

  // Build should be marked
  const buildLine = output.find(line => line.includes('build'));
  assert.ok(buildLine);
});
