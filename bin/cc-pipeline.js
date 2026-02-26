#!/usr/bin/env node
// tsx v4+ requires --import, not the loader hooks API.
// Spawn node with --import tsx/esm, resolving tsx relative to this package
// so it works regardless of npm hoisting.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const tsxEsm = pathToFileURL(require.resolve('tsx/esm')).href;
const cli = join(__dirname, '../src/cli.ts');

const child = spawn(
  process.execPath,
  ['--import', tsxEsm, cli, ...process.argv.slice(2)],
  { stdio: 'inherit' }
);

// SIGINT is broadcast to the whole process group on Ctrl-C, but SIGTERM is not.
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
