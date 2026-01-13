import { ChatMessage, ResponseValidationResult, StreamOptions } from '../../types';
import { OpenAIClientConfig } from './openai-client';
import OpenAI from 'openai';

/**
 * Validates that messages array is not empty.
 * 
 * @param messages - Array of chat messages to validate
 * @returns Validation result indicating if messages array is valid
 */
export const validateMessages = (messages: ChatMessage[]): ResponseValidationResult => {
  if (!messages || messages.length === 0) {
    return {
      isValid: false,
      error: 'Messages array cannot be empty. At least one message is required.',
    };
  }
  
  return { isValid: true };
};

/**
 * Validates that a message has required fields.
 * 
 * @param message - Chat message to validate
 * @param index - Index of the message in the array (for error context)
 * @returns Validation result indicating if message is valid
 */
export const validateMessage = (message: ChatMessage, index: number): ResponseValidationResult => {
  if (!message) {
    return {
      isValid: false,
      error: `Message at index ${index} is null or undefined.`,
    };
  }
  
  if (!message.role) {
    return {
      isValid: false,
      error: `Message at index ${index} is missing required field 'role'.`,
    };
  }
  
  if (typeof message.content !== 'string') {
    return {
      isValid: false,
      error: `Message at index ${index} has invalid 'content' field. Expected string, got ${typeof message.content}.`,
    };
  }
  
  return { isValid: true };
};

/**
 * Validates stream options are provided and callbacks are functions.
 * 
 * @param options - Streaming options to validate
 * @returns Validation result indicating if stream options are valid
 */
export const validateStreamOptions = (options: StreamOptions): ResponseValidationResult => {
  if (!options) {
    return {
      isValid: false,
      error: 'StreamOptions cannot be null or undefined.',
    };
  }
  
  if (typeof options.onChunk !== 'function') {
    return {
      isValid: false,
      error: 'StreamOptions.onChunk must be a function.',
    };
  }
  
  return { isValid: true };
};

/**
 * Validates OpenAI client configuration.
 * 
 * @param config - OpenAI client configuration to validate
 * @returns Validation result indicating if configuration is valid
 */
export const validateConfig = (config: OpenAIClientConfig): ResponseValidationResult => {
  if (!config) {
    return {
      isValid: false,
      error: 'OpenAIClientConfig cannot be null or undefined.',
    };
  }
  
  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
    return {
      isValid: false,
      error: 'OpenAIClientConfig.apiKey is required and must be a non-empty string.',
    };
  }
  
  if (!config.model || typeof config.model !== 'string' || config.model.trim() === '') {
    return {
      isValid: false,
      error: 'OpenAIClientConfig.model is required and must be a non-empty string.',
    };
  }
  
  return { isValid: true };
};

/**
 * Validates OpenAI API response structure.
 * 
 * Returns a result object instead of throwing, allowing the handler
 * to decide how to proceed with invalid responses.
 * 
 * @param response - OpenAI API response to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validateResponse = (
  response: OpenAI.Chat.Completions.ChatCompletion
): ResponseValidationResult => {
  if (!response) {
    return {
      isValid: false,
      error: 'OpenAI API returned null or undefined response. This indicates a critical API failure.',
    };
  }
  
  if (!response.choices || response.choices.length === 0) {
    return {
      isValid: false,
      error: 'OpenAI API response contains no choices. The model may have failed to generate a response, or the request was invalid.',
    };
  }
  
  if (!response.model) {
    return {
      isValid: false,
      error: 'OpenAI API response is missing model information. Response structure may be invalid.',
    };
  }
  
  return { isValid: true };
};
