/**
 * Conversation Context Service Types
 * 
 * Note: ConversationContext type is defined in domain/prompts/builders/types.ts
 * This file exists for backward compatibility and service exports only.
 */

// Re-export ConversationContext from prompts where it's actually defined
export type { ConversationContext } from '../prompts/builders/types';
