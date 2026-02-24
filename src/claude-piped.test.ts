import { test, mock } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Unit tests for ClaudePipedAgent (SDK-based implementation)
 * Uses mock.module() to avoid real API calls.
 */

// Helper: build a minimal async generator from an array of events
async function* eventsFrom(events: any[]) {
  for (const e of events) yield e;
}

// Helper: scaffold a temp project with .pipeline/ and a prompt file
function setupTempProject() {
  const projectDir = mkdtempSync(join(tmpdir(), 'cc-piped-test-'));
  mkdirSync(join(projectDir, '.pipeline'), { recursive: true });
  mkdirSync(join(projectDir, 'prompts'), { recursive: true });
  writeFileSync(join(projectDir, 'prompts', 'spec.md'), 'write a spec', 'utf-8');
  return projectDir;
}

function makeContext(projectDir: string) {
  return {
    projectDir,
    config: { project: { name: 'test' }, workflow: { steps: [] } },
    logFile: null,
  };
}

const STEP = { name: 'spec', agent: 'claude-piped' };
const PHASE = 1;
const PROMPT_PATH = 'prompts/spec.md';

const ASSISTANT_EVENT = {
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [{ type: 'text', text: 'Here is the spec.' }],
  },
};

test('ClaudePipedAgent: exitCode 0 on success, writes assistant text to outputPath', async () => {
  if (typeof mock.module !== 'function') {
    return;  // skip if not available
  }

  const projectDir = setupTempProject();

  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: {
      query: (_opts: any) => eventsFrom([ASSISTANT_EVENT]),
    },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const agent = new ClaudePipedAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 0);
  assert.ok(existsSync(result.outputPath!), 'outputPath file should exist');
  const output = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(output.includes('Here is the spec.'), 'output should contain assistant text');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('ClaudePipedAgent: exitCode 1 on thrown error, writes error to outputPath', async () => {
  if (typeof mock.module !== 'function') {
    return;
  }

  const projectDir = setupTempProject();

  async function* throwingQuery() {
    throw new Error('API failure');
    // eslint-disable-next-line no-unreachable
    yield;
  }

  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: { query: throwingQuery },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const agent = new ClaudePipedAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'claude-sonnet-4-5', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 1);
  assert.ok(existsSync(result.outputPath!), 'outputPath file should exist on error');
  const output = readFileSync(result.outputPath!, 'utf-8');
  assert.ok(output.includes('API failure'), 'error message should be written to output');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('ClaudePipedAgent: exitCode 130 when agentState.interrupted before run', async () => {
  if (typeof mock.module !== 'function') {
    return;
  }

  const projectDir = setupTempProject();

  let queryCalled = false;
  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: {
      query: async function* () { queryCalled = true; yield; },
    },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const { agentState } = await import('./agents/base.js');

  agentState.setInterrupted(true);
  const agent = new ClaudePipedAgent();
  const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.strictEqual(result.exitCode, 130, 'should return 130 when interrupted');
  assert.strictEqual(queryCalled, false, 'query should not be called when already interrupted');

  agentState.setInterrupted(false);
  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('ClaudePipedAgent: model not passed when model === "default"', async () => {
  if (typeof mock.module !== 'function') {
    return;
  }

  const projectDir = setupTempProject();

  let capturedOptions: any = null;
  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: {
      query: async function* ({ options }: any) {
        capturedOptions = options;
        yield ASSISTANT_EVENT;
      },
    },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const agent = new ClaudePipedAgent();
  await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));

  assert.ok(capturedOptions, 'options should be captured');
  assert.ok(!('model' in capturedOptions), 'model should NOT be in options when model === "default"');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('ClaudePipedAgent: model passed when model is a real identifier', async () => {
  if (typeof mock.module !== 'function') {
    return;
  }

  const projectDir = setupTempProject();

  let capturedOptions: any = null;
  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: {
      query: async function* ({ options }: any) {
        capturedOptions = options;
        yield ASSISTANT_EVENT;
      },
    },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const agent = new ClaudePipedAgent();
  await agent.run(PHASE, STEP, PROMPT_PATH, 'claude-sonnet-4-5', makeContext(projectDir));

  assert.strictEqual(capturedOptions?.model, 'claude-sonnet-4-5', 'model should be passed through');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});

test('ClaudePipedAgent: createAgent() returns a ClaudePipedAgent instance', async () => {
  const { ClaudePipedAgent, createAgent } = await import('./agents/claude-piped.js');
  const agent = createAgent();
  assert.ok(agent instanceof ClaudePipedAgent, 'createAgent should return a ClaudePipedAgent');
});

test('ClaudePipedAgent: pipelineEvents imported from events.ts (not claude-interactive)', async () => {
  const { readFileSync } = await import('node:fs');
  const { join: pathJoin, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dir = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(pathJoin(__dir, 'agents', 'claude-piped.ts'), 'utf8');
  assert.ok(source.includes("from '../events.js'"), 'claude-piped should import from events.js');
  assert.ok(!source.includes("from './claude-interactive.js'"), 'should not import from claude-interactive');
});

test('ClaudePipedAgent: hooks write tool:start and tool:done to output file', async () => {
  if (typeof mock.module !== 'function') return;

  const projectDir = setupTempProject();

  mock.module('@anthropic-ai/claude-agent-sdk', {
    namedExports: {
      query: async function* ({ options }: any) {
        const hooks = options.hooks;
        // New format: HookCallbackMatcher[] — each element is { hooks: [fn] }
        await hooks.PreToolUse[0].hooks[0]({ tool_name: 'Glob', tool_input: { pattern: '*.ts' } });
        await hooks.PostToolUse[0].hooks[0]({ tool_name: 'Glob', tool_response: { is_error: false } });
        yield {
          type: 'assistant',
          message: { role: 'assistant', content: [{ type: 'text', text: 'done' }] },
        };
      },
    },
  });

  const { ClaudePipedAgent } = await import('./agents/claude-piped.js');
  const agent = new ClaudePipedAgent();
  await agent.run(1, { name: 'spec', agent: 'claude-piped' } as any, 'prompts/spec.md', 'default', makeContext(projectDir));

  const output = readFileSync(join(projectDir, '.pipeline', 'step-output.log'), 'utf-8');
  assert.ok(output.includes('[tool:start] Glob'), 'output should contain tool:start line');
  assert.ok(output.includes('[tool:done]  Glob ✓'), 'output should contain tool:done line');

  mock.restoreAll();
  rmSync(projectDir, { recursive: true, force: true });
});
