import { LLMClient } from './interface';
import { LLMClientConfig } from './types';
import { createOpenAIClient, OpenAIClientConfig } from './providers/openai/openai-client';

/**
 * Supported LLM provider types.
 */
export enum LLMProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

/**
 * Configuration for creating an LLM client.
 */
export interface CreateLLMClientConfig extends LLMClientConfig {
  /**
   * The LLM provider to use.
   */
  provider: LLMProvider;
}

/**
 * Factory function to create an LLM client based on provider type.
 * 
 * @param config - Configuration including provider type and API credentials
 * @returns An LLM client instance implementing the LLMClient interface
 * @throws Error if provider is not supported or configuration is invalid
 */
export const createLLMClient = (config: CreateLLMClientConfig): LLMClient => {
  switch (config.provider) {
    case LLMProvider.OPENAI:
      const openAIConfig: OpenAIClientConfig = {
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      };
      return createOpenAIClient(openAIConfig);
      
    case LLMProvider.GEMINI:
      // TODO: Import and return Gemini client when implemented
      throw new Error('Gemini client not yet implemented');
      
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
};

