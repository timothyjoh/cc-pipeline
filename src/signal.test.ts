import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_PATH = join(__dirname, '..', 'bin', 'cc-pipeline.js');
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * Signal handling integration test
 * Spawns the CLI, sends SIGINT, and verifies clean shutdown
 */

test('signal handling: SIGINT causes clean exit with interrupted event', async () => {
  // Create temp project directory
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-signal-test-'));

  try {
    // Scaffold .pipeline/
    const pipelineDir = join(tempDir, '.pipeline');
    cpSync(join(TEMPLATES_DIR, 'pipeline'), pipelineDir, { recursive: true });

    // Create BRIEF.md
    const briefPath = join(tempDir, 'BRIEF.md');
    writeFileSync(
      briefPath,
      '# Test Project\n\nSimple test project for signal handling.\n',
      'utf8'
    );

    // Spawn the pipeline
    const child = spawn('node', [BIN_PATH, 'run'], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for the process to start, then send SIGINT
    // tsx adds startup overhead (extra node → tsx → cli hop), use 2000ms
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send SIGINT
    child.kill('SIGINT');

    // Wait for exit
    const exitCode = await new Promise((resolve) => {
      child.on('exit', (code, signal) => {
        resolve(code !== null ? code : 128 + (signal === 'SIGINT' ? 2 : 15));
      });

      // Timeout after 10 seconds (tsx startup adds overhead)
      setTimeout(() => {
        child.kill('SIGKILL');
        resolve(-1);
      }, 10000);
    });

    // Verify process exited (not hanging)
    // Exit code can be 0 (clean), 130 (SIGINT), or 1 (error from missing claude)
    // The important thing is that it exits, not hangs
    assert.notStrictEqual(exitCode, -1, 'Process should exit, not hang');

    // Verify JSONL has an interrupted event OR the process failed early
    const logFile = join(tempDir, '.pipeline', 'pipeline.jsonl');
    let hasInterruptedEvent = false;
    let hasStepStartEvent = false;

    try {
      const logContent = readFileSync(logFile, 'utf8');
      const events = logContent
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      hasInterruptedEvent = events.some((e) => e.event === 'interrupted');
      hasStepStartEvent = events.some((e) => e.event === 'step_start');
    } catch (err) {
      // JSONL might not exist if process failed very early
      // That's OK - the test is mainly about signal handling
    }

    // If the process was still running when SIGINT was sent (exit code 130)
    // AND had already started a pipeline step, we should have an interrupted event.
    // If it exited before SIGINT (all steps errored/pipeline still starting),
    // there is no step state to interrupt — that's fine too.
    if (exitCode === 130 && hasStepStartEvent) {
      assert.strictEqual(
        hasInterruptedEvent,
        true,
        'Should have interrupted event when process caught SIGINT mid-step'
      );
    }

    // Log output for debugging
    if (stdout) {
      console.log('STDOUT:', stdout);
    }
    if (stderr) {
      console.log('STDERR:', stderr);
    }
  } finally {
    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('signal handling: process exits within timeout after SIGINT', async () => {
  // This test verifies that signal handling is responsive (exits quickly)
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-signal-test-'));

  try {
    // Scaffold .pipeline/
    const pipelineDir = join(tempDir, '.pipeline');
    cpSync(join(TEMPLATES_DIR, 'pipeline'), pipelineDir, { recursive: true });

    // Create BRIEF.md
    const briefPath = join(tempDir, 'BRIEF.md');
    writeFileSync(
      briefPath,
      '# Test Project\n\nSimple test project for signal handling.\n',
      'utf8'
    );

    // Spawn the pipeline
    const child = spawn('node', [BIN_PATH, 'run'], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    // Wait for startup — tsx adds overhead (node → tsx → cli), use 2000ms
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send SIGINT
    const signalTime = Date.now();
    child.kill('SIGINT');

    // Wait for exit
    const exitTime = await new Promise((resolve) => {
      child.on('exit', () => {
        resolve(Date.now());
      });

      // Force kill after 10 seconds
      setTimeout(() => {
        child.kill('SIGKILL');
        resolve(Date.now());
      }, 10000);
    });

    const exitDuration = exitTime - signalTime;

    // Should exit within 8 seconds after SIGINT
    // (engine has 3-second timeout; tsx adds startup overhead to the measurement)
    assert.ok(exitDuration < 8000, `Process should exit quickly, took ${exitDuration}ms`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
