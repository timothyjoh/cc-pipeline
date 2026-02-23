import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { pipelineEvents } from '../agents/claude-interactive.js';

/**
 * Launch the Ink TUI, subscribing to pipelineEvents.
 * Call this before starting the pipeline run.
 */
export function launchTUI() {
  render(React.createElement(App, { events: pipelineEvents }));
}
