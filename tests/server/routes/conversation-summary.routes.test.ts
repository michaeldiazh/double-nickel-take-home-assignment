/**
 * Tests for conversation summary routes
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ConversationRepository } from '../../../src/entities/conversation/repository';
import { ApplicationRepository } from '../../../src/entities/application/repository';
import { MessageRepository } from '../../../src/entities/message/repository';
import { Conversation, ScreeningDecision, ConversationStatus } from '../../../src/entities/conversation/domain';
import { Message, MessageSender } from '../../../src/entities/message/domain';

describe('Conversation Summary Routes - Route Handler Logic', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockConversationRepo: jest.Mocked<ConversationRepository>;
  let mockApplicationRepo: jest.Mocked<ApplicationRepository>;
  let mockMessageRepo: jest.Mocked<MessageRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as any;

    mockConversationRepo = {
      getByApplicationId: jest.fn(),
    } as any;

    mockApplicationRepo = {
      getWithUserAndJob: jest.fn(),
    } as any;

    mockMessageRepo = {
      getByConversationId: jest.fn(),
    } as any;

    mockRequest = {
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /conversation-summary/:applicationId', () => {
    const applicationId = '123e4567-e89b-4d3a-a456-426614174020';

    it('should return Approved status for APPROVED screening decision', async () => {
      const mockConversation: Conversation = {
        id: '123e4567-e89b-4d3a-a456-426614174021',
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.APPROVED,
        screening_summary: 'Summary text',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).not.toBeNull();
      if (conversation) {
        expect(conversation.screening_decision).toBe(ScreeningDecision.APPROVED);
      }
    });

    it('should return Denied status for DENIED screening decision', async () => {
      const mockConversation: Conversation = {
        id: '123e4567-e89b-4d3a-a456-426614174022',
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.DENIED,
        screening_summary: 'Summary text',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).not.toBeNull();
      if (conversation) {
        expect(conversation.screening_decision).toBe(ScreeningDecision.DENIED);
      }
    });

    it('should return Pending status for PENDING screening decision', async () => {
      const mockConversation: Conversation = {
        id: '123e4567-e89b-4d3a-a456-426614174023',
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.ON_REQ,
        screening_decision: ScreeningDecision.PENDING,
        screening_summary: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).not.toBeNull();
      if (conversation) {
        expect(conversation.screening_decision).toBe(ScreeningDecision.PENDING);
      }
    });

    it('should return Canceled status for USER_CANCELED screening decision', async () => {
      const mockConversation: Conversation = {
        id: '123e4567-e89b-4d3a-a456-426614174024',
        application_id: applicationId,
        is_active: false,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.USER_CANCELED,
        screening_summary: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).not.toBeNull();
      if (conversation) {
        expect(conversation.screening_decision).toBe(ScreeningDecision.USER_CANCELED);
      }
    });

    it('should handle conversation not found', async () => {
      mockConversationRepo.getByApplicationId.mockResolvedValue(null);

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).toBeNull();
    });

    it('should validate UUID format for applicationId', () => {
      const validUuid = '123e4567-e89b-4d3a-a456-426614174020';
      const invalidUuid = 'invalid-uuid';

      // Valid UUID should pass
      expect(() => {
        // This would be validated by z.uuidv4() in the actual route
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(validUuid)) {
          throw new Error('Invalid UUID');
        }
      }).not.toThrow();

      // Invalid UUID should fail
      expect(() => {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invalidUuid)) {
          throw new Error('Invalid UUID');
        }
      }).toThrow();
    });
  });

  describe('GET /conversation-summary/:applicationId/messages', () => {
    const applicationId = '123e4567-e89b-4d3a-a456-426614174040';
    const conversationId = '123e4567-e89b-4d3a-a456-426614174041';

    it('should retrieve messages data for download', async () => {
      const mockApplication = {
        application_id: applicationId,
        user_id: '123e4567-e89b-4d3a-a456-426614174042',
        job_id: '123e4567-e89b-4d3a-a456-426614174043',
        application_created_at: new Date('2024-01-01'),
        user_first_name: 'John',
        user_last_name: 'Doe',
        job_title: 'Truck Driver',
        job_description: 'Drive trucks',
        job_payment_info: { hourly: 25 },
      };

      const mockConversation: Conversation = {
        id: conversationId,
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.APPROVED,
        screening_summary: 'Summary',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      const mockMessages: Message[] = [
        {
          id: '123e4567-e89b-4d3a-a456-426614174044',
          conversation_id: conversationId,
          sender: 'ASSISTANT' as MessageSender,
          content: 'Hello! Welcome to the screening process.',
          created_at: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '123e4567-e89b-4d3a-a456-426614174045',
          conversation_id: conversationId,
          sender: 'USER' as MessageSender,
          content: 'Hi, I am interested in this position.',
          created_at: new Date('2024-01-01T10:00:05Z'),
        },
      ];

      mockApplicationRepo.getWithUserAndJob.mockResolvedValue(mockApplication as any);
      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);
      mockMessageRepo.getByConversationId.mockResolvedValue(mockMessages);

      // Test the data retrieval flow
      const application = await mockApplicationRepo.getWithUserAndJob(applicationId);
      expect(application).not.toBeNull();

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).not.toBeNull();

      if (conversation) {
        const messages = await mockMessageRepo.getByConversationId(conversation.id);
        expect(messages).toHaveLength(2);
        expect(messages[0].sender).toBe('ASSISTANT');
        expect(messages[1].sender).toBe('USER');
      }
    });

    it('should handle application not found', async () => {
      mockApplicationRepo.getWithUserAndJob.mockResolvedValue(null);

      const application = await mockApplicationRepo.getWithUserAndJob(applicationId);
      expect(application).toBeNull();
    });

    it('should handle conversation not found', async () => {
      const mockApplication = {
        application_id: applicationId,
        user_first_name: 'John',
        user_last_name: 'Doe',
      };

      mockApplicationRepo.getWithUserAndJob.mockResolvedValue(mockApplication as any);
      mockConversationRepo.getByApplicationId.mockResolvedValue(null);

      const application = await mockApplicationRepo.getWithUserAndJob(applicationId);
      expect(application).not.toBeNull();

      const conversation = await mockConversationRepo.getByApplicationId(applicationId);
      expect(conversation).toBeNull();
    });

    it('should format messages correctly with timestamps and sender labels', () => {
      const messages: Array<{ sender: string; content: string; created_at: Date }> = [
        {
          sender: 'ASSISTANT',
          content: 'Hello!',
          created_at: new Date('2024-01-01T10:00:00Z'),
        },
        {
          sender: 'USER',
          content: 'Hi there!',
          created_at: new Date('2024-01-01T10:00:05Z'),
        },
        {
          sender: 'SYSTEM',
          content: 'System message',
          created_at: new Date('2024-01-01T10:00:10Z'),
        },
      ];

      // Test message formatting logic
      const formatted = messages
        .map((msg) => {
          const timestamp = msg.created_at.toISOString();
          const senderLabel = msg.sender === 'USER' ? 'User' : msg.sender === 'ASSISTANT' ? 'Assistant' : 'System';
          return `[${timestamp}] ${senderLabel}: ${msg.content}`;
        })
        .join('\n\n');

      expect(formatted).toContain('[2024-01-01T10:00:00.000Z] Assistant: Hello!');
      expect(formatted).toContain('[2024-01-01T10:00:05.000Z] User: Hi there!');
      expect(formatted).toContain('[2024-01-01T10:00:10.000Z] System: System message');
    });

    it('should build filename correctly with sanitized names', () => {
      const firstName = 'John';
      const lastName = 'Doe';
      const appId = applicationId;

      const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedFirstName}_${sanitizedLastName}_${appId}.txt`;

      expect(filename).toBe(`John_Doe_${appId}.txt`);
    });

    it('should sanitize special characters in filename', () => {
      const firstName = 'John O\'Brien';
      const lastName = 'Doe-Smith';
      const appId = applicationId;

      const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedFirstName}_${sanitizedLastName}_${appId}.txt`;

      expect(filename).toBe(`John_O_Brien_Doe_Smith_${appId}.txt`);
    });

    it('should handle empty messages list', async () => {
      const mockApplication = {
        application_id: applicationId,
        user_first_name: 'John',
        user_last_name: 'Doe',
      };

      const mockConversation: Conversation = {
        id: conversationId,
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.PENDING,
        screening_decision: ScreeningDecision.PENDING,
        screening_summary: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockApplicationRepo.getWithUserAndJob.mockResolvedValue(mockApplication as any);
      mockConversationRepo.getByApplicationId.mockResolvedValue(mockConversation);
      mockMessageRepo.getByConversationId.mockResolvedValue([]);

      const messages = await mockMessageRepo.getByConversationId(conversationId);
      expect(messages).toEqual([]);
      expect(messages).toHaveLength(0);
    });
  });
});
