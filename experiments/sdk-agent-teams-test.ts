/**
 * SDK Agent Teams Visibility Experiment
 *
 * Questions:
 * 1. Does CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 actually spawn agent teams?
 * 2. What events does the SDK see for teams vs. subagents (Task tool)?
 * 3. Do TeammateIdle / TaskCompleted hooks fire?
 * 4. Can we see teammate activity or just boundaries?
 * 5. What do coordination files look like? (~/.claude/teams/, ~/.claude/tasks/)
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { writeFileSync, readdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROMPT = `You are the team lead. Create a small agent team with TWO teammates to research this topic in parallel:

- Teammate 1: Research what hooks the Claude Agent SDK TypeScript exposes and list them
- Teammate 2: Research how agent team coordination works (inbox, task list, file paths used)

Coordinate through the team system. Wait for both teammates to complete, then summarize their combined findings in 3 bullet points.`;

// ── Storage ──────────────────────────────────────────────────────────────────
const allEvents: unknown[] = [];
const hookLog: unknown[] = [];
const teamEvents: unknown[] = [];
const eventCounts: Record<string, number> = {};
const timestamps: Record<number, string> = {};

function ts() {
  return new Date().toISOString();
}

function classify(msg: Record<string, unknown>): string {
  const type = String(msg.type ?? "unknown");
  const subtype = msg.subtype ? `/${msg.subtype}` : "";
  return `${type}${subtype}`;
}

/** Check if a message has any team-related content */
function isTeamRelated(label: string, msg: Record<string, unknown>): boolean {
  const text = JSON.stringify(msg).toLowerCase();
  return (
    label.includes("task") ||
    label.includes("teammate") ||
    text.includes('"team') ||
    text.includes("teammate") ||
    text.includes("inbox") ||
    text.includes("agent_id") ||
    text.includes("team_name") ||
    (msg.type === "assistant" && text.includes('"teamcreate"')) ||
    (msg.type === "assistant" && text.includes('"sendmessage"'))
  );
}

// ── Hook factory ─────────────────────────────────────────────────────────────
function makeHook(name: string, flagTeam = false) {
  return async (input: Record<string, unknown>) => {
    const entry = { hook: name, timestamp: ts(), input };
    hookLog.push(entry);

    if (
      flagTeam ||
      name.includes("Subagent") ||
      name.includes("Teammate") ||
      name.includes("Task")
    ) {
      teamEvents.push(entry);
      console.log(`\n🎯 [HOOK:${name}] ${JSON.stringify(input, null, 2)}`);
    } else {
      // Log non-team hooks at a quieter level
      const tool = (input as Record<string, unknown>).tool_name;
      if (tool) {
        console.log(`   [hook:${name}] tool=${tool}`);
      }
    }
    return { continue: true };
  };
}

// ── Read coordination files after the run ────────────────────────────────────
function snapshotCoordinationFiles(): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  const teamsDir = join(process.env.HOME!, ".claude", "teams");
  const tasksDir = join(process.env.HOME!, ".claude", "tasks");

  for (const base of [teamsDir, tasksDir]) {
    if (!existsSync(base)) {
      snapshot[base] = "directory does not exist";
      continue;
    }
    try {
      const entries = readdirSync(base, { recursive: true, withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile())
        // sort by name for readability
        .sort((a, b) => a.name.localeCompare(b.name));

      snapshot[base] = files.map((f) => {
        const fullPath = join(String(f.parentPath ?? f.path ?? base), f.name);
        let content: unknown = "(unreadable)";
        try {
          const raw = readFileSync(fullPath, "utf8");
          // Try JSON parse for structured files
          try {
            content = JSON.parse(raw);
          } catch {
            content = raw.length > 2000 ? raw.slice(0, 2000) + "...(truncated)" : raw;
          }
        } catch {
          /* ignore */
        }
        return { path: fullPath, content };
      });
    } catch (e) {
      snapshot[base] = `error reading: ${String(e)}`;
    }
  }
  return snapshot;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== SDK Agent Teams Experiment ===\n");
  console.log(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 enabled`);
  console.log(`Prompt: "${PROMPT.substring(0, 80)}..."\n`);

  // Snapshot coordination dirs BEFORE the run
  const beforeFiles = snapshotCoordinationFiles();

  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k !== "CLAUDECODE")
  ) as Record<string, string>;

  const q = query({
    prompt: PROMPT,
    options: {
      // Enable agent teams feature flag
      env: {
        ...baseEnv,
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1",
      },
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      persistSession: false,
      maxTurns: 200,
      hooks: {
        // Team-specific hooks
        TeammateIdle: [{ hooks: [makeHook("TeammateIdle", true)] }],
        TaskCompleted: [{ hooks: [makeHook("TaskCompleted", true)] }],
        // Subagent hooks (for comparison — do these fire for teams?)
        SubagentStart: [{ hooks: [makeHook("SubagentStart", true)] }],
        SubagentStop: [{ hooks: [makeHook("SubagentStop", true)] }],
        // Tool lifecycle — flag Task, TeamCreate, SendMessage
        PreToolUse: [
          {
            hooks: [
              async (input) => {
                const i = input as Record<string, unknown>;
                const name = String(i.tool_name ?? "");
                const entry = { hook: "PreToolUse", timestamp: ts(), input: i };
                hookLog.push(entry);
                if (
                  ["Task", "TeamCreate", "SendMessage", "TaskCreate", "TaskUpdate"].includes(name)
                ) {
                  teamEvents.push(entry);
                  console.log(`\n🟡 [HOOK:PreToolUse:${name}] ${JSON.stringify(i, null, 2)}`);
                } else {
                  console.log(`   [hook:PreToolUse] tool=${name}`);
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
                const i = input as Record<string, unknown>;
                const name = String(i.tool_name ?? "");
                const entry = { hook: "PostToolUse", timestamp: ts(), input: i };
                hookLog.push(entry);
                if (
                  ["Task", "TeamCreate", "SendMessage", "TaskCreate", "TaskUpdate"].includes(name)
                ) {
                  teamEvents.push(entry);
                  console.log(`\n🟢 [HOOK:PostToolUse:${name}] ${JSON.stringify(i, null, 2)}`);
                }
                return { continue: true };
              },
            ],
          },
        ],
        // Session lifecycle
        SessionStart: [{ hooks: [makeHook("SessionStart")] }],
        Stop: [{ hooks: [makeHook("Stop", true)] }],
        Notification: [{ hooks: [makeHook("Notification")] }],
        // Config / worktree
        ConfigChange: [{ hooks: [makeHook("ConfigChange")] }],
        WorktreeCreate: [{ hooks: [makeHook("WorktreeCreate", true)] }],
        WorktreeRemove: [{ hooks: [makeHook("WorktreeRemove", true)] }],
      },
    },
  });

  let msgIndex = 0;

  for await (const msg of q) {
    const typedMsg = msg as Record<string, unknown>;
    const label = classify(typedMsg);
    const now = ts();

    eventCounts[label] = (eventCounts[label] ?? 0) + 1;
    timestamps[msgIndex] = now;

    const preview = JSON.stringify(typedMsg).substring(0, 150);
    console.log(`[${String(msgIndex).padStart(3, "0")}] ${label}: ${preview}`);

    if (isTeamRelated(label, typedMsg)) {
      teamEvents.push({ index: msgIndex, label, timestamp: now, msg: typedMsg });
    }

    allEvents.push({ index: msgIndex, label, timestamp: now, msg: typedMsg });
    msgIndex++;
  }

  // Snapshot coordination dirs AFTER the run
  const afterFiles = snapshotCoordinationFiles();

  console.log("\n=== Experiment Complete ===\n");
  console.log("Event type counts:");
  for (const [type, count] of Object.entries(eventCounts).sort()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nTotal events: ${allEvents.length}`);
  console.log(`Team-related events: ${teamEvents.length}`);
  console.log(`Hook firings: ${hookLog.length}`);

  // Save full results
  const resultsPath = join(__dirname, "sdk-agent-teams-results.json");
  writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        prompt: PROMPT,
        env: { CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1" },
        totalEvents: allEvents.length,
        eventCounts,
        hookLog,
        teamEvents,
        coordinationFiles: { before: beforeFiles, after: afterFiles },
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
