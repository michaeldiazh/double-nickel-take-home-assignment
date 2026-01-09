import {
  validateMessages,
  validateMessage,
  validateStreamOptions,
  validateConfig,
  validateResponse,
} from '../../../../../../src/services/llm/client/providers/openai/validation';
import { MessageRole } from '../../../../../../src/services/llm/client/types';
import OpenAI from 'openai';

describe('OpenAI Validation Functions', () => {
  describe('validateMessages', () => {
    it('should return valid for non-empty messages array', () => {
      const messages = [
        { role: MessageRole.USER, content: 'Hello' },
      ];
      const result = validateMessages(messages);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty array', () => {
      const result = validateMessages([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should return invalid for null', () => {
      const result = validateMessages(null as unknown as []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should return invalid for undefined', () => {
      const result = validateMessages(undefined as unknown as []);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('validateMessage', () => {
    it('should return valid for valid message', () => {
      const message = { role: MessageRole.USER, content: 'Hello' };
      const result = validateMessage(message, 0);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for null message', () => {
      const result = validateMessage(null as unknown as any, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('index 0');
      expect(result.error).toContain('null or undefined');
    });

    it('should return invalid for missing role', () => {
      const message = { content: 'Hello' } as any;
      const result = validateMessage(message, 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('index 1');
      expect(result.error).toContain('role');
    });

    it('should return invalid for invalid content type', () => {
      const message = { role: MessageRole.USER, content: 123 } as any;
      const result = validateMessage(message, 2);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('index 2');
      expect(result.error).toContain('content');
      expect(result.error).toContain('string');
    });
  });

  describe('validateStreamOptions', () => {
    it('should return valid for valid stream options', () => {
      const options = {
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn(),
      };
      const result = validateStreamOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid with only required onChunk', () => {
      const options = {
        onChunk: jest.fn(),
      };
      const result = validateStreamOptions(options);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for null', () => {
      const result = validateStreamOptions(null as unknown as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be null or undefined');
    });

    it('should return invalid for undefined', () => {
      const result = validateStreamOptions(undefined as unknown as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be null or undefined');
    });

    it('should return invalid for missing onChunk', () => {
      const options = {} as any;
      const result = validateStreamOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('onChunk must be a function');
    });

    it('should return invalid for non-function onChunk', () => {
      const options = { onChunk: 'not a function' } as any;
      const result = validateStreamOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('onChunk must be a function');
    });
  });

  describe('validateConfig', () => {
    it('should return valid for valid config', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid with optional baseUrl', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for null', () => {
      const result = validateConfig(null as unknown as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be null or undefined');
    });

    it('should return invalid for missing apiKey', () => {
      const config = { model: 'gpt-4' } as any;
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('apiKey');
    });

    it('should return invalid for empty apiKey', () => {
      const config = { apiKey: '', model: 'gpt-4' };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('apiKey');
    });

    it('should return invalid for whitespace-only apiKey', () => {
      const config = { apiKey: '   ', model: 'gpt-4' };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('apiKey');
    });

    it('should return invalid for missing model', () => {
      const config = { apiKey: 'sk-test123' } as any;
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('model');
    });

    it('should return invalid for empty model', () => {
      const config = { apiKey: 'sk-test123', model: '' };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('model');
    });
  });

  describe('validateResponse', () => {
    it('should return valid for valid response', () => {
      const response: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
              refusal: null,
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };
      const result = validateResponse(response);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for null', () => {
      const result = validateResponse(null as unknown as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should return invalid for missing choices', () => {
      const response = {
        id: 'chatcmpl-123',
        model: 'gpt-4',
      } as any;
      const result = validateResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no choices');
    });

    it('should return invalid for empty choices array', () => {
      const response = {
        id: 'chatcmpl-123',
        model: 'gpt-4',
        choices: [],
      } as any;
      const result = validateResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no choices');
    });

    it('should return invalid for missing model', () => {
      const response = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: { role: 'assistant', content: 'Hello' },
          },
        ],
      } as any;
      const result = validateResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing model information');
    });
  });
});

