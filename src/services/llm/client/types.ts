/**
 * Chat message role types for LLM conversations.
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * A single message in a conversation.
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Options for streaming responses.
 */
export interface StreamOptions {
  /**
   * Callback function called for each chunk of the streamed response.
   * @param chunk - A chunk of text from the LLM response
   */
  onChunk: (chunk: string) => void;
  
  /**
   * Optional callback called when streaming completes.
   */
  onComplete?: () => void;
  
  /**
   * Optional callback called if streaming encounters an error.
   */
  onError?: (error: Error) => void;
}

/**
 * Complete response from LLM (non-streaming).
 */
export interface LLMResponse {
  /**
   * The complete response text from the LLM.
   */
  content: string;
  
  /**
   * Model name used for this response.
   */
  model: string;
  
  /**
   * Optional metadata about the response (tokens used, etc.).
   */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for LLM client initialization.
 */
export interface LLMClientConfig {
  /**
   * API key for the LLM provider.
   */
  apiKey: string;
  
  /**
   * Model name to use (e.g., 'gpt-4', 'gemini-pro').
   */
  model: string;
  
  /**
   * Optional base URL for the API (for custom endpoints).
   */
  baseUrl?: string;
  
  /**
   * Optional additional configuration specific to the provider.
   */
  [key: string]: unknown;
}

