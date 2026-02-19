import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { init } from './commands/init.js';
import { status } from './commands/status.js';

/**
 * Integration test for init command
 * Tests the complete init workflow
 */

// Helper to capture console.log output (supports async functions)
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

test('init: creates .pipeline directory with expected files', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  // Verify .pipeline directory exists
  const pipelineDir = join(tempDir, '.pipeline');
  assert.ok(existsSync(pipelineDir), '.pipeline directory should exist');

  // Verify .pipeline directory has files
  const pipelineFiles = readdirSync(pipelineDir);
  assert.ok(pipelineFiles.length > 0, '.pipeline directory should contain files');

  rmSync(tempDir, { recursive: true });
});

test('init: creates BRIEF.md.example', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  // Verify BRIEF.md.example exists
  const briefExample = join(tempDir, 'BRIEF.md.example');
  assert.ok(existsSync(briefExample), 'BRIEF.md.example should exist');

  // Verify it has content
  const content = readFileSync(briefExample, 'utf8');
  assert.ok(content.length > 0, 'BRIEF.md.example should have content');

  rmSync(tempDir, { recursive: true });
});

test('init: creates workflow.yaml', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  // Verify workflow.yaml exists
  const workflowPath = join(tempDir, '.pipeline', 'workflow.yaml');
  assert.ok(existsSync(workflowPath), 'workflow.yaml should exist');

  // Verify it has content
  const content = readFileSync(workflowPath, 'utf8');
  assert.ok(content.length > 0, 'workflow.yaml should have content');
  assert.ok(content.includes('steps'), 'workflow.yaml should define steps');

  rmSync(tempDir, { recursive: true });
});

test('init: creates prompts directory', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  // Verify prompts directory exists
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  assert.ok(existsSync(promptsDir), 'prompts directory should exist');

  // Verify it has some prompt files
  const promptFiles = readdirSync(promptsDir);
  assert.ok(promptFiles.length > 0, 'prompts directory should contain files');

  rmSync(tempDir, { recursive: true });
});

test('init: is idempotent - running again does not overwrite', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Run init first time
  const output1 = await captureConsole(async () => {
    await init(tempDir);
  });

  // Verify .pipeline was created
  const pipelineDir = join(tempDir, '.pipeline');
  assert.ok(existsSync(pipelineDir));

  // Run init second time
  const output2 = await captureConsole(async () => {
    await init(tempDir);
  });

  // Should indicate that .pipeline already exists
  const messages = output2.map(o => o.message).join('\n');
  assert.ok(messages.includes('already exists'), 'Should indicate .pipeline already exists');

  rmSync(tempDir, { recursive: true });
});

test('init: does not overwrite existing BRIEF.md', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Create BRIEF.md first
  const briefPath = join(tempDir, 'BRIEF.md');
  const originalContent = '# My existing BRIEF';
  writeFileSync(briefPath, originalContent, 'utf8');

  // Run init
  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  // BRIEF.md should still have original content
  const content = readFileSync(briefPath, 'utf8');
  assert.strictEqual(content, originalContent, 'BRIEF.md should not be overwritten');

  // Should indicate BRIEF.md already exists
  const messages = output.map(o => o.message).join('\n');
  assert.ok(messages.includes('BRIEF.md already exists'), 'Should indicate BRIEF.md already exists');

  rmSync(tempDir, { recursive: true });
});

test('status: shows "Not Started" for uninitialized project', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Create .pipeline but no pipeline.jsonl
  const output1 = await captureConsole(async () => {
    await init(tempDir);
  });

  // Run status
  const output = await captureConsole(() => {
    status(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');
  assert.ok(messages.includes('Not Started'), 'Should show "Not Started" status');

  rmSync(tempDir, { recursive: true });
});

test('status: works after init without crashing', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Run init
  const initOutput = await captureConsole(async () => {
    await init(tempDir);
  });

  // Run status - should not crash
  const statusOutput = await captureConsole(() => {
    status(tempDir);
  });

  // Should produce some output
  assert.ok(statusOutput.length > 0, 'status should produce output');

  rmSync(tempDir, { recursive: true });
});

test('init: prints helpful next steps', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');

  // Should include next steps guidance
  assert.ok(messages.includes('Next steps') || messages.includes('Done!'), 'Should include next steps');
  assert.ok(messages.includes('BRIEF.md'), 'Should mention BRIEF.md');

  rmSync(tempDir, { recursive: true });
});

test('init: creates expected directory structure', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  await captureConsole(async () => {
    await init(tempDir);
  });

  // Check expected paths exist
  const expectedPaths = [
    '.pipeline',
    '.pipeline/workflow.yaml',
    '.pipeline/prompts',
    'BRIEF.md.example',
  ];

  for (const path of expectedPaths) {
    const fullPath = join(tempDir, path);
    assert.ok(existsSync(fullPath), `${path} should exist`);
  }

  rmSync(tempDir, { recursive: true });
});

test('init: handles frontend-design skill fetch failure gracefully', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // init will try to fetch the skill from GitHub — in test env this may fail
  // Either way it should not throw and should complete successfully
  const output = await captureConsole(async () => {
    await init(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');

  // Should either succeed or show a warning — not crash
  const skillHandled = messages.includes('frontend-design skill');
  assert.ok(skillHandled, 'Should handle frontend-design skill (installed or skipped gracefully)');

  // If skill dir exists, SKILL.md should too — no partial state
  const skillDir = join(tempDir, '.claude', 'skills', 'frontend-design');
  if (existsSync(skillDir)) {
    assert.ok(existsSync(join(skillDir, 'SKILL.md')), 'If skill dir exists, SKILL.md should too');
  }

  rmSync(tempDir, { recursive: true });
});

test('init: BRIEF.md.example contains UI & Design section', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  await captureConsole(async () => {
    await init(tempDir);
  });

  const briefExample = join(tempDir, 'BRIEF.md.example');
  assert.ok(existsSync(briefExample), 'BRIEF.md.example should exist');

  const content = readFileSync(briefExample, 'utf8');
  assert.ok(content.includes('UI & Design'), 'BRIEF.md.example should contain UI & Design section');

  rmSync(tempDir, { recursive: true });
});
