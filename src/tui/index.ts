import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { pipelineEvents } from '../events.js';

export function launchTUI(projectDir: string): void {
  render(React.createElement(App, { events: pipelineEvents, projectDir }));
}
