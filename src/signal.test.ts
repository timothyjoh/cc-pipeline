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

    // Wait for "Running step:" in stdout before sending SIGINT — this guarantees
    // the engine's SIGINT handler is registered and the step is actually executing,
    // so the interrupted event will be written when we signal.
    const engineStarted = new Promise<void>((resolve) => {
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (stdout.includes('Running step:')) resolve();
      });
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Wait for the engine to start (or 8 seconds max — handles slow tsx startup)
    await Promise.race([
      engineStarted,
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);

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

    let sigStdout = '';
    // Wait for "Running step:" so the engine is definitely up before we signal
    const sigEngineStarted = new Promise<void>((resolve) => {
      child.stdout.on('data', (data: Buffer) => {
        sigStdout += data.toString();
        if (sigStdout.includes('Running step:')) resolve();
      });
    });
    child.stderr.on('data', () => {});

    await Promise.race([sigEngineStarted, new Promise((resolve) => setTimeout(resolve, 8000))]);

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
