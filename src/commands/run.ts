import { runEngine } from '../engine.js';

export async function runPipeline(projectDir, options = {}) {
  await runEngine(projectDir, options);
}
