/**
 * Tests for state-router module
 */

import { routeRequirementState } from '../../../../src/domain/llm/requirement/state-router';
import { ConversationStatus, ScreeningDecision } from '../../../../src/entities/conversation/domain';
import { RequirementStatus } from '../../../../src/entities/conversation-job-requirement/domain';

describe('routeRequirementState', () => {
  let mockConversationRepo: any;
  let mockConversationJobRequirementRepo: any;
  let mockJobRequirementRepo: any;
  let mockContextService: any;
  let mockMessageRepo: any;
  let mockProcessor: any;
  let deps: any;
  let mockStreamOptions: any;

  beforeEach(() => {
    mockConversationRepo = {
      update: jest.fn(),
    };

    mockConversationJobRequirementRepo = {
      getConversationRequirements: jest.fn(),
      getNextPending: jest.fn(),
    };

    mockJobRequirementRepo = {
      getById: jest.fn(),
    };

    mockContextService = {
      loadFullContext: jest.fn(),
    };

    mockMessageRepo = {
      create: jest.fn(),
    };

    mockProcessor = jest.fn();

    deps = {
      conversationRepo: mockConversationRepo,
      conversationJobRequirementRepo: mockConversationJobRequirementRepo,
      jobRequirementRepo: mockJobRequirementRepo,
      contextService: mockContextService,
      messageRepo: mockMessageRepo,
      processor: mockProcessor,
    };

    mockStreamOptions = {
      onChunk: jest.fn(),
      onComplete: jest.fn(),
    };
  });

  it('should transition to ON_JOB_QUESTIONS when all requirements are MET', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Great! All requirements met.';

    const allRequirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1 },
      { job_requirement_id: 'req-2', status: RequirementStatus.MET, priority: 2 },
      { job_requirement_id: 'req-3', status: RequirementStatus.MET, priority: 3 },
    ];

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      user: { id: 'user-1' },
      job: { id: 'job-1' },
    };

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);
    mockConversationRepo.update.mockResolvedValue(undefined);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);
    mockProcessor.mockResolvedValue({
      assistantMessage: 'Do you have any questions about the job?',
    });
    mockMessageRepo.create.mockResolvedValue('msg-123');

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.MET,
      assistantMessage,
      'user message', // userMessage
      false, // needsClarification
      mockStreamOptions,
      deps
    );

    expect(mockConversationRepo.update).toHaveBeenCalledWith(
      conversationId,
      expect.objectContaining({
        conversation_status: ConversationStatus.ON_JOB_QUESTIONS,
      })
    );

    expect(result.newStatus).toBe(ConversationStatus.ON_JOB_QUESTIONS);
    expect(result.requirementMet).toBe(true);
  });

  it('should generate next requirement question when more requirements exist', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Great!';

    const allRequirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1 },
      { job_requirement_id: 'req-2', status: RequirementStatus.PENDING, priority: 2 },
      { job_requirement_id: 'req-3', status: RequirementStatus.PENDING, priority: 3 },
    ];

    const nextRequirement = {
      job_requirement_id: 'req-2',
      requirement_type: 'YEARS_EXPERIENCE',
    };

    const nextRequirementObj = {
      id: 'req-2',
      requirement_type: 'YEARS_EXPERIENCE',
      requirement_description: '2 years experience',
      criteria: { min_years: 2 },
    };

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      current_requirement: nextRequirementObj,
      user: { id: 'user-1' },
      job: { id: 'job-1' },
    };

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);
    mockConversationJobRequirementRepo.getNextPending.mockResolvedValue(nextRequirement);
    mockJobRequirementRepo.getById.mockResolvedValue(nextRequirementObj);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);
    mockProcessor.mockResolvedValue({
      assistantMessage: 'How many years of experience do you have?',
    });
    mockMessageRepo.create.mockResolvedValue('msg-123');

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.MET,
      assistantMessage,
      'user message', // userMessage
      false, // needsClarification
      mockStreamOptions,
      deps
    );

    expect(result.newStatus).toBe(ConversationStatus.ON_REQ);
    expect(result.requirementMet).toBe(true);
    expect(result.assistantMessage).toBe('How many years of experience do you have?');
  });

  it('should set DENIED status when required requirement is NOT_MET', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Sorry, you do not meet this requirement.';

    const allRequirements = [
      {
        job_requirement_id: 'req-1',
        status: RequirementStatus.NOT_MET,
        priority: 1,
      },
    ];

    const jobRequirement = {
      id: 'req-1',
      criteria: { required: true },
    };

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);
    mockJobRequirementRepo.getById.mockResolvedValue(jobRequirement);
    mockConversationRepo.update.mockResolvedValue(undefined);

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.NOT_MET,
      assistantMessage,
      'user message', // userMessage
      false, // needsClarification
      mockStreamOptions,
      deps
    );

    expect(mockConversationRepo.update).toHaveBeenCalledWith(
      conversationId,
      expect.objectContaining({
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.DENIED,
        is_active: false,
      })
    );

    expect(result.newStatus).toBe(ConversationStatus.DONE);
    expect(result.requirementMet).toBe(false);
  });

  it('should stream message for NOT_MET or PENDING cases', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Could you provide more details?';

    const allRequirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.PENDING, priority: 1 },
    ];

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.PENDING,
      assistantMessage,
      'user message', // userMessage
      false, // needsClarification
      mockStreamOptions,
      deps
    );

    expect(mockStreamOptions.onChunk).toHaveBeenCalled();
    expect(mockStreamOptions.onComplete).toHaveBeenCalled();
    expect(result.assistantMessage).toBe(assistantMessage);
    expect(result.newStatus).toBe(ConversationStatus.ON_REQ);
    expect(result.requirementMet).toBeNull();
  });

  it('should not stream confirmation when requirement is MET', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Great! You meet this requirement.';

    const allRequirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1 },
      { job_requirement_id: 'req-2', status: RequirementStatus.PENDING, priority: 2 },
    ];

    const nextRequirement = {
      job_requirement_id: 'req-2',
    };

    const nextRequirementObj = {
      id: 'req-2',
      requirement_type: 'YEARS_EXPERIENCE',
    };

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      current_requirement: nextRequirementObj,
      user: { id: 'user-1' },
      job: { id: 'job-1' },
    };

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);
    mockConversationJobRequirementRepo.getNextPending.mockResolvedValue(nextRequirement);
    mockJobRequirementRepo.getById.mockResolvedValue(nextRequirementObj);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);
    mockProcessor.mockResolvedValue({
      assistantMessage: 'Next question: How many years?',
    });
    mockMessageRepo.create.mockResolvedValue('msg-123');

    // Clear any previous calls
    mockStreamOptions.onChunk.mockClear();

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.MET,
      assistantMessage,
      'user message', // userMessage
      false, // needsClarification
      mockStreamOptions,
      deps
    );

    // Should not stream the confirmation message
    // But should stream the next question
    expect(result.assistantMessage).not.toBe(assistantMessage);
    expect(result.assistantMessage).toBe('Next question: How many years?');
  });

  it('should handle follow-up clarification case', async () => {
    const conversationId = 'conv-123';
    const currentRequirementId = 'req-1';
    const assistantMessage = 'Could you please clarify your experience?';

    const allRequirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.PENDING, priority: 1 },
    ];

    const mockContext = {
      status: ConversationStatus.ON_REQ,
      user: { id: 'user-1' },
      job: { id: 'job-1' },
      current_requirement: {
        id: 'req-1',
        requirement_type: 'YEARS_EXPERIENCE',
        criteria: { required: true, min_years: 2 },
      },
    };

    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue(allRequirements);
    mockContextService.loadFullContext.mockResolvedValue(mockContext);
    mockProcessor.mockResolvedValue({
      assistantMessage: 'Can you provide more details about your experience?',
    });

    const result = await routeRequirementState(
      conversationId,
      currentRequirementId,
      RequirementStatus.PENDING,
      assistantMessage,
      '', // userMessage
      true, // needsClarification
      mockStreamOptions,
      deps
    );

    expect(mockStreamOptions.onChunk).toHaveBeenCalled();
    expect(mockStreamOptions.onComplete).toHaveBeenCalled();
    expect(result.newStatus).toBe(ConversationStatus.ON_REQ);
    expect(result.requirementMet).toBeNull();
    expect(result.needsClarification).toBe(true);
  });
});
