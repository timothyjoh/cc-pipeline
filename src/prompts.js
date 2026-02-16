import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Generate a prompt by reading the template and substituting placeholders
 * @param {string} projectDir - The project directory path
 * @param {object} config - The workflow configuration
 * @param {number} phase - The current phase number
 * @param {string} promptPath - The relative path to the prompt template (e.g., "prompts/spec.md")
 * @returns {string} The generated prompt with substitutions
 */
export function generatePrompt(projectDir, config, phase, promptPath) {
  const promptFile = join(projectDir, '.pipeline', promptPath);

  if (!existsSync(promptFile)) {
    throw new Error(`Prompt file not found: ${promptFile}`);
  }

  // Read the template
  let prompt = readFileSync(promptFile, 'utf-8');

  // Substitute {{PHASE}}
  prompt = prompt.replace(/\{\{PHASE\}\}/g, phase.toString());

  // Substitute {{PREV_REFLECTIONS}}
  let prevReflections = '';
  if (phase > 1) {
    const prevPhase = phase - 1;
    const prevReflectPath = join(projectDir, config.phasesDir, `phase-${prevPhase}`, 'REFLECTIONS.md');
    if (existsSync(prevReflectPath)) {
      prevReflections = `Previous phase reflections (read this file): ${prevReflectPath}`;
    }
  }
  prompt = prompt.replace(/\{\{PREV_REFLECTIONS\}\}/g, prevReflections);

  // Substitute {{BRIEF}}
  let briefContent = '';
  const briefPath = join(projectDir, 'BRIEF.md');
  if (existsSync(briefPath)) {
    briefContent = readFileSync(briefPath, 'utf-8');
  }
  prompt = prompt.replace(/\{\{BRIEF\}\}/g, briefContent);

  // Substitute {{FILE_TREE}} - placeholder for now
  const fileTree = '(file tree generation not yet implemented)';
  prompt = prompt.replace(/\{\{FILE_TREE\}\}/g, fileTree);

  return prompt;
}
