import { EventEmitter } from 'node:events';

export interface StepStartEvent   { phase: number; step: string; agent: string }
export interface StepDoneEvent    { phase: number; step: string; agent: string; exitCode: number }
export interface PhaseStartEvent  { phase: number }
export interface PhaseDoneEvent   { phase: number }
export interface ToolStartEvent   { phase: number; step: string; tool: string; input: unknown }
export interface ToolDoneEvent    { phase: number; step: string; tool: string; success: boolean }
export interface SubagentStartEvent { phase: number; step: string; agentId: string }
export interface SubagentDoneEvent  { phase: number; step: string; agentId: string; output?: string }
export interface SessionStopEvent   { phase: number; step: string; reason: string }

class TypedEventEmitter extends EventEmitter {}

export const pipelineEvents = new TypedEventEmitter();
