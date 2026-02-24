import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { EventEmitter } from 'node:events';

interface ToolEntry {
  kind: 'start' | 'done';
  tool: string;
  success?: boolean;
  ts: number;
}

interface AppProps {
  events: EventEmitter;
  projectDir: string;
}

function loadStepNames(projectDir: string): string[] {
  try {
    const workflowPath = join(projectDir, '.pipeline', 'workflow.yaml');
    if (!existsSync(workflowPath)) return [];
    const raw = YAML.parse(readFileSync(workflowPath, 'utf-8'));
    if (Array.isArray(raw?.steps)) {
      return raw.steps.map((s: any) => s.name as string);
    }
  } catch (_) {}
  return [];
}

export function App({ events, projectDir }: AppProps) {
  const { exit } = useApp();
  const [stepNames] = useState(() => loadStepNames(projectDir));
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState('');
  const [currentPhase, setCurrentPhase] = useState('');
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running');
  const [elapsed, setElapsed] = useState(0);
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onStepStart = (d: any) => {
      setCurrentPhase(String(d.phase));
      setCurrentStep(d.step);
    };
    const onStepDone = (d: any) => {
      setCompletedSteps(prev => new Set([...prev, d.step]));
    };
    const onToolStart = (d: any) => {
      setTools(prev => [...prev.slice(-7), { kind: 'start', tool: d.tool, ts: Date.now() }]);
    };
    const onToolDone = (d: any) => {
      setTools(prev => [...prev.slice(-7), { kind: 'done', tool: d.tool, success: d.success, ts: Date.now() }]);
    };
    const onStop = (d: any) => {
      setStatus(d.reason === 'end_turn' ? 'done' : 'error');
      setTimeout(exit, 500);
    };

    events.on('step:start', onStepStart);
    events.on('step:done', onStepDone);
    events.on('tool:start', onToolStart);
    events.on('tool:done', onToolDone);
    events.on('session:stop', onStop);

    return () => {
      events.off('step:start', onStepStart);
      events.off('step:done', onStepDone);
      events.off('tool:start', onToolStart);
      events.off('tool:done', onToolDone);
      events.off('session:stop', onStop);
    };
  }, []);

  const statusColor = status === 'running' ? 'blue' : status === 'done' ? 'green' : 'red';
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return React.createElement(
    Box, { flexDirection: 'column', padding: 1 },

    // Header
    React.createElement(
      Box, { marginBottom: 1 },
      React.createElement(Text, { bold: true }, 'cc-pipeline '),
      React.createElement(Text, { color: 'cyan' }, `phase ${currentPhase} · ${currentStep} `),
      React.createElement(Text, { dimColor: true }, `${mins}:${secs}`)
    ),

    // Step list
    React.createElement(
      Box, { flexDirection: 'column', marginBottom: 1 },
      ...stepNames.map((name, i) => {
        const isDone = completedSteps.has(name);
        const isCurrent = currentStep === name;
        const prefix = isDone ? '✓ ' : isCurrent ? '▶ ' : '  ';
        return React.createElement(
          Text,
          { key: i, color: isCurrent ? 'cyan' : undefined, bold: isCurrent, dimColor: !isCurrent },
          prefix + name
        );
      })
    ),

    // Tool log
    React.createElement(
      Box, { flexDirection: 'column', marginBottom: 1 },
      ...tools.map((t, i) =>
        React.createElement(
          Text, { key: i, dimColor: t.kind === 'start' },
          t.kind === 'start' ? `  → ${t.tool}` : `  ${t.success ? '✓' : '✗'} ${t.tool}`
        )
      )
    ),

    // Status bar
    React.createElement(Text, { color: statusColor }, `● ${status}`)
  );
}
