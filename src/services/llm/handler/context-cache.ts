/**
 * Context cache layer for storing conversation context.
 * This allows us to cache the context when a conversation starts
 * and retrieve it efficiently during conversation processing.
 */

import { ConversationContext } from '../processor/prompts/prompt-context';

/**
 * In-memory cache for conversation contexts.
 * Key: conversationId
 * Value: ConversationContext
 * 
 * TODO: Consider using Redis or database for persistent caching in production
 * to support multi-instance deployments and cache persistence across restarts.
 */
const contextCache = new Map<string, ConversationContext>();

/**
 * Stores a conversation context in the cache.
 * 
 * @param conversationId - The conversation ID to use as the cache key
 * @param context - The conversation context to cache
 */
export const cacheContext = (conversationId: string, context: ConversationContext): void => {
  contextCache.set(conversationId, context);
};

/**
 * Retrieves a conversation context from the cache.
 * 
 * @param conversationId - The conversation ID to look up
 * @returns The cached context if found, or null if not in cache
 */
export const getCachedContext = (conversationId: string): ConversationContext | null => {
  return contextCache.get(conversationId) || null;
};

/**
 * Checks if a context exists in the cache for a given conversation.
 * 
 * @param conversationId - The conversation ID to check
 * @returns True if context exists in cache, false otherwise
 */
export const hasCachedContext = (conversationId: string): boolean => {
  return contextCache.has(conversationId);
};

/**
 * Removes a conversation context from the cache.
 * 
 * @param conversationId - The conversation ID to remove from cache
 */
export const clearCachedContext = (conversationId: string): void => {
  contextCache.delete(conversationId);
};

/**
 * Clears all cached contexts.
 * Useful for testing or reset scenarios.
 */
export const clearAllCachedContexts = (): void => {
  contextCache.clear();
};

