import {
  buildOpenAIConfig,
  createOpenAIClientFromConfig,
} from '../../../../../../src/services/llm/client/providers/openai';

// Mock the OpenAI client creation
jest.mock('../../../../../../src/services/llm/client/providers/openai/openai-client', () => ({
  createOpenAIClient: jest.fn(() => ({
    sendMessage: jest.fn(),
    streamMessage: jest.fn(),
  })),
}));

describe('OpenAI Provider Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildOpenAIConfig', () => {
    it('should build OpenAI config from generic config', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://custom.openai.com/v1',
      };

      const result = buildOpenAIConfig(config);
      expect(result).toEqual({
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://custom.openai.com/v1',
      });
    });

    it('should handle config without baseUrl', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };

      const result = buildOpenAIConfig(config);
      expect(result).toEqual({
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: undefined,
      });
    });
  });

  describe('createOpenAIClientFromConfig', () => {
    it('should create OpenAI client from generic config', () => {
      const { createOpenAIClient } = require('../../../../../../src/services/llm/client/providers/openai/openai-client');
      
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };

      const client = createOpenAIClientFromConfig(config);
      expect(client).toBeDefined();
      expect(createOpenAIClient).toHaveBeenCalledWith({
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: undefined,
      });
    });
  });
});

