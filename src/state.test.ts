import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendEvent, readEvents, getCurrentState, deriveResumePoint } from './state.js';

/**
 * Tests for state.js module
 * Covers appendEvent, readEvents, getCurrentState, deriveResumePoint
 */

const mockSteps = [
  { name: 'spec' },
  { name: 'research' },
  { name: 'plan' },
  { name: 'build' },
];

// appendEvent tests
test('appendEvent: writes JSONL line with timestamp', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const event = { event: 'step_start', phase: 1, step: 'spec' };
  appendEvent(logFile, event);

  const content = readFileSync(logFile, 'utf8');
  const lines = content.trim().split('\n');

  assert.strictEqual(lines.length, 1);

  const parsed = JSON.parse(lines[0]);
  assert.strictEqual(parsed.event, 'step_start');
  assert.strictEqual(parsed.phase, 1);
  assert.strictEqual(parsed.step, 'spec');
  assert.ok(parsed.ts); // Has timestamp
  assert.ok(new Date(parsed.ts).getTime() > 0); // Valid ISO date

  rmSync(tempDir, { recursive: true });
});

test('appendEvent: creates parent directories if missing', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'nested', 'dir', 'pipeline.jsonl');

  assert.strictEqual(existsSync(join(tempDir, 'nested')), false);

  const event = { event: 'step_start', phase: 1, step: 'spec' };
  appendEvent(logFile, event);

  assert.ok(existsSync(logFile));

  rmSync(tempDir, { recursive: true });
});

test('appendEvent: appends multiple events', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  appendEvent(logFile, { event: 'step_start', phase: 1, step: 'spec' });
  appendEvent(logFile, { event: 'step_done', phase: 1, step: 'spec' });
  appendEvent(logFile, { event: 'step_start', phase: 1, step: 'research' });

  const content = readFileSync(logFile, 'utf8');
  const lines = content.trim().split('\n');

  assert.strictEqual(lines.length, 3);
  assert.strictEqual(JSON.parse(lines[0]).event, 'step_start');
  assert.strictEqual(JSON.parse(lines[1]).event, 'step_done');
  assert.strictEqual(JSON.parse(lines[2]).event, 'step_start');

  rmSync(tempDir, { recursive: true });
});

// readEvents tests
test('readEvents: returns empty array for missing file', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = readEvents(logFile);

  assert.deepStrictEqual(events, []);

  rmSync(tempDir, { recursive: true });
});

test('readEvents: returns empty array for empty file', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  writeFileSync(logFile, '', 'utf8');

  const events = readEvents(logFile);

  assert.deepStrictEqual(events, []);

  rmSync(tempDir, { recursive: true });
});

test('readEvents: reads all events from JSONL', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const eventData = [
    { event: 'step_start', phase: 1, step: 'spec', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_start', phase: 1, step: 'research', ts: '2025-01-01T00:02:00Z' },
  ];

  writeFileSync(logFile, eventData.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const events = readEvents(logFile);

  assert.strictEqual(events.length, 3);
  assert.strictEqual(events[0].event, 'step_start');
  assert.strictEqual(events[1].event, 'step_done');
  assert.strictEqual(events[2].event, 'step_start');

  rmSync(tempDir, { recursive: true });
});

test('readEvents: skips malformed lines', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const content = [
    '{"event":"step_start","phase":1,"step":"spec","ts":"2025-01-01T00:00:00Z"}',
    'invalid json line here',
    '{"event":"step_done","phase":1,"step":"spec","ts":"2025-01-01T00:01:00Z"}',
    '{incomplete json',
    '{"event":"step_start","phase":1,"step":"research","ts":"2025-01-01T00:02:00Z"}',
  ].join('\n') + '\n';

  writeFileSync(logFile, content, 'utf8');

  const events = readEvents(logFile);

  // Should only parse the 3 valid lines
  assert.strictEqual(events.length, 3);
  assert.strictEqual(events[0].event, 'step_start');
  assert.strictEqual(events[1].event, 'step_done');
  assert.strictEqual(events[2].event, 'step_start');

  rmSync(tempDir, { recursive: true });
});

test('readEvents: handles blank lines', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const content = [
    '{"event":"step_start","phase":1,"step":"spec","ts":"2025-01-01T00:00:00Z"}',
    '',
    '{"event":"step_done","phase":1,"step":"spec","ts":"2025-01-01T00:01:00Z"}',
    '   ',
    '{"event":"step_start","phase":1,"step":"research","ts":"2025-01-01T00:02:00Z"}',
  ].join('\n') + '\n';

  writeFileSync(logFile, content, 'utf8');

  const events = readEvents(logFile);

  assert.strictEqual(events.length, 3);

  rmSync(tempDir, { recursive: true });
});

// getCurrentState tests
test('getCurrentState: no events returns ready state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const state = getCurrentState(logFile);

  assert.deepStrictEqual(state, { phase: 1, step: 'pending', status: 'ready' });

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: step_start returns running state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 2, step: 'build', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 2);
  assert.strictEqual(state.step, 'build');
  assert.strictEqual(state.status, 'running');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: step_done returns complete state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'spec', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 1);
  assert.strictEqual(state.step, 'spec');
  assert.strictEqual(state.status, 'complete');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: step_skip returns complete state', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_skip', phase: 1, step: 'fix', reason: 'no MUST-FIX.md', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  assert.strictEqual(state.phase, 1);
  assert.strictEqual(state.step, 'fix');
  assert.strictEqual(state.status, 'complete');

  rmSync(tempDir, { recursive: true });
});

test('getCurrentState: phase_complete returns done state', () => {
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

test('getCurrentState: uses last relevant event', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'spec', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', ts: '2025-01-01T00:01:00Z' },
    { event: 'step_start', phase: 1, step: 'research', ts: '2025-01-01T00:02:00Z' },
    { event: 'some_other_event', data: 'irrelevant', ts: '2025-01-01T00:03:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const state = getCurrentState(logFile);

  // Should use the last step_start (research), not the irrelevant event
  assert.strictEqual(state.phase, 1);
  assert.strictEqual(state.step, 'research');
  assert.strictEqual(state.status, 'running');

  rmSync(tempDir, { recursive: true });
});

// deriveResumePoint tests
test('deriveResumePoint: fresh start', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('deriveResumePoint: resume running step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'research', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'research');

  rmSync(tempDir, { recursive: true });
});

test('deriveResumePoint: advance after step completion', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'spec', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'spec', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'research'); // Next step

  rmSync(tempDir, { recursive: true });
});

test('deriveResumePoint: advance to next phase after phase_complete', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'phase_complete', phase: 1, ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 2);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('deriveResumePoint: advance to next phase after last step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_start', phase: 1, step: 'build', ts: '2025-01-01T00:00:00Z' },
    { event: 'step_done', phase: 1, step: 'build', ts: '2025-01-01T00:01:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  // build is last step, so should advance to phase 2
  assert.strictEqual(resume.phase, 2);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});

test('deriveResumePoint: handles unknown step by starting from beginning', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const logFile = join(tempDir, 'pipeline.jsonl');

  const events = [
    { event: 'step_done', phase: 1, step: 'unknown_step', ts: '2025-01-01T00:00:00Z' },
  ];
  writeFileSync(logFile, events.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');

  const resume = deriveResumePoint(logFile, mockSteps);

  assert.strictEqual(resume.phase, 1);
  assert.strictEqual(resume.stepName, 'spec');

  rmSync(tempDir, { recursive: true });
});
