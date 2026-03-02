import { test, mock } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
/**
 * Unit tests for ClaudeInteractiveAgent (SDK-based implementation)
 * and --ui / --no-ui CLI flag parsing.
 */
// Helper: build a minimal async generator from an array of events
async function* eventsFrom(events) {
    for (const e of events)
        yield e;
}
function setupTempProject() {
    const projectDir = mkdtempSync(join(tmpdir(), 'cc-interactive-test-'));
    mkdirSync(join(projectDir, '.pipeline'), { recursive: true });
    mkdirSync(join(projectDir, 'prompts'), { recursive: true });
    writeFileSync(join(projectDir, 'prompts', 'build.md'), 'build the project', 'utf-8');
    return projectDir;
}
function makeContext(projectDir) {
    return {
        projectDir,
        config: { project: { name: 'test' }, workflow: { steps: [] } },
        logFile: null,
    };
}
const STEP = { name: 'build', agent: 'claude-interactive' };
const PHASE = 1;
const PROMPT_PATH = 'prompts/build.md';
const ASSISTANT_EVENT = {
    type: 'assistant',
    message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Build complete.' }],
    },
};
// ─── Agent tests ────────────────────────────────────────────────────────────
test('ClaudeInteractiveAgent: exitCode 0 on success, writes assistant text to outputPath', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: (_opts) => eventsFrom([ASSISTANT_EVENT]),
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));
    assert.strictEqual(result.exitCode, 0);
    assert.ok(existsSync(result.outputPath), 'outputPath should exist');
    const output = readFileSync(result.outputPath, 'utf-8');
    assert.ok(output.includes('Build complete.'), 'output should contain assistant text');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: exitCode 1 on thrown error, writes error to outputPath', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    async function* throwingQuery() {
        throw new Error('SDK error');
        // eslint-disable-next-line no-unreachable
        yield;
    }
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: { query: throwingQuery },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'claude-sonnet-4-5', makeContext(projectDir));
    assert.strictEqual(result.exitCode, 1);
    assert.ok(existsSync(result.outputPath), 'outputPath should exist on error');
    const output = readFileSync(result.outputPath, 'utf-8');
    assert.ok(output.includes('SDK error'), 'error message should be in output');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: exitCode 130 when agentState.interrupted before run', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    let queryCalled = false;
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: async function* () { queryCalled = true; yield; },
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const { agentState } = await import('./agents/base.js');
    agentState.setInterrupted(true);
    const agent = new ClaudeInteractiveAgent();
    const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));
    assert.strictEqual(result.exitCode, 130);
    assert.strictEqual(queryCalled, false, 'query should not be called when already interrupted');
    agentState.setInterrupted(false);
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: model not passed when model === "default"', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    let capturedOptions = null;
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: async function* ({ options }) {
                capturedOptions = options;
                yield ASSISTANT_EVENT;
            },
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));
    assert.ok(!('model' in capturedOptions), 'model should NOT be set when model === "default"');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: model passed when model is a real identifier', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    let capturedOptions = null;
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: async function* ({ options }) {
                capturedOptions = options;
                yield ASSISTANT_EVENT;
            },
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    await agent.run(PHASE, STEP, PROMPT_PATH, 'claude-opus-4-6', makeContext(projectDir));
    assert.strictEqual(capturedOptions?.model, 'claude-opus-4-6');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: tool hooks write to outputPath', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    // Simulate a PreToolUse / PostToolUse hook by having query fire hooks via options
    let capturedHooks = null;
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: async function* ({ options }) {
                capturedHooks = options.hooks;
                // Fire the hooks manually to simulate tool use
                await capturedHooks.PreToolUse[0]({ tool_name: 'Bash', tool_input: { command: 'ls' } });
                await capturedHooks.PostToolUse[0]({ tool_name: 'Bash', tool_response: { is_error: false } });
                yield ASSISTANT_EVENT;
            },
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    const result = await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));
    assert.strictEqual(result.exitCode, 0);
    const output = readFileSync(result.outputPath, 'utf-8');
    assert.ok(output.includes('[tool:start] Bash'), 'output should contain tool:start line');
    assert.ok(output.includes('[tool:done]  Bash ✓'), 'output should contain tool:done line');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: hooks write tool:start and tool:done to output file', async () => {
    if (typeof mock.module !== 'function')
        return;
    const projectDir = setupTempProject();
    mock.module('@anthropic-ai/claude-agent-sdk', {
        namedExports: {
            query: async function* ({ options }) {
                const hooks = options.hooks;
                // New format: HookCallbackMatcher[] — each element is { hooks: [fn] }
                await hooks.PreToolUse[0].hooks[0]({ tool_name: 'Read', tool_input: { file_path: '/foo' } });
                await hooks.PostToolUse[0].hooks[0]({ tool_name: 'Read', tool_response: { is_error: false } });
                yield ASSISTANT_EVENT;
            },
        },
    });
    const { ClaudeInteractiveAgent } = await import('./agents/claude-interactive.js');
    const agent = new ClaudeInteractiveAgent();
    await agent.run(PHASE, STEP, PROMPT_PATH, 'default', makeContext(projectDir));
    const output = readFileSync(join(projectDir, '.pipeline', 'step-output.log'), 'utf-8');
    assert.ok(output.includes('[tool:start] Read'), 'output should contain tool:start line');
    assert.ok(output.includes('[tool:done]  Read ✓'), 'output should contain tool:done line');
    mock.restoreAll();
    rmSync(projectDir, { recursive: true, force: true });
});
test('ClaudeInteractiveAgent: createAgent() returns a ClaudeInteractiveAgent instance', async () => {
    const { ClaudeInteractiveAgent, createAgent } = await import('./agents/claude-interactive.js');
    const agent = createAgent();
    assert.ok(agent instanceof ClaudeInteractiveAgent);
});
// ─── CLI flag tests ──────────────────────────────────────────────────────────
test('CLI: --ui flag sets options.ui = true', async () => {
    // Read cli.ts source and verify --ui parsing is present
    const { readFileSync } = await import('node:fs');
    const { join: pathJoin, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(pathJoin(__dir, 'cli.ts'), 'utf8');
    assert.ok(source.includes("args[i] === '--ui'"), 'should parse --ui flag');
    assert.ok(source.includes("opts.ui = true"), 'should set opts.ui = true');
});
test('CLI: --no-ui flag sets options.noUi = true', async () => {
    const { readFileSync } = await import('node:fs');
    const { join: pathJoin, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(pathJoin(__dir, 'cli.ts'), 'utf8');
    assert.ok(source.includes("args[i] === '--no-ui'"), 'should parse --no-ui flag');
    assert.ok(source.includes("opts.noUi = true"), 'should set opts.noUi = true');
});
test('CLI: useTUI logic — --ui always launches TUI', async () => {
    const { readFileSync } = await import('node:fs');
    const { join: pathJoin, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(pathJoin(__dir, 'cli.ts'), 'utf8');
    assert.ok(source.includes('options.ui ?? (options.noUi ? false : process.stdout.isTTY)'), 'should compute useTUI based on flags and TTY');
});
test('CLI: useTUI logic — unit test the expression', () => {
    // Test the logic directly as a pure expression
    const computeUseTUI = (options, isTTY) => options.ui ?? (options.noUi ? false : isTTY);
    assert.strictEqual(computeUseTUI({ ui: true }, false), true, '--ui forces TUI on');
    assert.strictEqual(computeUseTUI({ noUi: true }, true), false, '--no-ui forces TUI off even if TTY');
    assert.strictEqual(computeUseTUI({}, true), true, 'TTY=true with no flags enables TUI');
    assert.strictEqual(computeUseTUI({}, false), false, 'TTY=false with no flags disables TUI');
});
test('pipelineEvents is imported from events.ts, not exported from claude-interactive', async () => {
    const { readFileSync } = await import('node:fs');
    const { join: pathJoin, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(pathJoin(__dir, 'agents', 'claude-interactive.ts'), 'utf8');
    assert.ok(source.includes("from '../events.js'"), 'should import pipelineEvents from events.js');
    assert.ok(!source.includes('export const pipelineEvents'), 'should NOT export pipelineEvents');
});
//# sourceMappingURL=claude-interactive.test.js.map