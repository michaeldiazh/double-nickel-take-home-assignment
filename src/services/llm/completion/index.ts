/**
 * Completion Handler module.
 * 
 * Handles final completion messages when conversation is DONE.
 */

export { CompletionHandler } from './handler';

// Export functional modules
export { buildDoneContext } from './context-builder';
export { processCompletionMessage } from './completion-processor';
export { truncateScreeningSummary } from './summary-truncator';

export type { ContextBuilderDependencies, ContextBuilderResult } from './context-builder';
export type { CompletionProcessorDependencies, CompletionProcessorResult } from './completion-processor';
export type { SummaryTruncatorDependencies, SummaryTruncatorResult } from './summary-truncator';