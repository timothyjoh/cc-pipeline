import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { pipelineEvents } from '../events.js';

export function launchTUI(projectDir: string): void {
  // Intercept console.log/error so engine messages don't break the UI.
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);

  const emit = (args: unknown[]) => {
    const message = args.map(a => (typeof a === 'string' ? a : String(a))).join(' ').trim();
    if (message) pipelineEvents.emit('pipeline:log', { message });
  };

  console.log = (...args: unknown[]) => emit(args);
  console.error = (...args: unknown[]) => emit(args);

  // Intercept process.stderr.write — strip ANSI and route to TUI panel
  // so SDK/engine messages don't leak below the Ink layout.
  (process.stderr as any).write = (chunk: any, enc?: any, cb?: any): boolean => {
    const text = (Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk))
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').trim();
    if (text) pipelineEvents.emit('pipeline:log', { message: text });
    if (typeof enc === 'function') enc();
    else if (typeof cb === 'function') cb();
    return true;
  };

  render(React.createElement(App, { events: pipelineEvents, projectDir }));

  const restore = () => {
    console.log = origLog;
    console.error = origError;
    delete (process.stderr as any).write;
  };
  pipelineEvents.once('pipeline:exit', restore);
}
