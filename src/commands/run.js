import { runEngine } from '../engine.js';

export async function runPipeline(projectDir, options = {}) {
  try {
    await runEngine(projectDir, options);
  } catch (err) {
    console.error(`Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}
