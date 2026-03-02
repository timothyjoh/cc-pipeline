import { existsSync, cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');
const PKG = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));
export async function update(projectDir) {
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
    }
    else {
        console.log('  ⏭️  CLAUDE.md exists — skipped (edit manually if needed)');
    }
    // Fetch/update Anthropic's frontend-design skill
    const skillDir = join(projectDir, '.claude', 'skills', 'frontend-design');
    const skillUrl = 'https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md';
    try {
        const res = await fetch(skillUrl);
        if (res.ok) {
            const content = await res.text();
            mkdirSync(skillDir, { recursive: true });
            writeFileSync(join(skillDir, 'SKILL.md'), content);
            console.log('  ✅ Updated frontend-design skill (from Anthropic)');
        }
        else {
            console.log('  ⚠️  Could not fetch frontend-design skill (HTTP ' + res.status + ') — skipping');
        }
    }
    catch (e) {
        console.log('  ⚠️  Could not fetch frontend-design skill (offline?) — skipping');
    }
    // Patch workflow.yaml: migrate the commit step to claudecode agent + prompt
    // without touching any other customizations.
    const workflowPath = join(pipelineDir, 'workflow.yaml');
    if (existsSync(workflowPath)) {
        try {
            const doc = YAML.parseDocument(readFileSync(workflowPath, 'utf-8'));
            const steps = doc.get('steps');
            if (steps) {
                for (const step of steps.items) {
                    if (step.get('name') === 'commit') {
                        step.set('agent', 'claudecode');
                        step.set('prompt', 'prompts/commit.md');
                        step.set('continue_on_error', true);
                        step.delete('command');
                    }
                }
            }
            writeFileSync(workflowPath, doc.toString(), 'utf-8');
            console.log('  ✅ Patched .pipeline/workflow.yaml commit step (claudecode agent + prompt)');
        }
        catch (e) {
            console.log('  ⚠️  Could not patch workflow.yaml — update it manually if needed');
        }
    }
    console.log(`
  ✅ Updated to cc-pipeline v${PKG.version}
`);
}
//# sourceMappingURL=update.js.map