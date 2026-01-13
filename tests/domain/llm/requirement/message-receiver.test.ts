/**
 * Tests for message-receiver module
 */

import { receiveRequirementMessage, isValidRequirementStatus } from '../../../../src/domain/llm/requirement/message-receiver';
import { ConversationStatus } from '../../../../src/entities/conversation/domain';
import { RequirementStatus } from '../../../../src/entities/conversation-job-requirement/domain';
import { ConversationContextService } from '../../../../src/domain/conversation-context/service';

describe('receiveRequirementMessage', () => {
  let mockMessageRepo: any;
  let mockContextService: any;
  let deps: any;

  beforeEach(() => {
    mockMessageRepo = {
      create: jest.fn(),
    };

    mockContextService = {
      loadFullContext: jest.fn(),
    };

    deps = {
      messageRepo: mockMessageRepo,
      contextService: mockContextService,
    };
  });

  it('should save user message and return context with current requirement', async () => {
    const conversationId = 'conv-123';
    const userMessage = 'Yes, I have a CDL license';
    const userMessageId = 'msg-123';

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      current_requirement: {
        id: 'req-1',
        requirement_type: 'CDL_CLASS',
        requirement_description: 'Class A CDL',
        criteria: { required: true },
        priority: 1,
      },
      conversation_requirements: [
        {
          id: 'conv-req-1',
          job_requirement_id: 'req-1',
          status: RequirementStatus.PENDING,
        },
      ],
    };

    mockMessageRepo.create.mockResolvedValue(userMessageId);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);

    const result = await receiveRequirementMessage(conversationId, userMessage, deps);

    expect(mockMessageRepo.create).toHaveBeenCalledWith({
      conversation_id: conversationId,
      sender: 'USER',
      content: userMessage,
    });

    expect(mockContextService.loadFullContext).toHaveBeenCalledWith(conversationId);
    expect(result.context).toEqual(mockContext);
    expect(result.currentRequirement).toEqual(mockContext.current_requirement);
    expect(result.conversationRequirement).toEqual(mockContext.conversation_requirements[0]);
    expect(result.userMessageId).toBe(userMessageId);
  });

  it('should throw error if conversation is not in START or ON_REQ status', async () => {
    const conversationId = 'conv-123';
    const userMessage = 'Hello';
    const userMessageId = 'msg-123';

    const mockContext = {
      status: ConversationStatus.DONE,
    };

    mockMessageRepo.create.mockResolvedValue(userMessageId);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);

    await expect(
      receiveRequirementMessage(conversationId, userMessage, deps)
    ).rejects.toThrow('Conversation conv-123 is not in START or ON_REQ status');
  });

  it('should throw error if current_requirement is missing', async () => {
    const conversationId = 'conv-123';
    const userMessage = 'Hello';
    const userMessageId = 'msg-123';

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      current_requirement: undefined,
    };

    mockMessageRepo.create.mockResolvedValue(userMessageId);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);

    await expect(
      receiveRequirementMessage(conversationId, userMessage, deps)
    ).rejects.toThrow('current_requirement is required for requirement handler');
  });

  it('should throw error if conversation requirement not found', async () => {
    const conversationId = 'conv-123';
    const userMessage = 'Hello';
    const userMessageId = 'msg-123';

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      current_requirement: {
        id: 'req-1',
        requirement_type: 'CDL_CLASS',
      },
      conversation_requirements: [
        {
          job_requirement_id: 'req-2', // Different ID
        },
      ],
    };

    mockMessageRepo.create.mockResolvedValue(userMessageId);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);

    await expect(
      receiveRequirementMessage(conversationId, userMessage, deps)
    ).rejects.toThrow('Conversation requirement not found for requirement req-1');
  });

  it('should accept START status as valid', async () => {
    const conversationId = 'conv-123';
    const userMessage = 'Yes';
    const userMessageId = 'msg-123';

    const mockContext = {
      status: ConversationStatus.START,
      current_requirement: {
        id: 'req-1',
        requirement_type: 'CDL_CLASS',
      },
      conversation_requirements: [
        {
          job_requirement_id: 'req-1',
        },
      ],
    };

    mockMessageRepo.create.mockResolvedValue(userMessageId);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);

    const result = await receiveRequirementMessage(conversationId, userMessage, deps);

    expect(result.context.status).toBe(ConversationStatus.START);
  });
});

describe('isValidRequirementStatus', () => {
  it('should return true for START status', () => {
    expect(isValidRequirementStatus(ConversationStatus.START)).toBe(true);
  });

  it('should return true for ON_REQ status', () => {
    expect(isValidRequirementStatus(ConversationStatus.ON_REQ)).toBe(true);
  });

  it('should return false for PENDING status', () => {
    expect(isValidRequirementStatus(ConversationStatus.PENDING)).toBe(false);
  });

  it('should return false for ON_JOB_QUESTIONS status', () => {
    expect(isValidRequirementStatus(ConversationStatus.ON_JOB_QUESTIONS)).toBe(false);
  });

  it('should return false for DONE status', () => {
    expect(isValidRequirementStatus(ConversationStatus.DONE)).toBe(false);
  });
});
