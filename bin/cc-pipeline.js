#!/usr/bin/env node
// Register tsx as an in-process ESM loader, then import and run the TypeScript CLI
// directly in this process. This keeps everything single-process so signal handlers
// registered by the engine work correctly (no subprocess forwarding needed).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load tsx's programmatic ESM registration API
const { register } = await import(
  join(__dirname, '../node_modules/tsx/dist/esm/api/index.mjs')
);
register();

// Now TypeScript imports resolve correctly in this process
const { run } = await import('../src/cli.ts');
await run(process.argv.slice(2));
