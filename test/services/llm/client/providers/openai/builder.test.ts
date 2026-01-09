import {
  buildUsageMetadata,
  buildMetadata,
  buildOpenAIClient,
  buildNonStreamingRequest,
  buildStreamingRequest,
} from '../../../../../../src/services/llm/client/providers/openai/builder';
import OpenAI from 'openai';

describe('OpenAI Builder Functions', () => {
  describe('buildUsageMetadata', () => {
    it('should return undefined for null usage', () => {
      const result = buildUsageMetadata(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined usage', () => {
      const result = buildUsageMetadata(undefined);
      expect(result).toBeUndefined();
    });

    it('should build usage metadata correctly', () => {
      const usage: OpenAI.Completions.CompletionUsage = {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      };
      const result = buildUsageMetadata(usage);
      expect(result).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
    });
  });

  describe('buildMetadata', () => {
    it('should build metadata with usage', () => {
      const response: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };
      const result = buildMetadata(response);
      expect(result).toEqual({
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        responseId: 'chatcmpl-123',
      });
    });

    it('should build metadata without usage', () => {
      const response: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [],
      };
      const result = buildMetadata(response);
      expect(result).toEqual({
        usage: undefined,
        responseId: 'chatcmpl-123',
      });
    });

    it('should throw error for null response', () => {
      expect(() => buildMetadata(null as unknown as any)).toThrow();
    });
  });

  describe('buildOpenAIClient', () => {
    it('should build OpenAI client with apiKey and model', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };
      const client = buildOpenAIClient(config);
      expect(client).toBeInstanceOf(OpenAI);
    });

    it('should build OpenAI client with baseUrl', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://custom.openai.com/v1',
      };
      const client = buildOpenAIClient(config);
      expect(client).toBeInstanceOf(OpenAI);
    });

    it('should throw error for null config', () => {
      expect(() => buildOpenAIClient(null as unknown as any)).toThrow();
    });
  });

  describe('buildNonStreamingRequest', () => {
    it('should build non-streaming request correctly', () => {
      const model = 'gpt-4';
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'user', content: 'Hello' },
      ];
      const result = buildNonStreamingRequest(model, messages);
      expect(result).toEqual({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });
    });

    it('should throw error for empty model', () => {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'user', content: 'Hello' },
      ];
      expect(() => buildNonStreamingRequest('', messages)).toThrow();
    });

    it('should throw error for empty messages', () => {
      expect(() => buildNonStreamingRequest('gpt-4', [])).toThrow();
    });
  });

  describe('buildStreamingRequest', () => {
    it('should build streaming request correctly', () => {
      const model = 'gpt-4';
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'user', content: 'Hello' },
      ];
      const result = buildStreamingRequest(model, messages);
      expect(result).toEqual({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      });
    });

    it('should throw error for empty model', () => {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'user', content: 'Hello' },
      ];
      expect(() => buildStreamingRequest('', messages)).toThrow();
    });

    it('should throw error for empty messages', () => {
      expect(() => buildStreamingRequest('gpt-4', [])).toThrow();
    });
  });
});

