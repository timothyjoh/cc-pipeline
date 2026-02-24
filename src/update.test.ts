import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { init } from './commands/init.js';
import { update } from './commands/update.js';

// Helper to capture console output (supports async functions)
async function captureConsole(fn) {
  const originalLog = console.log;
  const originalError = console.error;
  const output = [];

  console.log = (...args) => {
    output.push({ type: 'log', message: args.join(' ') });
  };

  console.error = (...args) => {
    output.push({ type: 'error', message: args.join(' ') });
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  return output;
}

test('update: is an async function', () => {
  assert.strictEqual(update.constructor.name, 'AsyncFunction', 'update should be async');
});

test('update: updates prompts in existing .pipeline directory', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // First init
  await captureConsole(async () => {
    await init(tempDir);
  });

  assert.ok(existsSync(join(tempDir, '.pipeline')), '.pipeline should exist after init');

  // Then update
  const output = await captureConsole(async () => {
    await update(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');
  assert.ok(messages.includes('Updated'), 'Should confirm update');

  // Prompts should still exist
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  assert.ok(existsSync(promptsDir), 'prompts directory should still exist');
  assert.ok(readdirSync(promptsDir).length > 0, 'prompts should have files');

  rmSync(tempDir, { recursive: true });
});
