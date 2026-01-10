/**
 * Types for the LLM Handler.
 * The handler orchestrates LLM interactions, criteria evaluation, and database operations.
 */
import { LLMClient } from '../client/interface';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { Pool } from 'pg';

/**
 * Request to process a user message through the LLM handler.
 */
export interface HandlerRequest {
  /**
   * The user's message content
   */
  userMessage: string;
  
  /**
   * The conversation ID
   */
  conversationId: string;
  
  /**
   * Optional: The job ID (can be derived from conversation if not provided)
   */
  jobId?: string;
}

/**
 * Response from the LLM handler after processing a message.
 */
export interface HandlerResponse {
  /**
   * The assistant's response message to send back to the user
   */
  assistantMessage: string;
  
  /**
   * Whether the conversation is complete (all requirements evaluated)
   */
  isComplete: boolean;
  
  /**
   * Updated conversation context after processing
   */
  context: ConversationContext;
  
  /**
   * Metadata about the processing (e.g., which requirement was evaluated)
   */
  metadata?: {
    requirementType?: string;
    evaluationResult?: string;
    [key: string]: unknown;
  };
}

/**
 * Request to start a new conversation.
 */
export interface StartConversationRequest {
  /**
   * The application ID to start the conversation for
   */
  applicationId: string;
}

/**
 * Response from starting a new conversation.
 */
export interface StartConversationResponse {
  /**
   * The created conversation ID
   */
  conversationId: string;
  
  /**
   * The initial greeting message from the assistant
   */
  greetingMessage: string;
  
  /**
   * The conversation context (START status)
   */
  context: ConversationContext;
}

/**
 * Result of starting a new conversation context.
 * Contains the conversation ID and the START conversation context.
 */
export interface StartConversationContextResult {
  /**
   * The created conversation ID
   */
  conversationId: string;
  
  /**
   * The conversation context with START status
   */
  context: ConversationContext;
}

/**
 * Configuration for the LLM handler.
 */
export interface HandlerConfig {
  /**
   * The LLM client to use for API calls
   */
  llmClient: LLMClient;
  
  /**
   * Database connection pool (for loading/storing conversation data)
   */
  dbPool: Pool;
  
  /**
   * Optional: Whether to use streaming responses
   */
  useStreaming?: boolean;
}

