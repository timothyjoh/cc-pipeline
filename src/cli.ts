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
  --ui            Launch Ink TUI (default: auto-detect TTY)
  --no-ui         Force plain output (for CI/pipes)

Examples:
  npx cc-pipeline init
  npx cc-pipeline update
  npx cc-pipeline run --phases 3
  npx cc-pipeline run --ui
  npx cc-pipeline run --no-ui
  npx cc-pipeline status
  npx cc-pipeline reset
`.trim();

export async function run(args: string[]) {
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
    case 'run': {
      const useTUI = options.ui ?? (options.noUi ? false : process.stdout.isTTY);
      if (useTUI) {
        const { launchTUI } = await import('./tui/index.js');
        launchTUI(process.cwd());
      }
      await runPipeline(process.cwd(), options);
      break;
    }
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

export function parseOptions(args: string[]): Record<string, any> {
  const opts: Record<string, any> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phases' && args[i + 1]) {
      opts.phases = parseInt(args[++i], 10);
    } else if (args[i] === '--model' && args[i + 1]) {
      opts.model = args[++i];
    } else if (args[i] === '--ui') {
      opts.ui = true;
    } else if (args[i] === '--no-ui') {
      opts.noUi = true;
    }
  }
  return opts;
}

// Bootstrap: auto-invoke when run as a script
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  run(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
