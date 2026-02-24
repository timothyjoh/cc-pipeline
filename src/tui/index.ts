import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { pipelineEvents } from '../events.js';

export function launchTUI(projectDir: string): void {
  // While Ink owns the terminal, intercept console.log/error so engine
  // messages don't break the UI. Route them as pipeline:log events instead
  // so the TUI can display them in the activity panel.
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);

  const emit = (args: unknown[]) => {
    const message = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ').trim();
    if (message) pipelineEvents.emit('pipeline:log', { message });
  };

  console.log = (...args: unknown[]) => emit(args);
  console.error = (...args: unknown[]) => emit(args);

  const { unmount } = render(React.createElement(App, { events: pipelineEvents, projectDir }));

  // Restore console when the TUI exits
  const restore = () => {
    console.log = origLog;
    console.error = origError;
  };
  pipelineEvents.once('pipeline:exit', restore);
}
