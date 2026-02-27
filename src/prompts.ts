import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Generate a prompt by reading the template and substituting placeholders
 * @param {string} projectDir - The project directory path
 * @param {object} config - The workflow configuration
 * @param {number} phase - The current phase number
 * @param {string} promptPath - The relative path to the prompt template (e.g., "prompts/spec.md")
 * @returns {string} The generated prompt with substitutions
 */
export function generatePrompt(projectDir: string, config: any, phase: number, promptPath: string | null): string {
  const promptFile = join(projectDir, '.pipeline', promptPath ?? '');

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

  // Substitute {{NEXT}} — contents of previous phase's NEXT.md (if exists)
  let nextContent = '';
  if (phase > 1) {
    const prevNextPath = join(projectDir, config.phasesDir, `phase-${phase - 1}`, 'NEXT.md');
    if (existsSync(prevNextPath)) {
      nextContent = readFileSync(prevNextPath, 'utf-8');
    }
  }
  prompt = prompt.replace(/\{\{NEXT\}\}/g, nextContent);

  // Substitute {{EPIC}} — contents of the Epic file referenced in NEXT.md
  // Parses "Epic: epic-N-name.md" from NEXT content to find the file
  let epicContent = '';
  if (nextContent) {
    const epicMatch = nextContent.match(/^Epic:\s*(.+\.md)/m);
    if (epicMatch) {
      const epicPath = join(projectDir, 'docs', 'epics', epicMatch[1].trim());
      if (existsSync(epicPath)) {
        epicContent = readFileSync(epicPath, 'utf-8');
      }
    }
  }
  prompt = prompt.replace(/\{\{EPIC\}\}/g, epicContent);

  // Substitute {{ALL_EPICS}} — concatenated contents of all docs/epics/*.md files
  let allEpics = '';
  const epicsDir = join(projectDir, 'docs', 'epics');
  if (existsSync(epicsDir)) {
    const files = readdirSync(epicsDir).filter(f => f.endsWith('.md')).sort();
    allEpics = files.map(f => {
      const content = readFileSync(join(epicsDir, f), 'utf-8');
      return `--- ${f} ---\n${content}`;
    }).join('\n\n');
  }
  prompt = prompt.replace(/\{\{ALL_EPICS\}\}/g, allEpics);

  // Substitute {{FILE_TREE}} - placeholder for now
  const fileTree = '(file tree generation not yet implemented)';
  prompt = prompt.replace(/\{\{FILE_TREE\}\}/g, fileTree);

  return prompt;
}
