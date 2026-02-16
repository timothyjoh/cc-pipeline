import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Integration smoke test
 * Verifies all core modules can be imported without errors
 */

test('engine.js exports runEngine', async () => {
  const { runEngine } = await import('./engine.js');
  assert.strictEqual(typeof runEngine, 'function', 'runEngine should be a function');
});

test('state.js exports all expected functions', async () => {
  const { getCurrentState, appendEvent, deriveResumePoint, readEvents } = await import('./state.js');
  assert.strictEqual(typeof getCurrentState, 'function', 'getCurrentState should be a function');
  assert.strictEqual(typeof appendEvent, 'function', 'appendEvent should be a function');
  assert.strictEqual(typeof deriveResumePoint, 'function', 'deriveResumePoint should be a function');
  assert.strictEqual(typeof readEvents, 'function', 'readEvents should be a function');
});

test('config.js exports all expected functions', async () => {
  const { loadConfig, getStepByName, getStepIndex, getNextStep, getFirstStep } = await import('./config.js');
  assert.strictEqual(typeof loadConfig, 'function', 'loadConfig should be a function');
  assert.strictEqual(typeof getStepByName, 'function', 'getStepByName should be a function');
  assert.strictEqual(typeof getStepIndex, 'function', 'getStepIndex should be a function');
  assert.strictEqual(typeof getNextStep, 'function', 'getNextStep should be a function');
  assert.strictEqual(typeof getFirstStep, 'function', 'getFirstStep should be a function');
});

test('prompts.js exports generatePrompt', async () => {
  const { generatePrompt } = await import('./prompts.js');
  assert.strictEqual(typeof generatePrompt, 'function', 'generatePrompt should be a function');
});

test('logger.js exports printBanner', async () => {
  const { printBanner } = await import('./logger.js');
  assert.strictEqual(typeof printBanner, 'function', 'printBanner should be a function');
});

test('deriveResumePoint correctly determines where to resume', async (t) => {
  const { deriveResumePoint, appendEvent, readEvents } = await import('./state.js');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');

  // Create temp directory for test
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'test.jsonl');

  const steps = [
    { name: 'spec' },
    { name: 'research' },
    { name: 'plan' },
    { name: 'build' },
  ];

  await t.test('fresh start with no events', () => {
    const result = deriveResumePoint(logFile, steps);
    assert.strictEqual(result.phase, 1, 'should start at phase 1');
    assert.strictEqual(result.stepName, 'spec', 'should start at first step');
  });

  await t.test('resume from running step', () => {
    appendEvent(logFile, { event: 'step_start', phase: 1, step: 'research' });
    const result = deriveResumePoint(logFile, steps);
    assert.strictEqual(result.phase, 1, 'should stay at phase 1');
    assert.strictEqual(result.stepName, 'research', 'should resume running step');
  });

  await t.test('advance from completed step', () => {
    appendEvent(logFile, { event: 'step_done', phase: 1, step: 'research' });
    const result = deriveResumePoint(logFile, steps);
    assert.strictEqual(result.phase, 1, 'should stay at phase 1');
    assert.strictEqual(result.stepName, 'plan', 'should advance to next step');
  });

  await t.test('advance to next phase when all steps complete', () => {
    appendEvent(logFile, { event: 'step_done', phase: 1, step: 'build' });
    appendEvent(logFile, { event: 'phase_complete', phase: 1 });
    const result = deriveResumePoint(logFile, steps);
    assert.strictEqual(result.phase, 2, 'should advance to phase 2');
    assert.strictEqual(result.stepName, 'spec', 'should start at first step');
  });

  // Cleanup
  rmSync(tempDir, { recursive: true, force: true });
});
