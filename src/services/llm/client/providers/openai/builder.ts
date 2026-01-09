import { LLMResponse } from '../../types';
import { OpenAIClientConfig } from './openai-client';
import OpenAI from 'openai';

/**
 * Builds usage metadata from OpenAI usage object.
 * 
 * @param usage - OpenAI usage object from API response
 * @returns Formatted usage metadata or undefined if usage is not available
 */
export const buildUsageMetadata = (
  usage: OpenAI.Completions.CompletionUsage | null | undefined
): { promptTokens: number; completionTokens: number; totalTokens: number } | undefined => {
  if (!usage) {
    return undefined;
  }
  
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
};

/**
 * Builds metadata object from OpenAI response.
 * 
 * @param response - OpenAI chat completion response
 * @returns Formatted metadata object with usage and response ID
 */
export const buildMetadata = (response: OpenAI.Chat.Completions.ChatCompletion): LLMResponse['metadata'] => {
  if (!response) {
    throw new Error('Cannot build metadata from null or undefined response.');
  }
  
  return {
    usage: buildUsageMetadata(response.usage),
    responseId: response.id,
  };
};

/**
 * Builds an OpenAI SDK client instance.
 * 
 * @param config - OpenAI client configuration
 * @returns Configured OpenAI SDK client instance
 * @throws Error if configuration is invalid
 */
export const buildOpenAIClient = (config: OpenAIClientConfig): OpenAI => {
  if (!config) {
    throw new Error('Cannot build OpenAI client: config is null or undefined.');
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });
};

/**
 * Validates that messages array is not empty.
 */
const validateMessagesArray = (messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): void => {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array cannot be empty. At least one message is required for chat completion.');
  }
};

/**
 * Builds a non-streaming chat completion request configuration.
 * 
 * @param model - Model name to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
 * @param messages - Array of chat messages in OpenAI format
 * @returns Non-streaming chat completion request parameters
 * @throws Error if model or messages are invalid
 */
export const buildNonStreamingRequest = (
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming => {
  if (!model || typeof model !== 'string' || model.trim() === '') {
    throw new Error('Model name is required and must be a non-empty string.');
  }
  
  validateMessagesArray(messages);
  
  return {
    model,
    messages,
    stream: false,
  };
};

/**
 * Builds a streaming chat completion request configuration.
 * 
 * @param model - Model name to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
 * @param messages - Array of chat messages in OpenAI format
 * @returns Streaming chat completion request parameters
 * @throws Error if model or messages are invalid
 */
export const buildStreamingRequest = (
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming => {
  if (!model || typeof model !== 'string' || model.trim() === '') {
    throw new Error('Model name is required and must be a non-empty string.');
  }
  
  validateMessagesArray(messages);
  
  return {
    model,
    messages,
    stream: true,
  };
};

