/**
 * LLM Handler module exports.
 * 
 * The handler orchestrates the complete flow for LLM conversations:
 * - Starting new conversations with initial greeting
 * - Processing user messages in existing conversations
 * - Loading conversation context (cache-first)
 * - Building prompts using LLM Processor
 * - Sending to LLM Client
 * - Parsing LLM responses (when status is ON_REQ)
 * - Evaluating using Criteria Handlers
 * - Storing results in database
 * - Managing conversation context cache
 * 
 * Usage:
 * ```ts
 * const handler = createHandler({ llmClient, dbPool });
 * const startResponse = await handler.startConversation({ applicationId });
 * const messageResponse = await handler.handleMessage({ userMessage, conversationId });
 * ```
 */

export type { 
  HandlerRequest, 
  HandlerResponse, 
  HandlerConfig, 
  StartConversationContextResult,
  StartConversationRequest,
  StartConversationResponse,
} from './types';
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

// Loader exports
export {
  loadFullContextFromConversationId,
} from './loaders';

// Handler exports
export {
  createHandler,
  type Handler,
} from './handler';

