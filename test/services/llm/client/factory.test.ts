import { createLLMClient, LLMProvider } from '../../../../src/services/llm/client/factory';
import { MessageRole } from '../../../../src/services/llm/client/types';

// Mock the OpenAI provider
jest.mock('../../../../src/services/llm/client/providers/openai', () => ({
  createOpenAIClientFromConfig: jest.fn(() => ({
    sendMessage: jest.fn(),
    streamMessage: jest.fn(),
  })),
}));

describe('LLM Client Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLLMClient', () => {
    it('should create OpenAI client for OPENAI provider', () => {
      const config = {
        provider: LLMProvider.OPENAI,
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };

      const client = createLLMClient(config);
      expect(client).toBeDefined();
      expect(client.sendMessage).toBeDefined();
      expect(client.streamMessage).toBeDefined();
    });

    it('should throw error for GEMINI provider (not implemented)', () => {
      const config = {
        provider: LLMProvider.GEMINI,
        apiKey: 'gemini-key',
        model: 'gemini-pro',
      };

      expect(() => createLLMClient(config)).toThrow('Gemini client not yet implemented');
    });

    it('should throw error for unsupported provider', () => {
      const config = {
        provider: 'unsupported' as LLMProvider,
        apiKey: 'test-key',
        model: 'test-model',
      };

      expect(() => createLLMClient(config)).toThrow('Unsupported LLM provider');
    });

    it('should pass config to OpenAI client', () => {
      const { createOpenAIClientFromConfig } = require('../../../../src/services/llm/client/providers/openai');
      
      const config = {
        provider: LLMProvider.OPENAI,
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://custom.openai.com/v1',
      };

      createLLMClient(config);
      // createOpenAIClientFromConfig receives the full config, but buildOpenAIConfig extracts only needed fields
      expect(createOpenAIClientFromConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'sk-test123',
          model: 'gpt-4',
          baseUrl: 'https://custom.openai.com/v1',
        })
      );
    });
  });
});

