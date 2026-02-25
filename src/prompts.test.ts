import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generatePrompt } from './prompts.js';

/**
 * Tests for prompts.js module
 * Covers generatePrompt with various placeholder substitutions
 */

const mockConfig = {
  name: 'Test Pipeline',
  version: 1,
  phasesDir: 'docs/phases',
  steps: [],
};

test('generatePrompt: substitutes {{PHASE}} placeholder', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const promptTemplate = 'You are working on phase {{PHASE}}. This is phase {{PHASE}}.';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 3, 'prompts/test.md');

  assert.strictEqual(result, 'You are working on phase 3. This is phase 3.');

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: substitutes {{BRIEF}} with BRIEF.md content', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const briefContent = '# My Project\n\nThis is a test project.';
  writeFileSync(join(tempDir, 'BRIEF.md'), briefContent, 'utf8');

  const promptTemplate = 'Project description:\n{{BRIEF}}';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 1, 'prompts/test.md');

  assert.ok(result.includes('# My Project'));
  assert.ok(result.includes('This is a test project.'));

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: handles missing BRIEF.md gracefully', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const promptTemplate = 'Project: {{BRIEF}}';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 1, 'prompts/test.md');

  // Should replace with empty string
  assert.strictEqual(result, 'Project: ');

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: throws on missing prompt template file', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));

  assert.throws(
    () => generatePrompt(tempDir, mockConfig, 1, 'prompts/nonexistent.md'),
    /Prompt file not found/
  );

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: substitutes {{PREV_REFLECTIONS}} for phase > 1', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  const phasesDir = join(tempDir, 'docs', 'phases', 'phase-1');
  mkdirSync(promptsDir, { recursive: true });
  mkdirSync(phasesDir, { recursive: true });

  const reflectionsContent = '# Phase 1 Reflections\n\nWe learned things.';
  writeFileSync(join(phasesDir, 'REFLECTIONS.md'), reflectionsContent, 'utf8');

  const promptTemplate = 'Previous reflections: {{PREV_REFLECTIONS}}';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 2, 'prompts/test.md');

  assert.ok(result.includes('Previous phase reflections'));
  assert.ok(result.includes('phase-1'));
  assert.ok(result.includes('REFLECTIONS.md'));

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: substitutes {{PREV_REFLECTIONS}} empty for phase 1', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const promptTemplate = 'Previous reflections: {{PREV_REFLECTIONS}}\nEnd';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 1, 'prompts/test.md');

  // Should be empty for phase 1
  assert.strictEqual(result, 'Previous reflections: \nEnd');

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: handles missing PREV_REFLECTIONS file gracefully', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const promptTemplate = 'Previous reflections: {{PREV_REFLECTIONS}}';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 2, 'prompts/test.md');

  // No reflections file exists, should be empty
  assert.strictEqual(result, 'Previous reflections: ');

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: substitutes multiple placeholders', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const briefContent = '# My App';
  writeFileSync(join(tempDir, 'BRIEF.md'), briefContent, 'utf8');

  const promptTemplate = `
Phase: {{PHASE}}
Brief: {{BRIEF}}
Phase again: {{PHASE}}
`;
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 5, 'prompts/test.md');

  assert.ok(result.includes('Phase: 5'));
  assert.ok(result.includes('Brief: # My App'));
  assert.ok(result.includes('Phase again: 5'));

  rmSync(tempDir, { recursive: true });
});

test('generatePrompt: substitutes {{FILE_TREE}} placeholder', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-pipeline-test-'));
  const promptsDir = join(tempDir, '.pipeline', 'prompts');
  mkdirSync(promptsDir, { recursive: true });

  const promptTemplate = 'File tree: {{FILE_TREE}}';
  writeFileSync(join(promptsDir, 'test.md'), promptTemplate, 'utf8');

  const result = generatePrompt(tempDir, mockConfig, 1, 'prompts/test.md');

  // Currently a placeholder, but should not crash
  assert.ok(result.includes('file tree generation not yet implemented'));

  rmSync(tempDir, { recursive: true });
});
