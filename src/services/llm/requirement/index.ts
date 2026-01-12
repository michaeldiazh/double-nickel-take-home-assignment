/**
 * Requirement handler module.
 * 
 * Handles processing user responses during ON_REQ status:
 * - Parses LLM responses to extract requirement values
 * - Evaluates requirements against criteria
 * - Updates conversation_job_requirement status
 * - Handles status transitions (next requirement, all met, not met)
 */

export { RequirementHandler } from './handler';

// Export functional modules
export { receiveRequirementMessage, isValidRequirementStatus } from './message-receiver';
export { processRequirementWithLLM } from './llm-processor';
export { evaluateRequirementCriteria } from './evaluator';
export { routeRequirementState } from './state-router';

export type { MessageReceiverDependencies, MessageReceiverResult } from './message-receiver';
export type { LLMProcessorDependencies, LLMProcessorResult } from './llm-processor';
export type { EvaluatorDependencies, EvaluatorResult } from './evaluator';
export type { StateRouterDependencies, StateRouterResult } from './state-router';
