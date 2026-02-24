import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCurrentState, readEvents } from '../state.js';

export function status(projectDir: string) {
  const logFile = join(projectDir, '.pipeline', 'pipeline.jsonl');

  // Check if log file exists
  if (!existsSync(logFile)) {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  Pipeline Status: Not Started                      ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('\nNo pipeline.jsonl found. Run `cc-pipeline run` to start.');
    return;
  }

  try {
    // Get current state
    const currentState = getCurrentState(logFile);
    const events = readEvents(logFile);

    // Display current state
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  Pipeline Status                                   ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║  Phase:  ${String(currentState.phase).padEnd(42)} ║`);
    console.log(`║  Step:   ${String(currentState.step).padEnd(42)} ║`);
    console.log(`║  Status: ${String(currentState.status).padEnd(42)} ║`);
    console.log('╚════════════════════════════════════════════════════╝');

    // Show last 10 events
    const recentEvents = events.slice(-10);

    console.log('\nRecent Events (last 10):');
    console.log('─'.repeat(52));
    recentEvents.forEach(evt => {
      const { ts, event, ...rest } = evt;
      const time = new Date(ts).toLocaleTimeString();
      const fields = Object.entries(rest)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      console.log(`${time} │ ${event.padEnd(18)} │ ${fields}`);
    });
    console.log('─'.repeat(52));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read status: ${message}`);
    process.exit(1);
  }
}
