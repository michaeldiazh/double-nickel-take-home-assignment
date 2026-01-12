/**
 * Tests for MessageRepository
 */

import { Pool, QueryResult } from 'pg';
import { MessageRepository } from '../../../src/entities/message/repository';

describe('MessageRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: MessageRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new MessageRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a message and return the ID', async () => {
      const messageData = {
        conversation_id: '123e4567-e89b-4d3a-a456-426614174000',
        sender: 'USER' as const,
        content: 'Hello, I want to apply',
      };

      const mockResult: QueryResult<{ id: string }> = {
        rows: [{ id: '223e4567-e89b-4d3a-a456-426614174001' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const messageId = await repository.create(messageData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        [
          messageData.conversation_id,
          messageData.sender,
          messageData.content,
        ]
      );
      expect(messageId).toBe('223e4567-e89b-4d3a-a456-426614174001');
    });
  });

  describe('getByConversationId', () => {
    it('should return messages for a conversation', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const mockMessages = [
        {
          id: '223e4567-e89b-4d3a-a456-426614174001',
          conversation_id: conversationId,
          sender: 'USER' as const,
          content: 'Hello',
          created_at: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '223e4567-e89b-4d3a-a456-426614174002',
          conversation_id: conversationId,
          sender: 'ASSISTANT' as const,
          content: 'Hi there!',
          created_at: new Date('2024-01-01T10:01:00Z'),
        },
      ];

      const mockResult: QueryResult<any> = {
        rows: mockMessages,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const messages = await repository.getByConversationId(conversationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('get_conversation_messages'),
        [conversationId]
      );
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].content).toBe('Hi there!');
    });

    it('should return empty array when no messages found', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const messages = await repository.getByConversationId(conversationId);

      expect(messages).toEqual([]);
    });
  });

  describe('getCount', () => {
    it('should return message count for a conversation', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<{ count: number }> = {
        rows: [{ count: 5 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const count = await repository.getCount(conversationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        [conversationId]
      );
      expect(count).toBe(5);
    });

    it('should return 0 when no messages found', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<{ count: number }> = {
        rows: [{ count: 0 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const count = await repository.getCount(conversationId);

      expect(count).toBe(0);
    });
  });
});
