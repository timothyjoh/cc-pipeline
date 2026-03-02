import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp } from 'ink';
import { openSync, readSync, closeSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
function loadWorkflowMeta(projectDir) {
    try {
        const workflowPath = join(projectDir, '.pipeline', 'workflow.yaml');
        if (!existsSync(workflowPath))
            return { steps: [], phasesDir: 'docs/phases' };
        const raw = YAML.parse(readFileSync(workflowPath, 'utf-8'));
        const steps = Array.isArray(raw?.steps)
            ? raw.steps.map((s) => ({ name: s.name, description: (s.description || '') }))
            : [];
        return { steps, phasesDir: raw?.phases_dir || 'docs/phases' };
    }
    catch (_) { }
    return { steps: [], phasesDir: 'docs/phases' };
}
function loadPhaseDescription(projectDir, phasesDir, phase) {
    if (!phase)
        return '';
    try {
        const specPath = join(projectDir, phasesDir, `phase-${phase}`, 'SPEC.md');
        if (!existsSync(specPath))
            return '';
        const content = readFileSync(specPath, 'utf-8');
        const match = content.match(/^#{1,2}\s+(.+)/m);
        return match ? match[1].trim() : '';
    }
    catch (_) { }
    return '';
}
function extractDetail(tool, input, projectDir) {
    if (!input || typeof input !== 'object')
        return '';
    const inp = input;
    const rel = (p) => p.startsWith(projectDir)
        ? p.slice(projectDir.length).replace(/^\//, '')
        : p;
    switch (tool) {
        case 'Read':
        case 'Write':
        case 'Edit':
            return rel(String(inp.file_path ?? inp.notebook_path ?? ''));
        case 'Bash':
            return String(inp.command ?? '').replace(/\n/g, ' ').slice(0, 80);
        case 'Glob':
            return String(inp.pattern ?? '');
        case 'Grep':
            return String(inp.pattern ?? '') + (inp.path ? `  ${rel(String(inp.path))}` : '');
        case 'WebFetch':
            return String(inp.url ?? '').slice(0, 60);
        case 'WebSearch':
            return String(inp.query ?? '');
        case 'Task':
            return String(inp.description ?? '');
        default:
            return '';
    }
}
let nextId = 0;
export function App({ events, projectDir }) {
    const { exit } = useApp();
    const [{ steps: stepInfo, phasesDir }] = useState(() => loadWorkflowMeta(projectDir));
    const stepNames = stepInfo.map(s => s.name);
    const stepDescriptions = new Map(stepInfo.map(s => [s.name, s.description]));
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [currentStep, setCurrentStep] = useState('');
    const [currentAgent, setCurrentAgent] = useState('');
    const [currentModel, setCurrentModel] = useState('');
    const [currentPhase, setCurrentPhase] = useState('');
    const [phaseDescription, setPhaseDescription] = useState('');
    const [log, setLog] = useState([]);
    const [textLines, setTextLines] = useState([]);
    const [status, setStatus] = useState('running');
    const [elapsed, setElapsed] = useState(0);
    const [stepElapsed, setStepElapsed] = useState(0);
    const startTime = useState(() => Date.now())[0];
    const stepStartRef = useRef(0);
    const fileOffsetRef = useRef(0);
    const outputPathRef = useRef('');
    useEffect(() => {
        const tick = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
            if (stepStartRef.current > 0) {
                setStepElapsed(Math.floor((Date.now() - stepStartRef.current) / 1000));
            }
        }, 1000);
        return () => clearInterval(tick);
    }, []);
    // Reload phase description whenever the phase changes or spec step completes
    useEffect(() => {
        setPhaseDescription(loadPhaseDescription(projectDir, phasesDir, currentPhase));
    }, [currentPhase]);
    // Poll the per-step log file for real-time activity from agents.
    // Hooks inside the Agent SDK query() run in a worker context and can't emit
    // to this process's EventEmitter, so we use file-based IPC instead.
    useEffect(() => {
        const poll = () => {
            try {
                const outputPath = outputPathRef.current;
                if (!outputPath || !existsSync(outputPath))
                    return;
                const stat = statSync(outputPath);
                if (stat.size === fileOffsetRef.current)
                    return;
                // Read only new bytes — avoids loading the whole file each tick
                const toRead = Math.min(stat.size - fileOffsetRef.current, 65536);
                const buf = Buffer.alloc(toRead);
                const fd = openSync(outputPath, 'r');
                const bytesRead = readSync(fd, buf, 0, toRead, fileOffsetRef.current);
                closeSync(fd);
                fileOffsetRef.current += bytesRead;
                const newContent = buf.slice(0, bytesRead).toString('utf-8');
                if (!newContent)
                    return;
                const lines = newContent.split('\n').map(l => l.trim()).filter(Boolean);
                setLog(prev => {
                    let updated = [...prev];
                    const newTextLines = [];
                    for (const line of lines) {
                        // Resolve initial "starting..." on first real activity
                        if (updated.length > 0 && updated[0].detail === 'starting...') {
                            const isSubagent = line.startsWith('[subagent:start]');
                            updated[0] = { ...updated[0], pending: false, success: true, detail: isSubagent ? 'spawning team...' : 'running' };
                        }
                        if (line.startsWith('[tool:start]')) {
                            const m = line.match(/^\[tool:start\] (\S+) (.*)/s);
                            if (m) {
                                const tool = m[1];
                                let input = {};
                                try {
                                    input = JSON.parse(m[2]);
                                }
                                catch (_) { }
                                const detail = extractDetail(tool, input, projectDir);
                                updated = [...updated.slice(-29), { id: nextId++, kind: 'tool', tool, detail, pending: true }];
                            }
                        }
                        else if (line.startsWith('[tool:done]')) {
                            const m = line.match(/^\[tool:done\]\s+(\S+)\s+([✓✗])/);
                            if (m) {
                                const tool = m[1];
                                const success = m[2] === '✓';
                                const idx = [...updated].reverse().findIndex(e => e.kind === 'tool' && e.tool === tool && e.pending);
                                if (idx !== -1) {
                                    const realIdx = updated.length - 1 - idx;
                                    updated = [...updated];
                                    updated[realIdx] = { ...updated[realIdx], pending: false, success };
                                }
                            }
                        }
                        else if (line.startsWith('[subagent:start]')) {
                            updated = [...updated.slice(-29), { id: nextId++, kind: 'subagent', tool: 'agent', detail: '', pending: true }];
                        }
                        else if (line.startsWith('[subagent:done]')) {
                            const idx = [...updated].reverse().findIndex(e => e.kind === 'subagent' && e.pending);
                            if (idx !== -1) {
                                const realIdx = updated.length - 1 - idx;
                                updated = [...updated];
                                updated[realIdx] = { ...updated[realIdx], pending: false, success: true };
                            }
                        }
                        else if (line.startsWith('[text] ')) {
                            newTextLines.push({ id: nextId++, text: line.slice(7) });
                        }
                        else {
                            // Raw stdout (bash/codex) — strip ANSI escape codes before display
                            const clean = line.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').trim();
                            if (clean)
                                newTextLines.push({ id: nextId++, text: clean });
                        }
                    }
                    if (newTextLines.length > 0) {
                        setTextLines(prev => [...prev, ...newTextLines].slice(-30));
                    }
                    return updated;
                });
            }
            catch (_) { }
        };
        const timer = setInterval(poll, 200);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        const onStepStart = (d) => {
            setCurrentPhase(String(d.phase));
            setCurrentStep(d.step);
            setCurrentAgent(d.agent ?? '');
            setCurrentModel(d.model ?? '');
            setTextLines([]);
            outputPathRef.current = join(projectDir, '.pipeline', 'logs', `phase-${d.phase}`, `step-${d.step}.log`);
            fileOffsetRef.current = 0;
            stepStartRef.current = Date.now();
            setStepElapsed(0);
            // Only claudecode has hook integrations that feed the structured log.
            // Other AI agents (codex) and bash stream plain stdout to textLines instead.
            const initialLog = d.agent === 'claudecode'
                ? [{ id: nextId++, kind: 'subagent', tool: 'agent', detail: 'starting...', pending: true }]
                : [];
            setLog(initialLog);
        };
        const onStepDone = (d) => {
            setCompletedSteps(prev => new Set([...prev, d.step]));
            if (d.step === 'spec') {
                setPhaseDescription(loadPhaseDescription(projectDir, phasesDir, String(d.phase)));
            }
        };
        const onStop = (d) => {
            // Only flag an error state — do not exit. The pipeline may have more phases.
            if (d.reason && d.reason !== 'end_turn')
                setStatus('error');
        };
        const onPipelineExit = () => {
            setStatus(prev => prev === 'error' ? 'error' : 'done');
            setTimeout(exit, 500);
        };
        const onLog = (d) => {
            setTextLines(prev => [...prev, { id: nextId++, text: d.message }].slice(-30));
        };
        events.on('step:start', onStepStart);
        events.on('step:done', onStepDone);
        events.on('session:stop', onStop);
        events.on('pipeline:exit', onPipelineExit);
        events.on('pipeline:log', onLog);
        return () => {
            events.off('step:start', onStepStart);
            events.off('step:done', onStepDone);
            events.off('session:stop', onStop);
            events.off('pipeline:exit', onPipelineExit);
            events.off('pipeline:log', onLog);
        };
    }, []);
    const statusColor = status === 'running' ? 'blue' : status === 'done' ? 'green' : 'red';
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const stepDescription = currentStep ? stepDescriptions.get(currentStep) ?? '' : '';
    return React.createElement(Box, { flexDirection: 'column', padding: 1 }, 
    // Header
    React.createElement(Box, { flexDirection: 'column', marginBottom: 1 }, React.createElement(Box, {}, React.createElement(Text, { bold: true }, 'cc-pipeline '), React.createElement(Text, { color: 'cyan' }, `phase ${currentPhase} · ${currentStep} `), React.createElement(Text, { dimColor: true }, fmt(stepElapsed)), React.createElement(Text, { dimColor: true }, `  total ${fmt(elapsed)}`)), phaseDescription
        ? React.createElement(Text, { dimColor: true }, phaseDescription)
        : null), 
    // Two-column body
    React.createElement(Box, { flexDirection: 'row' }, 
    // Left: step list
    React.createElement(Box, { flexDirection: 'column', marginRight: 3, minWidth: 14 }, ...stepNames.map((name, i) => {
        const isDone = completedSteps.has(name);
        const isCurrent = currentStep === name;
        const prefix = isDone ? '✓ ' : isCurrent ? '▶ ' : '  ';
        const agentLabel = isCurrent && currentAgent
            ? ` - ${currentAgent} (${!currentModel || currentModel === 'default' ? 'default' : currentModel})`
            : '';
        return React.createElement(Text, { key: i, color: isCurrent ? 'green' : undefined, bold: isCurrent, dimColor: !isCurrent && !isDone }, prefix + name + agentLabel);
    })), 
    // Right: step description header + activity log
    React.createElement(Box, { flexDirection: 'column', flexGrow: 1 }, 
    // Step description header
    stepDescription
        ? React.createElement(Box, { marginBottom: 1 }, React.createElement(Text, { bold: true, color: 'white' }, stepDescription))
        : null, 
    // Activity: tool/subagent log for interactive steps, text stream for piped steps
    ...(log.length === 0 && textLines.length === 0 && currentStep
        ? [React.createElement(Text, { key: 'pulse', dimColor: true }, 'processing' + '.'.repeat((elapsed % 4) + 1))]
        : log.length > 0
            ? log.slice(-7).map(entry => {
                const icon = entry.pending ? '·' : entry.success ? '✓' : '✗';
                const iconColor = entry.pending ? undefined : entry.success ? 'green' : 'red';
                if (entry.kind === 'subagent') {
                    return React.createElement(Box, { key: entry.id }, React.createElement(Text, { color: iconColor, dimColor: entry.pending }, icon + ' '), React.createElement(Text, { color: 'yellow', dimColor: entry.pending }, 'agent      '), React.createElement(Text, { dimColor: true }, entry.detail));
                }
                const toolLabel = entry.tool.padEnd(10);
                return React.createElement(Box, { key: entry.id }, React.createElement(Text, { color: iconColor, dimColor: entry.pending }, icon + ' '), React.createElement(Text, { dimColor: true }, toolLabel + ' '), React.createElement(Text, { color: 'cyan' }, entry.detail));
            })
            : textLines.slice(-7).map(line => React.createElement(Text, { key: line.id, dimColor: true, wrap: 'truncate' }, line.text))))), 
    // Status bar
    React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { color: statusColor }, `● ${status}`)));
}
//# sourceMappingURL=App.js.map