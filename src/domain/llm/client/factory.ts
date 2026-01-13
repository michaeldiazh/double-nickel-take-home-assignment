import { LLMClient } from './interface';
import { LLMClientConfig } from './types';
import { createOpenAIClientFromConfig } from './providers/openai';

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
      return createOpenAIClientFromConfig(config);
      
    case LLMProvider.GEMINI:
      // TODO: Import and return Gemini client when implemented
      throw new Error('Gemini client not yet implemented');
      
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
};
