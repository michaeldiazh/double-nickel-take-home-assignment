/**
 * LLM Handler module exports.
 * 
 * The handler orchestrates the complete flow:
 * 1. Receives user messages
 * 2. Loads conversation context
 * 3. Builds prompts using LLM Processor
 * 4. Sends to LLM Client
 * 5. Parses LLM responses
 * 6. Evaluates using Criteria Handlers
 * 7. Stores results in database
 * 8. Returns response
 */

export type { HandlerRequest, HandlerResponse, HandlerConfig, StartConversationContextResult } from './types';
export { parseLLMResponse } from '../../criteria/parser';
export type { ParseResult } from '../../criteria/parser';

// Context cache exports
export {
  cacheContext,
  getCachedContext,
  hasCachedContext,
  clearCachedContext,
  clearAllCachedContexts,
} from './context-cache';

// Context loader exports
export {
  startNewConversationContext,
} from './context-loader';

