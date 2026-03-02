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
/**
 * Read all ~/.claude/projects/**\/\*.jsonl files modified in the past 7 days
 * and sum token usage to compute approximate weekly cost.
 */
export declare function getWeeklyCostUSD(): number;
/**
 * Compute session_percentage and weekly_percentage for the pipeline JSONL.
 *
 * @param sessionCostUSD - Accumulated cost from all SDK query() calls this run
 * @param usageLimits - Config: { sessionBudgetUSD, weeklyBudgetUSD }
 */
export declare function computeUsagePercentages(sessionCostUSD: number, usageLimits: {
    sessionBudgetUSD: number;
    weeklyBudgetUSD: number;
}): {
    session_percentage: number;
    weekly_percentage: number;
};
//# sourceMappingURL=usage.d.ts.map