#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use tsx as a loader (--import) so TypeScript runs in-process, preserving signal handling.
// We resolve tsx from cc-pipeline's own node_modules so this works regardless of caller cwd.
const tsxEsmPath = join(__dirname, '../node_modules/tsx/dist/esm/index.mjs');
const tsxEsmUrl = pathToFileURL(tsxEsmPath).href;

const child = spawn(
  process.execPath,
  ['--import', tsxEsmUrl, join(__dirname, '../src/cli.ts'), ...process.argv.slice(2)],
  { stdio: 'inherit' }
);

// Forward signals to the child process
process.on('SIGINT', () => {
  try { child.kill('SIGINT'); } catch (_) {}
});
process.on('SIGTERM', () => {
  try { child.kill('SIGTERM'); } catch (_) {}
});

child.on('exit', (code, signal) => {
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.exit(code ?? (signal ? 130 : 1));
});
