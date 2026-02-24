import { runEngine } from '../engine.js';

export async function runPipeline(projectDir: string, options: Record<string, unknown> = {}) {
  await runEngine(projectDir, options);
}
