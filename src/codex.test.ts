import { test, mock } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Unit tests for CodexAgent — shells out to the `codex` CLI.
 */

function setupTempProject() {
  const projectDir = mkdtempSync(join(tmpdir(), 'cc-codex-test-'));
  mkdirSync(join(projectDir, '.pipeline'), { recursive: true });
  mkdirSync(join(projectDir, 'prompts'), { recursive: true });
  writeFileSync(join(projectDir, 'prompts', 'build.md'), 'build the project', 'utf-8');
  return projectDir;
}

function makeContext(projectDir: string) {
  return {
    projectDir,
    config: { project: { name: 'test' }, phasesDir: 'docs/phases', steps: [], usageLimits: {} },
    logFile: null,
  };
}

const STEP = { name: 'build', agent: 'codex' };
const PHASE = 1;
const PROMPT_PATH = 'prompts/build.md';

// ─── Spawn mock helper ───────────────────────────────────────────────────────

/**
 * Returns a mock child_process module where spawn() resolves with the given
 * exit code and optionally emits output data.
 */
function makeSpawnMock(exitCode: number, output = '', errorOnSpawn = false) {
  const { EventEmitter } = require('node:events');

  return {
    spawn: (_cmd: string, _args: string[], _opts: any) => {
      const child = new EventEmitter() as any;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.pid = 12345;

      if (errorOnSpawn) {
        setImmediate(() => child.emit('error', new Error('spawn ENOENT')));
      } else {
        setImmediate(() => {
          if (output) child.stdout.emit('data', Buffer.from(output));
          child.emit('close', exitCode);
        });
      }
      return child;
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('CodexAgent: exitCode 0 on success, writes header + output to outputPath', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();

  mock.module('node:child_process', { namedExports: makeSpawnMock(0, 'done!\n') });

  const { CodexAgent } = await import('./agents/codex.js');
  const agent = new CodexAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 0);
  assert.ok(existsSync(result.outputPath!), 'outputPath should exist');
  const output = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(output.includes('codex'), 'output should contain command header');
  assert.ok(output.includes('done!'), 'output should contain codex stdout');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 1 when codex exits non-zero', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();

  mock.module('node:child_process', { namedExports: makeSpawnMock(1, 'error output\n') });

  const { CodexAgent } = await import('./agents/codex.js');
  const agent = new CodexAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 1 when spawn errors (codex not installed)', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();

  mock.module('node:child_process', { namedExports: makeSpawnMock(0, '', true) });

  const { CodexAgent } = await import('./agents/codex.js');
  const agent = new CodexAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);
  const output = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(output.includes('Codex agent error'), 'should write error message on spawn failure');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 130 when agentState.interrupted before run', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();

  let spawnCalled = false;
  mock.module('node:child_process', {
    namedExports: {
      spawn: () => { spawnCalled = true; },
    },
  });

  const { CodexAgent } = await import('./agents/codex.js');
  const { agentState } = await import('./agents/base.js');

  agentState.setInterrupted(true);
  const agent = new CodexAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 130);
  assert.strictEqual(spawnCalled, false, 'spawn should not be called when already interrupted');

  agentState.setInterrupted(false);
  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: always uses shell:false (no shell escaping)', async () => {
  const { readFileSync: readFS } = await import('node:fs');
  const { join: pathJoin, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dir = dirname(fileURLToPath(import.meta.url));
  const source = readFS(pathJoin(__dir, 'agents', 'codex.ts'), 'utf8');
  assert.ok(source.includes('shell: false'), 'codex agent must use shell:false to avoid prompt escaping issues');
});

test('CodexAgent: --yolo flag always present in args', async () => {
  const { readFileSync: readFS } = await import('node:fs');
  const { join: pathJoin, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dir = dirname(fileURLToPath(import.meta.url));
  const source = readFS(pathJoin(__dir, 'agents', 'codex.ts'), 'utf8');
  assert.ok(source.includes("'--yolo'"), 'codex agent must always pass --yolo');
});

test('CodexAgent: createAgent() returns a CodexAgent instance', async () => {
  const { CodexAgent, createAgent } = await import('./agents/codex.js');
  const agent = createAgent();
  assert.ok(agent instanceof CodexAgent);
});
