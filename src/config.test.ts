import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig, getStepByName, getStepIndex, getNextStep, getFirstStep } from './config.js';

/**
 * Tests for config.js module
 * Covers loadConfig, getStepByName, getStepIndex, getNextStep, getFirstStep
 */

const minimalWorkflowYaml = `
name: Test Pipeline
version: 1
phases_dir: docs/phases

steps:
  - name: spec
    description: Write specification
    agent: claude-piped
    prompt: prompts/spec.md
    model: sonnet

  - name: build
    description: Build the project
    agent: claude-interactive
    prompt: prompts/build.md
    model: opus

  - name: test
    description: Run tests
    agent: bash
    command: npm test
`;

const workflowWithOptionalFields = `
name: Advanced Pipeline
version: 2
phases_dir: phases

usage_check:
  when: step_boundary

steps:
  - name: spec
    description: Write specification
    agent: claude-piped
    prompt: prompts/spec.md
    model: sonnet
    skip_unless: SPEC_NEEDED.md
    output: docs/spec.md

  - name: build
    description: Build the project
    agent: claude-interactive
    prompt: prompts/build.md
    model: opus
    test_gate: npm test
`;

// loadConfig tests
test('loadConfig: reads and parses workflow.yaml', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(config.name, 'Test Pipeline');
  assert.strictEqual(config.version, 1);
  assert.strictEqual(config.phasesDir, 'docs/phases');
  assert.strictEqual(config.steps.length, 3);

  rmSync(tempDir, { recursive: true });
});

test('loadConfig: normalizes snake_case to camelCase', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, workflowWithOptionalFields, 'utf8');

  const config = loadConfig(tempDir);

  // Check top-level normalization
  assert.strictEqual(config.phasesDir, 'phases');
  assert.ok(config.usageCheck);
  assert.strictEqual(config.usageCheck.when, 'step_boundary');

  // Check step-level normalization
  const step = config.steps[0];
  assert.strictEqual(step.skipUnless, 'SPEC_NEEDED.md');
  assert.strictEqual(step.output, 'docs/spec.md');

  const buildStep = config.steps[1];
  assert.strictEqual(buildStep.testGate, 'npm test');

  rmSync(tempDir, { recursive: true });
});

test('loadConfig: throws on missing file', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  assert.throws(
    () => loadConfig(tempDir),
    /Workflow file not found/
  );

  rmSync(tempDir, { recursive: true });
});

test('loadConfig: provides default values for missing fields', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  const minimalYaml = `
steps:
  - name: spec
    agent: claude-piped
    prompt: prompts/spec.md
    model: sonnet
`;

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(config.name, 'Unnamed Pipeline');
  assert.strictEqual(config.version, 1);
  assert.strictEqual(config.phasesDir, 'docs/phases');
  assert.ok(config.usageCheck);
  assert.strictEqual(config.usageCheck.when, 'phase_boundary');

  rmSync(tempDir, { recursive: true });
});

test('loadConfig: handles empty description', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  config.steps.forEach(step => {
    assert.ok(step.description !== undefined);
  });

  rmSync(tempDir, { recursive: true });
});

// getStepByName tests
test('getStepByName: finds step by name', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);
  const step = getStepByName(config, 'build');

  assert.ok(step);
  assert.strictEqual(step.name, 'build');
  assert.strictEqual(step.agent, 'claude-interactive');

  rmSync(tempDir, { recursive: true });
});

test('getStepByName: returns null for unknown step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);
  const step = getStepByName(config, 'nonexistent');

  assert.strictEqual(step, null);

  rmSync(tempDir, { recursive: true });
});

// getStepIndex tests
test('getStepIndex: finds index by name', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(getStepIndex(config, 'spec'), 0);
  assert.strictEqual(getStepIndex(config, 'build'), 1);
  assert.strictEqual(getStepIndex(config, 'test'), 2);

  rmSync(tempDir, { recursive: true });
});

test('getStepIndex: returns -1 for unknown step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);
  const index = getStepIndex(config, 'nonexistent');

  assert.strictEqual(index, -1);

  rmSync(tempDir, { recursive: true });
});

// getNextStep tests
test('getNextStep: returns next step name', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(getNextStep(config, 'spec'), 'build');
  assert.strictEqual(getNextStep(config, 'build'), 'test');

  rmSync(tempDir, { recursive: true });
});

test('getNextStep: returns "done" at end of steps', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(getNextStep(config, 'test'), 'done');

  rmSync(tempDir, { recursive: true });
});

test('getNextStep: throws for unknown step', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.throws(
    () => getNextStep(config, 'nonexistent'),
    /Step not found/
  );

  rmSync(tempDir, { recursive: true });
});

// getFirstStep tests
test('getFirstStep: returns first step name', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, minimalWorkflowYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.strictEqual(getFirstStep(config), 'spec');

  rmSync(tempDir, { recursive: true });
});

test('getFirstStep: throws if no steps defined', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const pipelineDir = join(tempDir, '.pipeline');
  const workflowPath = join(pipelineDir, 'workflow.yaml');

  const emptyYaml = `
name: Empty Pipeline
version: 1
`;

  mkdirSync(pipelineDir, { recursive: true });
  writeFileSync(workflowPath, emptyYaml, 'utf8');

  const config = loadConfig(tempDir);

  assert.throws(
    () => getFirstStep(config),
    /No steps defined/
  );

  rmSync(tempDir, { recursive: true });
});
