import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { init } from './commands/init.js';
import { runPipeline } from './commands/run.js';
import { status } from './commands/status.js';
import { reset } from './commands/reset.js';
import { update } from './commands/update.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const HELP = `
cc-pipeline — Autonomous Claude Code pipeline engine

Usage:
  cc-pipeline init              Scaffold .pipeline/ and BRIEF.md.example
  cc-pipeline update            Update prompts and docs (preserves workflow.yaml)
  cc-pipeline run [options]     Run the pipeline
  cc-pipeline status            Show current pipeline state
  cc-pipeline reset             Clear event log, phase outputs, and STATUS.md

Run options:
  --phases <n>    Number of phases to run (default: unlimited)
  --model <name>  Override model for this run

Examples:
  npx cc-pipeline init
  npx cc-pipeline update
  npx cc-pipeline run --phases 3
  npx cc-pipeline status
  npx cc-pipeline reset
`.trim();

export async function run(args) {
  const command = args[0];

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(`cc-pipeline v${PKG.version}`);
    process.exit(0);
  }

  if (!command || command === '--help' || command === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  const options = parseOptions(args.slice(1));

  switch (command) {
    case 'init':
      await init(process.cwd(), options);
      break;
    case 'run':
      await runPipeline(process.cwd(), options);
      break;
    case 'status':
      status(process.cwd());
      break;
    case 'reset':
      reset(process.cwd());
      break;
    case 'update':
      await update(process.cwd());
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

function parseOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phases' && args[i + 1]) {
      opts.phases = parseInt(args[++i], 10);
    } else if (args[i] === '--model' && args[i + 1]) {
      opts.model = args[++i];
    }
  }
  return opts;
}
