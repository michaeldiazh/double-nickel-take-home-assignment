/**
 * Conversation Context Service module.
 * 
 * Handles loading full conversation context with requirements, messages, and job facts.
 * Combines data from multiple repositories to build the ConversationContext used by the LLM processor.
 */

export { ConversationContextService } from './service';
// Re-export ConversationContext from prompts where it's actually defined
export type { ConversationContext } from '../prompts/builders/types';
