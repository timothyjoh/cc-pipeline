import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');

export async function init(projectDir, options = {}) {
  const pipelineDir = join(projectDir, '.pipeline');
  const briefExample = join(projectDir, 'BRIEF.md.example');
  const brief = join(projectDir, 'BRIEF.md');

  console.log('🔧 Initializing cc-pipeline...\n');

  // Create .pipeline/
  if (existsSync(pipelineDir)) {
    console.log('  ⚠️  .pipeline/ already exists — run `cc-pipeline update` to refresh prompts');
  } else {
    cpSync(join(TEMPLATES_DIR, 'pipeline'), pipelineDir, { recursive: true });
    console.log('  ✅ Created .pipeline/');
  }

  // Copy BRIEF.md.example
  if (existsSync(brief)) {
    console.log('  ✅ BRIEF.md already exists — you\'re all set!');
  } else if (existsSync(briefExample)) {
    console.log('  ⚠️  BRIEF.md.example already exists — skipping');
  } else {
    cpSync(join(TEMPLATES_DIR, 'BRIEF.md.example'), briefExample);
    console.log('  ✅ Created BRIEF.md.example');
  }

  // Copy CLAUDE.md (pipeline instructions for Claude Code)
  const claudeMd = join(projectDir, 'CLAUDE.md');
  if (existsSync(claudeMd)) {
    console.log('  ⚠️  CLAUDE.md already exists — skipping');
  } else {
    cpSync(join(TEMPLATES_DIR, 'CLAUDE.md'), claudeMd);
    console.log('  ✅ Created CLAUDE.md');
  }

  // Fetch Anthropic's frontend-design skill from GitHub
  const skillDir = join(projectDir, '.claude', 'skills', 'frontend-design');
  if (existsSync(join(skillDir, 'SKILL.md'))) {
    console.log('  ✅ Frontend design skill already installed');
  } else {
    const skillUrl = 'https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md';
    try {
      const res = await fetch(skillUrl);
      if (res.ok) {
        const content = await res.text();
        mkdirSync(skillDir, { recursive: true });
        writeFileSync(join(skillDir, 'SKILL.md'), content);
        console.log('  ✅ Installed frontend-design skill (from Anthropic)');
      } else {
        console.log('  ⚠️  Could not fetch frontend-design skill (HTTP ' + res.status + ') — skipping');
      }
    } catch (e) {
      console.log('  ⚠️  Could not fetch frontend-design skill (offline?) — skipping');
    }
  }

  console.log(`
Done! Next steps:

  1. Write your project brief:
     cp BRIEF.md.example BRIEF.md
     (or open Claude Code and it'll help you write one — see CLAUDE.md)

  2. Run the pipeline:
     npx cc-pipeline run

  💡 Tip: Open Claude Code in this project — CLAUDE.md has full
     instructions for writing your brief and running the pipeline.
`);
}
