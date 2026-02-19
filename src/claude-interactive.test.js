import { test, mock } from 'node:test';
import assert from 'node:assert';

test('deliverPrompt: sends text and Enter as separate execSync calls', async () => {
  // Mock execSync before importing the module
  const calls = [];
  const mockExecSync = mock.fn((...args) => {
    calls.push(args[0]);
  });

  // We need to verify the source code pattern directly since we can't
  // easily mock execSync in ESM. Read and verify the implementation.
  const { readFileSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(join(__dirname, 'agents', 'claude-interactive.js'), 'utf8');

  // Find the deliverPrompt method
  const methodMatch = source.match(/async deliverPrompt\([^)]*\)\s*\{([\s\S]*?)\n  \}/);
  assert.ok(methodMatch, 'deliverPrompt method should exist');

  const methodBody = methodMatch[1];

  // Verify: there should be separate execSync calls for text and Enter
  const execSyncCalls = methodBody.match(/execSync\(/g);
  assert.ok(execSyncCalls, 'deliverPrompt should call execSync');
  assert.ok(execSyncCalls.length >= 2, `deliverPrompt should have at least 2 execSync calls, found ${execSyncCalls.length}`);

  // The send-keys call with the instruction text should NOT include Enter
  const sendKeysLines = methodBody.split('\n').filter(l => l.includes('send-keys'));
  assert.ok(sendKeysLines.length >= 2, 'Should have at least 2 send-keys calls');

  // First send-keys: the prompt text (no Enter)
  const textLine = sendKeysLines.find(l => l.includes('safeInstruction'));
  assert.ok(textLine, 'Should have a send-keys call with the instruction text');
  assert.ok(!textLine.includes('Enter'), 'Text send-keys should NOT include Enter on the same call');

  // Separate send-keys for Enter
  const enterLine = sendKeysLines.find(l => l.includes('Enter'));
  assert.ok(enterLine, 'Should have a separate send-keys call for Enter');
});
