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

  // Intercept process.stderr.write — strip ANSI and route to TUI panel.
  (process.stderr as any).write = (chunk: any, enc?: any, cb?: any): boolean => {
    const text = (Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk))
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').trim();
    if (text) pipelineEvents.emit('pipeline:log', { message: text });
    if (typeof enc === 'function') enc();
    else if (typeof cb === 'function') cb();
    return true;
  };

  // Save the real stdout write before suppression so Ink can still render.
  const realStdoutWrite = process.stdout.write.bind(process.stdout);

  // Give Ink a proxy over process.stdout that always uses the real write,
  // so Ink's rendering is unaffected even after we suppress stdout below.
  const inkStream = new Proxy(process.stdout, {
    get(target, prop) {
      if (prop === 'write') return realStdoutWrite;
      const val = (target as any)[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });

  // Suppress direct process.stdout.write — anything the SDK or subprocesses
  // write to stdout goes nowhere instead of breaking the TUI layout.
  (process.stdout as any).write = (_chunk: any, enc?: any, cb?: any): boolean => {
    if (typeof enc === 'function') enc();
    else if (typeof cb === 'function') cb();
    return true;
  };

  render(
    React.createElement(App, { events: pipelineEvents, projectDir }),
    { stdout: inkStream as any },
  );

  const restore = () => {
    console.log = origLog;
    console.error = origError;
    delete (process.stdout as any).write;
    delete (process.stderr as any).write;
  };
  pipelineEvents.once('pipeline:exit', restore);
}
