import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCurrentState, readEvents } from '../state.js';

export function status(projectDir) {
  const logFile = join(projectDir, '.pipeline', 'pipeline.jsonl');

  // Check if log file exists
  if (!existsSync(logFile)) {
    console.log('No pipeline.jsonl found. Pipeline has not started yet.');
    return;
  }

  try {
    // Get current state
    const currentState = getCurrentState(logFile);

    // Display current state
    console.log('\n=== Pipeline Status ===');
    console.log(`Phase: ${currentState.phase}`);
    console.log(`Step: ${currentState.step}`);
    console.log(`Status: ${currentState.status}`);

    // Show last 10 events
    const events = readEvents(logFile);
    const recentEvents = events.slice(-10);

    console.log('\n=== Recent Events (last 10) ===');
    recentEvents.forEach(evt => {
      const { ts, event, ...rest } = evt;
      const timestamp = new Date(ts).toLocaleString();
      const fields = Object.entries(rest)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      console.log(`[${timestamp}] ${event} ${fields}`);
    });
  } catch (err) {
    console.error(`Failed to read status: ${err.message}`);
    process.exit(1);
  }
}
