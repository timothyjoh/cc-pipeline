import { existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');

export function update(projectDir) {
  const pipelineDir = join(projectDir, '.pipeline');

  if (!existsSync(pipelineDir)) {
    console.error('  ❌ No .pipeline/ directory found. Run `cc-pipeline init` first.');
    process.exit(1);
  }

  console.log('🔄 Updating pipeline templates...\n');

  // Update prompts
  const promptsDir = join(pipelineDir, 'prompts');
  cpSync(join(TEMPLATES_DIR, 'pipeline', 'prompts'), promptsDir, { recursive: true, force: true });
  console.log('  ✅ Updated .pipeline/prompts/');

  // Update .pipeline/CLAUDE.md
  const pipelineClaudeMd = join(pipelineDir, 'CLAUDE.md');
  cpSync(join(TEMPLATES_DIR, 'pipeline', 'CLAUDE.md'), pipelineClaudeMd);
  console.log('  ✅ Updated .pipeline/CLAUDE.md');

  // Update root CLAUDE.md (pipeline section)
  const rootClaudeMd = join(projectDir, 'CLAUDE.md');
  if (!existsSync(rootClaudeMd)) {
    cpSync(join(TEMPLATES_DIR, 'CLAUDE.md'), rootClaudeMd);
    console.log('  ✅ Created CLAUDE.md');
  } else {
    console.log('  ⏭️  CLAUDE.md exists — skipped (edit manually if needed)');
  }

  console.log(`
  ⚠️  workflow.yaml was NOT changed (your customizations are preserved).
  If you need the latest default workflow, delete .pipeline/workflow.yaml
  and run \`cc-pipeline init\` again.
`);
}
