/**
 * Types for the LLM Processor.
 * The processor orchestrates prompt building and LLM interactions.
 */

import { LLMClient } from '../client';
import { ChatMessage, LLMResponse, StreamOptions } from '../client/types';
import { ConversationContext } from './prompts';

/**
 * Request to process a message through the LLM processor.
 */
export interface ProcessorRequest {
  /**
   * The user's message content
   */
  userMessage: string;
  
  /**
   * The conversation context (history, requirements, current requirement)
   */
  context: ConversationContext;
  
  /**
   * Whether this is the initial message in the conversation
   */
  isInitialMessage?: boolean;
  
  /**
   * Streaming options for real-time response delivery.
   * If provided, messages will be streamed to the client.
   */
  streamOptions?: StreamOptions;
}

/**
 * Response from the LLM processor after processing a message.
 */
export interface ProcessorResponse {
  /**
   * The assistant's response message from the LLM
   */
  assistantMessage: string;
  
  /**
   * The complete list of messages that were sent to the LLM
   * (includes system prompt, context, and conversation history)
   */
  messages: ChatMessage[];
  
  /**
   * The raw LLM response metadata
   */
  llmResponse: LLMResponse;
}

/**
 * Configuration for the LLM processor.
 */
export interface ProcessorConfig {
  /**
   * The LLM client to use for API calls
   */
  llmClient: LLMClient;
}

