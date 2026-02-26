#!/usr/bin/env node
// Register tsx as an in-process ESM loader, then import and run the TypeScript CLI
// directly in this process. This keeps everything single-process so signal handlers
// registered by the engine work correctly (no subprocess forwarding needed).
// Load tsx's programmatic ESM registration API
// Use createRequire to resolve tsx relative to this package (handles hoisted deps)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tsxApiPath = require.resolve('tsx/dist/esm/api/index.mjs');
const { register } = await import(tsxApiPath);
register();

// Now TypeScript imports resolve correctly in this process
const { run } = await import('../src/cli.ts');
await run(process.argv.slice(2));
