/**
 * Main pipeline engine loop.
 *
 * Logic from run.sh lines 549-636:
 * - Load config from workflow.yaml
 * - Derive current state from JSONL
 * - Print banner
 * - Loop through phases, executing steps
 * - Check for PROJECT COMPLETE in reflections
 * - Handle phase limits and maxPhases
 * - Signal handling for clean shutdown
 */
export declare function runEngine(projectDir: string, options?: any): Promise<void>;
//# sourceMappingURL=engine.d.ts.map