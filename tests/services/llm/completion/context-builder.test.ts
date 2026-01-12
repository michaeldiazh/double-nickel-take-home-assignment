/**
 * Tests for completion context builder module
 */

import { buildDoneContext } from '../../../../src/services/llm/completion/context-builder';
import { ConversationStatus, ScreeningDecision } from '../../../../src/entities';
import { MessageRole } from '../../../../src/services/llm/client';

describe('buildDoneContext', () => {
  let mockConversationRepo: any;
  let mockMessageRepo: any;
  let mockConversationJobRequirementRepo: any;
  let mockJobRequirementRepo: any;
  let mockJobFactRepo: any;
  let deps: any;

  beforeEach(() => {
    mockConversationRepo = {
      getContext: jest.fn().mockResolvedValue({
        user_first_name: 'John',
        job_title: 'CDL-A Driver',
        job_id: 'job-1',
        screening_decision: ScreeningDecision.APPROVED,
      }),
    };

    mockMessageRepo = {
      getByConversationId: jest.fn().mockResolvedValue([
        { sender: 'USER', content: 'Hello' },
        { sender: 'ASSISTANT', content: 'Hi there' },
      ]),
    };

    mockConversationJobRequirementRepo = {
      getConversationRequirements: jest.fn().mockResolvedValue([
        {
          conversation_job_requirement_id: 'cr-1',
          job_requirement_id: 'req-1',
          status: 'MET',
          extracted_value: { years_experience: 5 },
          evaluated_at: new Date(),
          message_id: 'msg-1',
        },
      ]),
    };

    mockJobRequirementRepo = {
      getByJobId: jest.fn().mockResolvedValue([
        {
          id: 'req-1',
          job_id: 'job-1',
          requirement_type: 'YEARS_EXPERIENCE',
          requirement_description: '5 years experience',
          criteria: { min_years: 2 },
        },
      ]),
    };

    mockJobFactRepo = {
      getByJobId: jest.fn().mockResolvedValue([
        { id: 'fact-1', job_id: 'job-1', fact_text: 'Great benefits' },
      ]),
    };

    deps = {
      conversationRepo: mockConversationRepo,
      messageRepo: mockMessageRepo,
      conversationJobRequirementRepo: mockConversationJobRequirementRepo,
      jobRequirementRepo: mockJobRequirementRepo,
      jobFactRepo: mockJobFactRepo,
    };
  });

  it('should build context with all required fields', async () => {
    const result = await buildDoneContext('conv-1', deps);

    expect(result.context.conversation_id).toBe('conv-1');
    expect(result.context.user_first_name).toBe('John');
    expect(result.context.job_title).toBe('CDL-A Driver');
    expect(result.context.status).toBe(ConversationStatus.DONE);
    expect(result.context.requirements).toHaveLength(1);
    expect(result.context.conversation_requirements).toHaveLength(1);
    expect(result.context.job_facts).toHaveLength(1);
    expect(result.context.message_history).toHaveLength(2);
    expect(result.context.current_requirement).toBeDefined();
  });

  it('should map messages to ChatMessage format', async () => {
    const result = await buildDoneContext('conv-1', deps);

    expect(result.context.message_history[0].role).toBe(MessageRole.USER);
    expect(result.context.message_history[0].content).toBe('Hello');
    expect(result.context.message_history[1].role).toBe(MessageRole.ASSISTANT);
    expect(result.context.message_history[1].content).toBe('Hi there');
  });

  it('should map conversation requirements correctly', async () => {
    const result = await buildDoneContext('conv-1', deps);

    const cr = result.context.conversation_requirements[0];
    expect(cr.id).toBe('cr-1');
    expect(cr.job_requirement_id).toBe('req-1');
    expect(cr.status).toBe('MET');
    expect(cr.extracted_value).toEqual({ years_experience: 5 });
  });

  it('should return screening decision from context', async () => {
    const result = await buildDoneContext('conv-1', deps);

    expect(result.screeningDecision).toBe(ScreeningDecision.APPROVED);
  });

  it('should throw error if conversation not found', async () => {
    mockConversationRepo.getContext.mockResolvedValue(null);

    await expect(buildDoneContext('conv-1', deps)).rejects.toThrow(
      'Conversation conv-1 not found'
    );
  });

  it('should throw error if no requirements found', async () => {
    mockJobRequirementRepo.getByJobId.mockResolvedValue([]);

    await expect(buildDoneContext('conv-1', deps)).rejects.toThrow(
      'No requirements found for conversation conv-1'
    );
  });

  it('should use last requirement as current_requirement', async () => {
    mockJobRequirementRepo.getByJobId.mockResolvedValue([
      { id: 'req-1', job_id: 'job-1' },
      { id: 'req-2', job_id: 'job-1' },
    ]);

    const result = await buildDoneContext('conv-1', deps);

    expect(result.context.current_requirement).toBeDefined();
    expect(result.context.current_requirement!.id).toBe('req-2');
  });

  it('should handle empty message history', async () => {
    mockMessageRepo.getByConversationId.mockResolvedValue([]);

    const result = await buildDoneContext('conv-1', deps);

    expect(result.context.message_history).toHaveLength(0);
  });

  it('should handle empty conversation requirements', async () => {
    mockConversationJobRequirementRepo.getConversationRequirements.mockResolvedValue([]);

    const result = await buildDoneContext('conv-1', deps);

    expect(result.context.conversation_requirements).toHaveLength(0);
  });
});
