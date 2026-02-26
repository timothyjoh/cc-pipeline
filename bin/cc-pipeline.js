#!/usr/bin/env node
// Register tsx as an in-process ESM loader, then import and run the TypeScript CLI
// directly in this process. This keeps everything single-process so signal handlers
// registered by the engine work correctly (no subprocess forwarding needed).
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// tsx/esm is the public loader API (works across tsx versions and npm hoisting)
register('tsx/esm', pathToFileURL('./'));

// Now TypeScript imports resolve correctly in this process
const { run } = await import('../src/cli.ts');
await run(process.argv.slice(2));
