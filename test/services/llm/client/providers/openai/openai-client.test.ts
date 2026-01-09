import { createOpenAIClient } from '../../../../../../src/services/llm/client/providers/openai/openai-client';
import { MessageRole } from '../../../../../../src/services/llm/client/types';
import OpenAI from 'openai';

// Mock the OpenAI SDK
jest.mock('openai');

describe('OpenAI Client', () => {
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockChatCompletions: {
    create: jest.Mock;
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock chat completions
    mockChatCompletions = {
      create: jest.fn(),
    };

    // Setup mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: mockChatCompletions,
      } as any,
    } as jest.Mocked<OpenAI>;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
  });

  describe('createOpenAIClient', () => {
    it('should create client with valid config', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      };
      expect(() => createOpenAIClient(config)).not.toThrow();
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test123',
        baseURL: undefined,
      });
    });

    it('should create client with baseUrl', () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
        baseUrl: 'https://custom.openai.com/v1',
      };
      createOpenAIClient(config);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test123',
        baseURL: 'https://custom.openai.com/v1',
      });
    });

    it('should throw error for invalid config', () => {
      expect(() => createOpenAIClient(null as any)).toThrow();
      expect(() => createOpenAIClient({ apiKey: '', model: 'gpt-4' })).toThrow();
      expect(() => createOpenAIClient({ apiKey: 'sk-test', model: '' })).toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const mockResponse: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help?',
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

      mockChatCompletions.create.mockResolvedValue(mockResponse);

      const messages = [
        { role: MessageRole.USER, content: 'Hello' },
      ];

      const result = await client.sendMessage(messages);

      expect(result).toEqual({
        content: 'Hello! How can I help?',
        model: 'gpt-4',
        metadata: {
          usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
          },
          responseId: 'chatcmpl-123',
        },
      });

      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });
    });

    it('should handle empty content gracefully', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const mockResponse: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null as any,
              refusal: null,
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse);

      const messages = [
        { role: MessageRole.USER, content: 'Hello' },
      ];

      const result = await client.sendMessage(messages);

      expect(result.content).toBe('');
      expect(result.model).toBe('gpt-4');
    });

    it('should throw error for empty messages', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      await expect(client.sendMessage([])).rejects.toThrow();
    });

    it('should throw error for invalid message', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      await expect(
        client.sendMessage([{ role: null as any, content: 'Hello' }])
      ).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      mockChatCompletions.create.mockRejectedValue(new Error('API Error'));

      const messages = [
        { role: MessageRole.USER, content: 'Hello' },
      ];

      await expect(client.sendMessage(messages)).rejects.toThrow('Failed to send message to OpenAI');
    });

    it('should convert different message roles correctly', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const mockResponse: OpenAI.Chat.Completions.ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
              refusal: null,
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse);

      const messages = [
        { role: MessageRole.SYSTEM, content: 'You are a helpful assistant' },
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi there' },
      ];

      await client.sendMessage(messages);

      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
        stream: false,
      });
    });
  });

  describe('streamMessage', () => {
    it('should stream messages and call callbacks', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      // Create mock async iterator for streaming
      const mockStream = async function* () {
        yield {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              delta: { content: 'Hello' },
              finish_reason: null,
            },
          ],
        };
        yield {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              delta: { content: ' World' },
              finish_reason: null,
            },
          ],
        };
        yield {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
        };
      };

      mockChatCompletions.create.mockResolvedValue(mockStream() as any);

      const messages = [
        { role: MessageRole.USER, content: 'Hello' },
      ];

      await client.streamMessage(messages, {
        onChunk,
        onComplete,
        onError,
      });

      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' World');
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();

      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      });
    });

    it('should call onError for invalid messages', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const onError = jest.fn();

      await client.streamMessage([], {
        onChunk: jest.fn(),
        onError,
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should call onError for API errors', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      mockChatCompletions.create.mockRejectedValue(new Error('API Error'));

      const onError = jest.fn();

      await client.streamMessage(
        [{ role: MessageRole.USER, content: 'Hello' }],
        {
          onChunk: jest.fn(),
          onError,
        }
      );

      expect(onError).toHaveBeenCalled();
    });

    it('should handle onChunk callback errors', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const onChunk = jest.fn(() => {
        throw new Error('Chunk error');
      });
      const onError = jest.fn();

      const mockStream = async function* () {
        yield {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              delta: { content: 'Hello' },
              finish_reason: null,
            },
          ],
        };
      };

      mockChatCompletions.create.mockResolvedValue(mockStream() as any);

      await client.streamMessage(
        [{ role: MessageRole.USER, content: 'Hello' }],
        {
          onChunk,
          onError,
        }
      );

      expect(onError).toHaveBeenCalled();
    });

    it('should handle empty chunks gracefully', async () => {
      const client = createOpenAIClient({
        apiKey: 'sk-test123',
        model: 'gpt-4',
      });

      const onChunk = jest.fn();
      const onComplete = jest.fn();

      const mockStream = async function* () {
        yield {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
        };
      };

      mockChatCompletions.create.mockResolvedValue(mockStream() as any);

      await client.streamMessage(
        [{ role: MessageRole.USER, content: 'Hello' }],
        {
          onChunk,
          onComplete,
        }
      );

      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});

