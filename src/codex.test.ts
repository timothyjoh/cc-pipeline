import { test, mock } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EventEmitter } from 'node:events';

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

/** Build a fake child_process module where spawn() emits output then exits. */
function makeSpawnMock(exitCode: number, output = '', errorOnSpawn = false) {
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

/** Spawn mock that never emits data or close — simulates a hung process. */
function makeHangingSpawnMock(callCount: { n: number }) {
  return {
    spawn: (_cmd: string, _args: string[], _opts: any) => {
      callCount.n++;
      const child = new EventEmitter() as any;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.pid = 10000 + callCount.n;
      // Never emits data or close — hangs until killed externally.
      return child;
    },
  };
}

// ─── Basic behaviour ──────────────────────────────────────────────────────────

test('CodexAgent: exitCode 0 on success, writes header + output to outputPath', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  mock.module('node:child_process', { namedExports: makeSpawnMock(0, 'done!\n') });

  const { CodexAgent } = await import('./agents/codex.js');
  const result = await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 0);
  assert.ok(existsSync(result.outputPath!));
  const out = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(out.includes('codex'), 'header present');
  assert.ok(out.includes('done!'), 'stdout captured');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 1 when codex exits non-zero', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  mock.module('node:child_process', { namedExports: makeSpawnMock(1, 'error\n') });

  const { CodexAgent } = await import('./agents/codex.js');
  const result = await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 1 when spawn errors (codex not installed)', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  mock.module('node:child_process', { namedExports: makeSpawnMock(0, '', true) });

  const { CodexAgent } = await import('./agents/codex.js');
  const result = await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);
  const out = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(out.includes('Codex agent error'));

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: exitCode 130 when agentState.interrupted before run', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  let spawnCalled = false;
  mock.module('node:child_process', { namedExports: { spawn: () => { spawnCalled = true; } } });

  const { CodexAgent } = await import('./agents/codex.js');
  const { agentState } = await import('./agents/base.js');

  agentState.setInterrupted(true);
  const result = await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 130);
  assert.strictEqual(spawnCalled, false);

  agentState.setInterrupted(false);
  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

// ─── Inactivity timeout ───────────────────────────────────────────────────────

test('CodexAgent: non-zero exit from a normal failure does NOT retry', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  let spawnCalls = 0;

  // Process emits data then exits non-zero — should not be retried as inactivity.
  mock.module('node:child_process', {
    namedExports: {
      spawn: (_cmd: string, _args: string[], _opts: any) => {
        spawnCalls++;
        const child = new EventEmitter() as any;
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.pid = 99;
        setImmediate(() => {
          child.stdout.emit('data', Buffer.from('some output\n'));
          child.emit('close', 1);
        });
        return child;
      },
    },
  });

  const { CodexAgent } = await import('./agents/codex.js');
  const result = await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);
  assert.strictEqual(spawnCalls, 1, 'should not retry a normal non-zero exit');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

// ─── Implementation invariants ────────────────────────────────────────────────

test('CodexAgent: uses exec subcommand with --yolo flag', async () => {
  const src = readFileSync(new URL('./agents/codex.ts', import.meta.url), 'utf8');
  assert.ok(src.includes("'exec'"), 'must use exec subcommand');
  assert.ok(src.includes("'--yolo'"), 'must always pass --yolo');
});

test('CodexAgent: always uses shell:false', async () => {
  const src = readFileSync(new URL('./agents/codex.ts', import.meta.url), 'utf8');
  assert.ok(src.includes('shell: false'));
});

test('CodexAgent: stdin is inherit so codex sees a TTY', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();
  let capturedOpts: any = null;

  mock.module('node:child_process', {
    namedExports: {
      spawn: (_cmd: string, _args: string[], opts: any) => {
        capturedOpts = opts;
        const child = new EventEmitter() as any;
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.pid = 99;
        setImmediate(() => child.emit('close', 0));
        return child;
      },
    },
  });

  const { CodexAgent } = await import('./agents/codex.js');
  await new CodexAgent().run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(capturedOpts?.stdio[0], 'inherit', 'stdin must be inherit');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('CodexAgent: MAX_ATTEMPTS and INACTIVITY_MS constants are defined', async () => {
  const src = readFileSync(new URL('./agents/codex.ts', import.meta.url), 'utf8');
  assert.ok(src.includes('MAX_ATTEMPTS'), 'MAX_ATTEMPTS defined');
  assert.ok(src.includes('INACTIVITY_MS'), 'INACTIVITY_MS defined');
});

test('CodexAgent: createAgent() returns a CodexAgent instance', async () => {
  const { CodexAgent, createAgent } = await import('./agents/codex.js');
  assert.ok(createAgent() instanceof CodexAgent);
});
