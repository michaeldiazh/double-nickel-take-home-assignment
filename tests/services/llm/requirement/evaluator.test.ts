/**
 * Tests for evaluator module
 */

import { evaluateRequirementCriteria } from '../../../../src/services/llm/requirement/evaluator';
import { RequirementStatus } from '../../../../src/entities/conversation-job-requirement/domain';
import { JobRequirementType } from '../../../../src/services/criteria/criteria-types';

describe('evaluateRequirementCriteria', () => {
  let mockConversationJobRequirementRepo: any;
  let mockJobRequirementRepo: any;
  let deps: any;
  let mockRequirement: any;

  beforeEach(() => {
    mockConversationJobRequirementRepo = {
      update: jest.fn(),
      getConversationRequirements: jest.fn(),
    };

    mockJobRequirementRepo = {};

    deps = {
      conversationJobRequirementRepo: mockConversationJobRequirementRepo,
      jobRequirementRepo: mockJobRequirementRepo,
    };

    mockRequirement = {
      id: 'req-1',
      requirement_type: JobRequirementType.YEARS_EXPERIENCE,
      criteria: {
        required: true,
        min_years: 2,
      },
    };

  });

  it('should evaluate requirement as MET when value meets criteria', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: true,
      value: { years_experience: 3, meets_requirement: true },
      assessment: RequirementStatus.MET,
      message: 'Great! You have 3 years of experience.',
      needsClarification: false,
    };

    mockConversationJobRequirementRepo.update.mockResolvedValue(undefined);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(mockConversationJobRequirementRepo.update).toHaveBeenCalledWith(
      conversationId,
      mockRequirement.id,
      expect.objectContaining({
        extracted_value: { years_experience: 3, meets_requirement: true },
        status: RequirementStatus.MET,
        evaluated_at: expect.any(Date),
        message_id: assistantMessageId,
      })
    );

    expect(result.evaluationResult).toBe(RequirementStatus.MET);
    expect(result.needsClarification).toBe(false);
  });

  it('should evaluate requirement as NOT_MET when value does not meet criteria', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: true,
      value: { years_experience: 1, meets_requirement: false },
      assessment: RequirementStatus.NOT_MET,
      message: 'You have 1 year, but we need 2.',
      needsClarification: false,
    };

    mockConversationJobRequirementRepo.update.mockResolvedValue(undefined);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(result.evaluationResult).toBe(RequirementStatus.NOT_MET);
    expect(result.needsClarification).toBe(false);
  });

  it('should return needsClarification=true when parseResult.needsClarification is true', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: false,
      value: null,
      assessment: null,
      message: 'Could you clarify your experience?',
      needsClarification: true,
    };

    // Mock that we haven't exceeded follow-up threshold
    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue([
      {
        job_requirement_id: 'req-1',
        status: RequirementStatus.PENDING,
        message_id: null, // First follow-up
      },
    ]);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(result.needsClarification).toBe(true);
    expect(result.evaluationResult).toBe(RequirementStatus.PENDING);
  });

  it('should mark as NOT_MET when follow-up threshold is exceeded', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: false,
      value: null,
      assessment: null,
      message: 'Could you clarify?',
      needsClarification: true,
    };

    // Mock that we've exceeded follow-up threshold (message_id is set)
    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue([
      {
        job_requirement_id: 'req-1',
        status: RequirementStatus.PENDING,
        message_id: 'msg-previous', // Already asked once
      },
    ]);

    mockConversationJobRequirementRepo.update.mockResolvedValue(undefined);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(mockConversationJobRequirementRepo.update).toHaveBeenCalledWith(
      conversationId,
      mockRequirement.id,
      expect.objectContaining({
        status: RequirementStatus.NOT_MET,
        evaluated_at: expect.any(Date),
      })
    );

    expect(result.evaluationResult).toBe(RequirementStatus.NOT_MET);
    expect(result.needsClarification).toBe(false);
  });

  it('should use LLM assessment when parsing fails but assessment is provided', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: false,
      value: null,
      assessment: RequirementStatus.MET, // LLM provided assessment
      message: 'Great!',
      needsClarification: false,
    };

    mockConversationJobRequirementRepo.update.mockResolvedValue(undefined);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(result.evaluationResult).toBe(RequirementStatus.MET);
  });

  it('should return null evaluation when no value or assessment is available', async () => {
    const conversationId = 'conv-123';
    const assistantMessageId = 'msg-123';

    const parseResult = {
      success: false,
      value: null,
      assessment: null,
      message: 'Thank you.',
      needsClarification: false,
    };

    mockConversationJobRequirementRepo.update.mockResolvedValue(undefined);

    const result = await evaluateRequirementCriteria(
      conversationId,
      mockRequirement,
      parseResult,
      assistantMessageId,
      deps
    );

    expect(result.evaluationResult).toBeNull();
    expect(mockConversationJobRequirementRepo.update).toHaveBeenCalledWith(
      conversationId,
      mockRequirement.id,
      expect.objectContaining({
        status: RequirementStatus.PENDING,
      })
    );
  });
});
