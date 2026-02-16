import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deriveResumePoint, getCurrentState } from './state.js';

/**
 * Resume logic tests
 * Tests deriveResumePoint() with various JSONL event sequences
 */

// Mock steps array matching workflow.yaml
const mockSteps = [
  { name: 'spec' },
  { name: 'research' },
  { name: 'plan' },
  { name: 'build' },
  { name: 'review' },
  { name: 'fix' },
  { name: 'reflect' },
  { name: 'commit' },
];

test('resume: empty JSONL → phase 1, first step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // No JSONL file exists
  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('resume: step_start only (interrupted mid-step) → resume that step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Write step_start event
  const events = [
    { event: 'step_start', phase: 1, step: 'research', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'research');

  rmSync(tempDir, { recursive: true });
});

test('resume: step_done → next step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Write step_start + step_done
  const events = [
    { event: 'step_start', phase: 1, step: 'spec', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'research'); // Next step after spec

  rmSync(tempDir, { recursive: true });
});

test('resume: phase_complete → next phase, first step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Complete all steps in phase 1
  const events = [
    { event: 'step_start', phase: 1, step: 'spec', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_start', phase: 1, step: 'research', agent: 'claude-piped', ts: '2025-01-01T00:02:00Z' },
    { event: 'step_done', phase: 1, step: 'research', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:03:00Z' },
    { event: 'phase_complete', phase: 1, ts: '2025-01-01T00:04:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 2);
  assert.strictEqual(resume.stepName, 'spec'); // First step of new phase

  rmSync(tempDir, { recursive: true });
});

test('resume: multiple phases completed → correct next phase', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Complete phase 1 and phase 2
  const events = [
    { event: 'phase_complete', phase: 1, ts: '2025-01-01T00:00:00Z' },
    { event: 'step_start', phase: 2, step: 'spec', agent: 'claude-piped', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_done', phase: 2, step: 'spec', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:02:00Z' },
    { event: 'phase_complete', phase: 2, ts: '2025-01-01T00:03:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 3);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('resume: mid-phase partial completion → correct next step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Complete first 3 steps, then stop
  const events = [
    { event: 'step_start', phase: 1, step: 'spec', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_start', phase: 1, step: 'research', agent: 'claude-piped', ts: '2025-01-01T00:02:00Z' },
    { event: 'step_done', phase: 1, step: 'research', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:03:00Z' },
    { event: 'step_start', phase: 1, step: 'plan', agent: 'claude-piped', ts: '2025-01-01T00:04:00Z' },
    { event: 'step_done', phase: 1, step: 'plan', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:05:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'build'); // Next step after plan

  rmSync(tempDir, { recursive: true });
});

test('resume: step_skip → next step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Complete review, skip fix (because no MUST-FIX.md), should go to reflect
  const events = [
    { event: 'step_start', phase: 1, step: 'review', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'review', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_skip', phase: 1, step: 'fix', reason: 'MUST-FIX.md not found', ts: '2025-01-01T00:02:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'reflect'); // Next step after fix

  rmSync(tempDir, { recursive: true });
});

test('resume: last step done → next phase', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  // Complete last step (commit) without phase_complete event
  const events = [
    { event: 'step_start', phase: 1, step: 'commit', agent: 'bash', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'commit', agent: 'bash', status: 'ok', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  // Last step done → should advance to next phase
  assert.strictEqual(resume.phase, 2);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: no events → ready state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 1);
  assert.strictEqual(state.step, 'pending');
  assert.strictEqual(state.status, 'ready');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: step_start → running state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 2, step: 'build', agent: 'claude-interactive', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 2);
  assert.strictEqual(state.step, 'build');
  assert.strictEqual(state.status, 'running');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: step_done → complete state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'spec', agent: 'claude-piped', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', agent: 'claude-piped', status: 'ok', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 1);
  assert.strictEqual(state.step, 'spec');
  assert.strictEqual(state.status, 'complete');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: phase_complete → phase done', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'phase_complete', phase: 3, ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 3);
  assert.strictEqual(state.step, 'done');
  assert.strictEqual(state.status, 'complete');

  rmSync(tempDir, { recursive: true });
});
