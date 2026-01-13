/**
 * Requirement handler module.
 * 
 * Functional handler for processing user responses during requirement questions.
 */

export { handleRequirementResponse, type RequirementHandlerDependencies } from './requirement.handler';

// Export functional modules (processors/evaluators)
export { receiveRequirementMessage, isValidRequirementStatus } from './message-receiver';
export { processRequirementWithLLM } from './llm-processor';
export { evaluateRequirementCriteria } from './evaluator';
export { routeRequirementState } from './state-router';

export type { MessageReceiverDependencies, MessageReceiverResult } from './message-receiver';
export type { LLMProcessorDependencies, LLMProcessorResult } from './llm-processor';
export type { EvaluatorDependencies, EvaluatorResult } from './evaluator';
export type { StateRouterDependencies, StateRouterResult } from './state-router';
