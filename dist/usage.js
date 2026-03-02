/**
 * Usage tracking utilities for cc-pipeline.
 *
 * Computes session_percentage and weekly_percentage from:
 * - Accumulated total_cost_usd returned by SDK query() calls (session)
 * - Claude Code project JSONL files in ~/.claude/projects/ (weekly)
 *
 * Percentages are relative to configurable budget thresholds in workflow.yaml:
 *   usage_limits:
 *     session_budget_usd: 5        # cost budget per pipeline run (default $5)
 *     weekly_budget_usd: 25        # cost budget per week (default $25)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
// Claude Max approximate pricing (USD per 1M tokens)
// Used to convert token counts from session history files to cost.
// These are rough estimates for Sonnet/Opus blend; actual cost may vary.
const COST_PER_1M_INPUT_TOKENS = 3.0; // Sonnet input
const COST_PER_1M_OUTPUT_TOKENS = 15.0; // Sonnet output
const COST_PER_1M_CACHE_READ = 0.3; // Sonnet cache read
const COST_PER_1M_CACHE_WRITE = 3.75; // Sonnet cache creation
/**
 * Compute approximate cost (USD) from token counts.
 */
function tokensToCost(inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens) {
    return ((inputTokens / 1_000_000) * COST_PER_1M_INPUT_TOKENS +
        (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS +
        (cacheReadTokens / 1_000_000) * COST_PER_1M_CACHE_READ +
        (cacheCreationTokens / 1_000_000) * COST_PER_1M_CACHE_WRITE);
}
/**
 * Read all ~/.claude/projects/**\/\*.jsonl files modified in the past 7 days
 * and sum token usage to compute approximate weekly cost.
 */
export function getWeeklyCostUSD() {
    const projectsDir = resolve(homedir(), '.claude', 'projects');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let totalCost = 0;
    let projectDirs;
    try {
        projectDirs = readdirSync(projectsDir);
    }
    catch {
        return 0; // ~/.claude/projects doesn't exist
    }
    for (const projectDir of projectDirs) {
        const fullProjectDir = join(projectsDir, projectDir);
        let files;
        try {
            files = readdirSync(fullProjectDir).filter((f) => f.endsWith('.jsonl'));
        }
        catch {
            continue;
        }
        for (const file of files) {
            const filePath = join(fullProjectDir, file);
            try {
                const stat = statSync(filePath);
                if (stat.mtimeMs < sevenDaysAgo)
                    continue; // skip old files
                const content = readFileSync(filePath, 'utf-8');
                for (const line of content.split('\n')) {
                    if (!line.trim())
                        continue;
                    let obj;
                    try {
                        obj = JSON.parse(line);
                    }
                    catch {
                        continue;
                    }
                    // Each assistant message in the JSONL has a usage block
                    if (obj.type === 'assistant' && obj.message?.usage) {
                        const u = obj.message.usage;
                        totalCost += tokensToCost(u.input_tokens ?? 0, u.output_tokens ?? 0, u.cache_read_input_tokens ?? 0, u.cache_creation_input_tokens ?? 0);
                    }
                }
            }
            catch {
                // Skip files we can't read
            }
        }
    }
    return totalCost;
}
/**
 * Compute session_percentage and weekly_percentage for the pipeline JSONL.
 *
 * @param sessionCostUSD - Accumulated cost from all SDK query() calls this run
 * @param usageLimits - Config: { sessionBudgetUSD, weeklyBudgetUSD }
 */
export function computeUsagePercentages(sessionCostUSD, usageLimits) {
    const weeklyCostUSD = getWeeklyCostUSD();
    const session_percentage = parseFloat(((sessionCostUSD / usageLimits.sessionBudgetUSD) * 100).toFixed(1));
    const weekly_percentage = parseFloat(((weeklyCostUSD / usageLimits.weeklyBudgetUSD) * 100).toFixed(1));
    return { session_percentage, weekly_percentage };
}
//# sourceMappingURL=usage.js.map