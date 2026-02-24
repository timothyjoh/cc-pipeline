import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../config.js';

export function reset(projectDir) {
  const logFile = join(projectDir, '.pipeline', 'pipeline.jsonl');
  const statusFile = join(projectDir, 'STATUS.md');

  // Get phases dir from config
  let phasesDir = join(projectDir, 'docs', 'phases');
  try {
    const config = loadConfig(join(projectDir, '.pipeline', 'workflow.yaml'));
    phasesDir = join(projectDir, config.phasesDir);
  } catch (e) {
    // Fall back to default
  }

  console.log('🔄 Resetting pipeline...\n');

  if (existsSync(logFile)) {
    rmSync(logFile);
    console.log('  ✅ Removed pipeline.jsonl (event log)');
  } else {
    console.log('  ⚠️  No pipeline.jsonl found');
  }

  if (existsSync(phasesDir)) {
    rmSync(phasesDir, { recursive: true });
    console.log(`  ✅ Removed ${phasesDir.replace(projectDir + '/', '')}/ (phase outputs)`);
  } else {
    console.log('  ⚠️  No phases directory found');
  }

  if (existsSync(statusFile)) {
    rmSync(statusFile);
    console.log('  ✅ Removed STATUS.md');
  }

  // Clean up pipeline temp files
  for (const f of ['.step-done', 'current-prompt.md']) {
    const fp = join(projectDir, '.pipeline', f);
    if (existsSync(fp)) rmSync(fp);
  }

  console.log('\n  Pipeline reset. Run `cc-pipeline run` to start fresh.');
}
