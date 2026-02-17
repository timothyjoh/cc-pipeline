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

// Helper to capture console.log output
function captureConsole(fn) {
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
    fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  return output;
}

test('init: creates .pipeline directory with expected files', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = captureConsole(() => {
    init(tempDir);
  });

  // Verify .pipeline directory exists
  const pipelineDir = join(tempDir, '.pipeline');
  assert.ok(existsSync(pipelineDir), '.pipeline directory should exist');

  // Verify .pipeline directory has files
  const pipelineFiles = readdirSync(pipelineDir);
  assert.ok(pipelineFiles.length > 0, '.pipeline directory should contain files');

  rmSync(tempDir, { recursive: true });
});

test('init: creates BRIEF.md.example', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = captureConsole(() => {
    init(tempDir);
  });

  // Verify BRIEF.md.example exists
  const briefExample = join(tempDir, 'BRIEF.md.example');
  assert.ok(existsSync(briefExample), 'BRIEF.md.example should exist');

  // Verify it has content
  const content = readFileSync(briefExample, 'utf8');
  assert.ok(content.length > 0, 'BRIEF.md.example should have content');

  rmSync(tempDir, { recursive: true });
});

test('init: creates workflow.yaml', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = captureConsole(() => {
    init(tempDir);
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

test('init: creates prompts directory', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = captureConsole(() => {
    init(tempDir);
  });

  // Verify prompts directory exists
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  assert.ok(existsSync(promptsDir), 'prompts directory should exist');

  // Verify it has some prompt files
  const promptFiles = readdirSync(promptsDir);
  assert.ok(promptFiles.length > 0, 'prompts directory should contain files');

  rmSync(tempDir, { recursive: true });
});

test('init: is idempotent - running again does not overwrite', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Run init first time
  const output1 = captureConsole(() => {
    init(tempDir);
  });

  // Verify .pipeline was created
  const pipelineDir = join(tempDir, '.pipeline');
  assert.ok(existsSync(pipelineDir));

  // Run init second time
  const output2 = captureConsole(() => {
    init(tempDir);
  });

  // Should indicate that .pipeline already exists
  const messages = output2.map(o => o.message).join('\n');
  assert.ok(messages.includes('already exists'), 'Should indicate .pipeline already exists');

  rmSync(tempDir, { recursive: true });
});

test('init: does not overwrite existing BRIEF.md', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Create BRIEF.md first
  const briefPath = join(tempDir, 'BRIEF.md');
  const originalContent = '# My existing BRIEF';
  writeFileSync(briefPath, originalContent, 'utf8');

  // Run init
  const output = captureConsole(() => {
    init(tempDir);
  });

  // BRIEF.md should still have original content
  const content = readFileSync(briefPath, 'utf8');
  assert.strictEqual(content, originalContent, 'BRIEF.md should not be overwritten');

  // Should indicate BRIEF.md already exists
  const messages = output.map(o => o.message).join('\n');
  assert.ok(messages.includes('BRIEF.md already exists'), 'Should indicate BRIEF.md already exists');

  rmSync(tempDir, { recursive: true });
});

test('status: shows "Not Started" for uninitialized project', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Create .pipeline but no pipeline.jsonl
  const output1 = captureConsole(() => {
    init(tempDir);
  });

  // Run status
  const output = captureConsole(() => {
    status(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');
  assert.ok(messages.includes('Not Started'), 'Should show "Not Started" status');

  rmSync(tempDir, { recursive: true });
});

test('status: works after init without crashing', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  // Run init
  const initOutput = captureConsole(() => {
    init(tempDir);
  });

  // Run status - should not crash
  let statusOutput;
  assert.doesNotThrow(() => {
    statusOutput = captureConsole(() => {
      status(tempDir);
    });
  }, 'status command should not crash after init');

  // Should produce some output
  assert.ok(statusOutput.length > 0, 'status should produce output');

  rmSync(tempDir, { recursive: true });
});

test('init: prints helpful next steps', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  const output = captureConsole(() => {
    init(tempDir);
  });

  const messages = output.map(o => o.message).join('\n');

  // Should include next steps guidance
  assert.ok(messages.includes('Next steps') || messages.includes('Done!'), 'Should include next steps');
  assert.ok(messages.includes('BRIEF.md'), 'Should mention BRIEF.md');

  rmSync(tempDir, { recursive: true });
});

test('init: creates expected directory structure', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  captureConsole(() => {
    init(tempDir);
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
