import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

/**
 * Ink TUI component for cc-pipeline.
 * Displays current phase/step, recent tool calls, and status.
 *
 * @param {{ events: import('node:events').EventEmitter }} props
 */
export function App({ events }) {
  const { exit } = useApp();
  const [tools, setTools] = useState([]);
  const [status, setStatus] = useState('running');
  const [phase, setPhase] = useState('');
  const [step, setStep] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onToolStart = (d) => {
      setPhase(String(d.phase));
      setStep(d.step);
      setTools(prev => [...prev.slice(-11), { kind: 'start', tool: d.tool, ts: Date.now() }]);
    };
    const onToolDone = (d) => {
      setTools(prev => [...prev.slice(-11), { kind: 'done', tool: d.tool, success: d.success, ts: Date.now() }]);
    };
    const onStop = (d) => {
      setStatus(d.reason === 'end_turn' ? 'done' : 'error');
      setTimeout(exit, 500);
    };

    events.on('tool:start', onToolStart);
    events.on('tool:done', onToolDone);
    events.on('session:stop', onStop);

    return () => {
      events.off('tool:start', onToolStart);
      events.off('tool:done', onToolDone);
      events.off('session:stop', onStop);
    };
  }, []);

  const statusColor = { running: 'blue', done: 'green', error: 'red' }[status];
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return React.createElement(
    Box, { flexDirection: 'column', padding: 1 },
    React.createElement(
      Box, { marginBottom: 1 },
      React.createElement(Text, { bold: true }, 'cc-pipeline '),
      React.createElement(Text, { color: 'cyan' }, `phase ${phase} · ${step} `),
      React.createElement(Text, { dimColor: true }, `${mins}:${secs}`)
    ),
    React.createElement(
      Box, { flexDirection: 'column', marginBottom: 1 },
      ...tools.map((t, i) =>
        React.createElement(
          Text, { key: i, dimColor: t.kind === 'start' },
          t.kind === 'start' ? `  → ${t.tool}` : `  ${t.success ? '✓' : '✗'} ${t.tool}`
        )
      )
    ),
    React.createElement(Text, { color: statusColor }, `● ${status}`)
  );
}
