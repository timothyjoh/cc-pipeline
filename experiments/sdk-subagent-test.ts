/**
 * SDK Sub-Agent Visibility Experiment
 *
 * Question: When Claude Code spawns sub-agents via the Task tool,
 * does the TypeScript Agent SDK see events FOR those sub-agents,
 * or only for the parent?
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROMPT = `You are a research coordinator. Use sub-agents (Task tool) to research these two questions IN PARALLEL:
1. What TypeScript version does the @anthropic-ai/claude-agent-sdk require?
2. What hooks does the Claude Agent SDK TypeScript expose?

Spawn two separate sub-agents, one per question, wait for both, then summarize their findings.`;

const allEvents: unknown[] = [];
const eventCounts: Record<string, number> = {};
const subagentEvents: unknown[] = [];

function classify(msg: Record<string, unknown>): string {
  const type = String(msg.type ?? "unknown");
  const subtype = msg.subtype ? `/${msg.subtype}` : "";
  return `${type}${subtype}`;
}

function flagInteresting(msg: Record<string, unknown>, label: string) {
  const isSubagentRelated =
    label.includes("task_started") ||
    label.includes("task_notification") ||
    label.includes("tool_progress") ||
    (msg.type === "assistant" &&
      JSON.stringify(msg).includes('"name":"Task"')) ||
    (msg.type === "system" && String(msg.subtype ?? "").includes("task"));

  if (isSubagentRelated) {
    subagentEvents.push({ label, msg });
  }
}

async function main() {
  console.log("=== SDK Sub-Agent Visibility Experiment ===\n");
  console.log(`Prompt: "${PROMPT.substring(0, 80)}..."\n`);

  // Register hooks to capture SubagentStart / SubagentStop
  const hookLog: unknown[] = [];

  const q = query({
    prompt: PROMPT,
    options: {
      allowedTools: ["Task", "Bash", "Read", "Grep", "Glob", "WebFetch", "WebSearch"],
      persistSession: false,
      // Unset CLAUDECODE so the SDK subprocess isn't blocked by the nested-session check
      env: Object.fromEntries(
        Object.entries(process.env).filter(([k]) => k !== "CLAUDECODE")
      ) as Record<string, string>,
      hooks: {
        SubagentStart: [
          {
            hooks: [
              async (input) => {
                const entry = { hook: "SubagentStart", input };
                hookLog.push(entry);
                subagentEvents.push({ label: "hook:SubagentStart", msg: input });
                console.log(
                  `\n🔵 [HOOK] SubagentStart: ${JSON.stringify(input, null, 2)}`
                );
                return { continue: true };
              },
            ],
          },
        ],
        SubagentStop: [
          {
            hooks: [
              async (input) => {
                const entry = { hook: "SubagentStop", input };
                hookLog.push(entry);
                subagentEvents.push({ label: "hook:SubagentStop", msg: input });
                console.log(
                  `\n🔴 [HOOK] SubagentStop: ${JSON.stringify(input, null, 2)}`
                );
                return { continue: true };
              },
            ],
          },
        ],
        PreToolUse: [
          {
            hooks: [
              async (input) => {
                const entry = { hook: "PreToolUse", input };
                hookLog.push(entry);
                const toolName = (input as Record<string, unknown>).tool_name;
                if (toolName === "Task") {
                  subagentEvents.push({ label: "hook:PreToolUse:Task", msg: input });
                  console.log(
                    `\n🟡 [HOOK] PreToolUse Task: ${JSON.stringify(input, null, 2)}`
                  );
                }
                return { continue: true };
              },
            ],
          },
        ],
        PostToolUse: [
          {
            hooks: [
              async (input) => {
                const entry = { hook: "PostToolUse", input };
                hookLog.push(entry);
                const toolName = (input as Record<string, unknown>).tool_name;
                if (toolName === "Task") {
                  subagentEvents.push({ label: "hook:PostToolUse:Task", msg: input });
                  console.log(
                    `\n🟢 [HOOK] PostToolUse Task: ${JSON.stringify(input, null, 2)}`
                  );
                }
                return { continue: true };
              },
            ],
          },
        ],
        Stop: [
          {
            hooks: [
              async (input) => {
                console.log(`\n⏹️  [HOOK] Stop: ${JSON.stringify(input, null, 2)}`);
                hookLog.push({ hook: "Stop", input });
                return { continue: true };
              },
            ],
          },
        ],
      },
    },
  });

  let msgIndex = 0;

  for await (const msg of q) {
    const typedMsg = msg as Record<string, unknown>;
    const label = classify(typedMsg);

    // Track counts
    eventCounts[label] = (eventCounts[label] ?? 0) + 1;

    // Log to console
    const preview = JSON.stringify(typedMsg).substring(0, 120);
    console.log(`[${String(msgIndex).padStart(3, "0")}] ${label}: ${preview}`);

    // Flag interesting events
    flagInteresting(typedMsg, label);

    // Store full event
    allEvents.push({ index: msgIndex, label, msg: typedMsg });
    msgIndex++;
  }

  console.log("\n=== Experiment Complete ===\n");
  console.log("Event type counts:");
  for (const [type, count] of Object.entries(eventCounts).sort()) {
    console.log(`  ${type}: ${count}`);
  }

  console.log(`\nTotal events: ${allEvents.length}`);
  console.log(`Subagent-related events: ${subagentEvents.length}`);
  console.log(`Hook firings: ${hookLog.length}`);

  // Save raw results
  const resultsPath = join(__dirname, "sdk-subagent-results.json");
  writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        prompt: PROMPT,
        totalEvents: allEvents.length,
        eventCounts,
        hookLog,
        subagentEvents,
        allEvents,
      },
      null,
      2
    )
  );
  console.log(`\nRaw results saved to: ${resultsPath}`);
}

main().catch((err) => {
  console.error("Experiment failed:", err);
  process.exit(1);
});
