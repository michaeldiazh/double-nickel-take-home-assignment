import { ChatMessage, LLMResponse, StreamOptions } from './types';

/**
 * Interface for LLM client implementations.
 * 
 * This interface defines the contract for communicating with LLM providers
 * (OpenAI, Gemini, etc.). Implementations should handle provider-specific
 * details while maintaining this common interface.
 */
export interface LLMClient {
  /**
   * Sends a non-streaming message to the LLM and returns the complete response.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @returns Promise resolving to the complete LLM response
   * @throws Error if the request fails
   */
  sendMessage(messages: ChatMessage[]): Promise<LLMResponse>;

  /**
   * Sends a streaming message to the LLM.
   * Calls the onChunk callback for each chunk received.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @param options - Streaming options including callbacks
   * @returns Promise that resolves when streaming completes
   * @throws Error if the request fails
   */
  streamMessage(
    messages: ChatMessage[],
    options: StreamOptions
  ): Promise<void>;
}

