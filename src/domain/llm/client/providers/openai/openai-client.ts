import { LLMClient } from '../../interface';
import { ChatMessage, LLMResponse, MessageRole, ResponseValidationResult, StreamOptions } from '../../types';
import OpenAI from 'openai';
import {
  buildOpenAIClient,
  buildNonStreamingRequest,
  buildStreamingRequest,
  buildMetadata,
} from './builder';
import {
  validateMessages,
  validateMessage,
  validateStreamOptions,
  validateConfig,
  validateResponse,
} from './validation';

/**
 * Configuration for OpenAI client.
 */
export interface OpenAIClientConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}


/**
 * Converts ChatMessage to OpenAI SDK message format.
 * 
 * @param message - Chat message to convert
 * @returns OpenAI-compatible message format
 * @throws Error if message is invalid
 */
const toOpenAIMessage = (message: ChatMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
  if (!message || !message.role || typeof message.content !== 'string') {
    throw new Error(`Invalid message format. Expected { role: MessageRole, content: string }, got: ${JSON.stringify(message)}`);
  }

  switch (message.role) {
    case MessageRole.SYSTEM:
      return { role: 'system', content: message.content };
    case MessageRole.USER:
      return { role: 'user', content: message.content };
    case MessageRole.ASSISTANT:
      return { role: 'assistant', content: message.content };
    default:
      // Fallback to user role for unknown roles
      console.warn(`Unknown message role: ${message.role}. Defaulting to 'user' role.`);
      return { role: 'user', content: message.content };
  }
};

/**
 * Extracts content from OpenAI response choices.
 * 
 * Empty content can occur for several reasons:
 * - No choices in response - API structure issue or request failure
 * - Content was filtered (content_filter) - policy violation
 * - Hit max tokens (length) - response was truncated
 * - Normal stop with empty response - model chose not to respond (ambiguous input)
 * 
 * We return empty string and let the handler decide how to proceed.
 * 
 * @param response - OpenAI API response
 * @returns Extracted content string (may be empty)
 */
const extractContent = (response: OpenAI.Chat.Completions.ChatCompletion): string => {
  // Handle case where response has no choices (structure issue)
  if (!response.choices || response.choices.length === 0) {
    console.warn(
      'OpenAI API response contains no choices. ' +
      'This may indicate a request failure or invalid response structure.'
    );
    return '';
  }
  
  const firstChoice = response.choices[0];
  const content = firstChoice?.message?.content;
  const finishReason = firstChoice?.finish_reason;
  
  // Return empty string if no content (handler can decide what to do)
  if (!content) {
    // Log warning for debugging, but don't throw
    // The handler/processor can decide if empty response needs follow-up
    console.warn(
      `OpenAI API returned empty content. ` +
      `Finish reason: ${finishReason || 'unknown'}. ` +
      `This may indicate filtered content, max tokens reached, or ambiguous input.`
    );
    return '';
  }
  
  return content;
};

/**
 * Converts OpenAI API response to LLMResponse format.
 * 
 * Handles invalid responses gracefully by returning empty content
 * with error information in metadata, allowing the handler to decide
 * how to proceed.
 * 
 * @param content - Response content text (may be empty)
 * @param response - Full OpenAI API response
 * @returns Formatted LLMResponse object (may have empty content if response is invalid)
 */
const toLLMResponse = (
  content: string,
  response: OpenAI.Chat.Completions.ChatCompletion
): LLMResponse => {
  const validation = validateResponse(response);
  
  // If response structure is invalid, return empty response with error info
  if (!validation.isValid) {
    console.error(`Invalid OpenAI response: ${validation.error}`);
    return {
      content: '',
      model: response?.model || 'unknown',
      metadata: {
        error: validation.error,
        responseId: response?.id,
      },
    };
  }
  
  return {
    content,
    model: response.model,
    metadata: buildMetadata(response),
  };
};

/**
 * Checks if a chunk indicates the stream is finished.
 */

/**
 * Generator function that yields content chunks from OpenAI streaming response.
 */
async function* streamChunkGenerator(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  const isChunkFinished = (chunk: OpenAI.Chat.Completions.ChatCompletionChunk): boolean => !!chunk.choices[0]?.finish_reason;
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
    if (isChunkFinished(chunk)) return;
  }
}


/**
 * Processes streaming chunks from OpenAI API and calls appropriate callbacks.
 * Handles errors gracefully and ensures cleanup.
 * 
 * @param stream - Async iterable stream of chat completion chunks
 * @param options - Streaming options with callbacks
 * @throws Error if options are invalid
 */
const processStreamChunks = async (
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  options: StreamOptions
): Promise<void> => {
  const validation = validateStreamOptions(options);
  if (!validation.isValid) {
    options.onError?.(new Error(validation.error || 'Invalid stream options'));
    return;
  }
  
  let hasCompleted = false;
  
  try {
    for await (const content of streamChunkGenerator(stream)) {
      // Ensure onChunk is called safely
      try {
        options.onChunk(content);
      } catch (chunkError) {
        // If onChunk throws, notify via onError but continue processing
        options.onError?.(new Error(`Error in onChunk callback: ${String(chunkError)}`));
        return;
      }
    }
    
    // Only call onComplete if we haven't already completed
    if (!hasCompleted) {
      hasCompleted = true;
      options.onComplete?.();
    }
  } catch (error) {
    // Ensure onError is called if stream processing fails
    if (!hasCompleted) {
      hasCompleted = true;
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
};

/**
 * Creates an OpenAI client using functional closures.
 * 
 * The returned client maintains state (API client and model) in closure scope,
 * providing a clean functional interface while encapsulating configuration.
 * 
 * @param config - Configuration for the OpenAI client
 * @returns LLMClient implementation with closure-based methods
 * @throws Error if configuration is invalid
 * 
 * @example
 * ```typescript
 * const client = createOpenAIClient({
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4',
 * });
 * 
 * const response = await client.sendMessage([
 *   { role: MessageRole.USER, content: 'Hello!' }
 * ]);
 * ```
 */
export const createOpenAIClient = (config: OpenAIClientConfig): LLMClient => {
  const configValidation = validateConfig(config);
  if (!configValidation.isValid) {
    throw new Error(configValidation.error || 'Invalid OpenAI client configuration');
  }
  
  const client = buildOpenAIClient(config);
  const model = config.model;

  /**
   * Sends a non-streaming message to OpenAI and returns the complete response.
   * 
   * Use this method when you need the full response before proceeding,
   * such as for parsing structured data or validation.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @returns Promise resolving to the complete LLM response
   * @throws Error if messages are invalid or API call fails
   * 
   * @example
   * ```typescript
   * const response = await sendMessage([
   *   { role: MessageRole.SYSTEM, content: 'You are a helpful assistant.' },
   *   { role: MessageRole.USER, content: 'What is 2+2?' }
   * ]);
   * console.log(response.content); // "4"
   * ```
   */
  const sendMessage = async (messages: ChatMessage[]): Promise<LLMResponse> => {
    try {
      // Validate input
      const messagesValidation = validateMessages(messages);
      if (!messagesValidation.isValid) {
        throw new Error(messagesValidation.error || 'Invalid messages');
      }
      
      // Validate each message
      const messageValidations = messages.map((msg, index) => validateMessage(msg, index));
      if (!messageValidations.every((validation) => validation.isValid)) {
        const error = new Error(messageValidations.find((validation) => !validation.isValid)?.error || 'Invalid messages');
        throw error;
      }
      // Convert and build request
      const openAIMessages = messages.map((msg) => toOpenAIMessage(msg));
      const request = buildNonStreamingRequest(model, openAIMessages);
      // Make API call
      const response = await client.chat.completions.create(request);
      
      // Extract and validate content
      const content = extractContent(response);
      
      // Transform to our response format
      return toLLMResponse(content, response);
    } catch (error) {
      // Provide context in error message
      if (error instanceof Error) {
        throw new Error(`Failed to send message to OpenAI: ${error.message}`);
      }
      throw new Error(`Failed to send message to OpenAI: ${String(error)}`);
    }
  };

  /**
   * Sends a streaming message to OpenAI and processes chunks via callbacks.
   * 
   * Use this method for real-time chat interfaces where you want to
   * display responses as they're generated.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @param options - Streaming options with callbacks for chunks, completion, and errors
   * @returns Promise that resolves when streaming completes
   * @throws Error if messages or options are invalid
   * 
   * @example
   * ```typescript
   * await streamMessage(
   *   [{ role: MessageRole.USER, content: 'Tell me a story' }],
   *   {
   *     onChunk: (chunk) => console.log(chunk), // Called for each chunk
   *     onComplete: () => console.log('Done!'),
   *     onError: (error) => console.error(error)
   *   }
   * );
   * ```
   */
  const streamMessage = async (
    messages: ChatMessage[],
    options: StreamOptions
  ): Promise<void> => {
    try {
      // Validate inputs
      const messagesValidation = validateMessages(messages);
      if (!messagesValidation.isValid) {
        const error = new Error(messagesValidation.error || 'Invalid messages');
        options.onError?.(error);
        return;
      }
      
      // Validate each message
      const messageValidations = messages.map((msg, index) => validateMessage(msg, index));
      if (!messageValidations.every((validation) => validation.isValid)) {
        const error = new Error(messageValidations.find((validation) => !validation.isValid)?.error || 'Invalid messages');
        options.onError?.(error);
        return;
      }
      
      // Convert and build request
      const openAIMessages = messages.map((msg) => toOpenAIMessage(msg));
      const request = buildStreamingRequest(model, openAIMessages);
      console.log(`[OpenAIClient] Request: ${JSON.stringify(request)}`);
      // Create stream
      const stream = await client.chat.completions.create(request);
      
      // Process stream with callbacks
      await processStreamChunks(stream, options);
    } catch (error) {
      // Ensure error callback is called if API call fails
      if (options?.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        // Re-throw if no error handler provided
        throw new Error(`Failed to stream message to OpenAI: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return { model, sendMessage, streamMessage };
};
