/**
 * Completion handler module.
 * 
 * Functional handler for sending completion messages when conversation is DONE.
 */

export { sendCompletionMessage, type CompletionHandlerDependencies } from './completion.handler';

// Export functional modules (processors/builders)
export { buildDoneContext } from './context-builder';
export { processCompletionMessage } from './completion-processor';
export { truncateScreeningSummary } from './summary-truncator';

export type { ContextBuilderDependencies, ContextBuilderResult } from './context-builder';
export type { CompletionProcessorDependencies, CompletionProcessorResult } from './completion-processor';
export type { SummaryTruncatorDependencies, SummaryTruncatorResult } from './summary-truncator';
