import { LLMClientConfig } from '../../types';
import { createOpenAIClient, OpenAIClientConfig } from './openai-client';

/**
 * Builds OpenAI client configuration from generic LLM client config.
 * 
 * @param config - Generic LLM client configuration
 * @returns OpenAI-specific client configuration
 */
export const buildOpenAIConfig = (config: LLMClientConfig): OpenAIClientConfig => ({
  apiKey: config.apiKey,
  model: config.model,
  baseUrl: config.baseUrl,
});

/**
 * Creates an OpenAI client from generic LLM client configuration.
 * 
 * @param config - Generic LLM client configuration
 * @returns OpenAI client instance
 */
export const createOpenAIClientFromConfig = (config: LLMClientConfig) => {
  return createOpenAIClient(buildOpenAIConfig(config));
};

// Re-export main client creation function and types
export { createOpenAIClient, OpenAIClientConfig } from './openai-client';
