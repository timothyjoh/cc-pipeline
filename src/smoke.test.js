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
