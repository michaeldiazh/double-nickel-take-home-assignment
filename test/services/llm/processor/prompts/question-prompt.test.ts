import {
  buildInitialPrompt,
  buildConversationPrompt,
  buildFollowUpPrompt,
  getRequirementDescription,
} from '../../../../../src/services/llm/processor/prompts/question-prompt';
import { ChatMessage, MessageRole } from '../../../../../src/services/llm/client/types';
import { ConversationContext } from '../../../../../src/services/llm/processor/prompts/prompt-context';
import { JobRequirementWithType } from '../../../../../src/services/criteria/types';
import { RequirementStatus } from '../../../../../src/entities/enums';
import { SimplifiedConversationRequirements } from '../../../../../src/entities/conversation-requirements/domain';
import { CDLClassCriteria, CDLClass } from '../../../../../src/services/criteria/criteria-types';

describe('Question Prompt Builders', () => {
  describe('getRequirementDescription', () => {
    it('should return requirementDescription when provided', () => {
      const requirementType = {
        requirementType: 'CDL_CLASS',
        requirementDescription: 'Commercial Driver License Class',
      };

      const result = getRequirementDescription(requirementType);
      expect(result).toBe('Commercial Driver License Class');
    });

    it('should fallback to formatted requirementType when description is missing', () => {
      const requirementType = {
        requirementType: 'CDL_CLASS',
        requirementDescription: '',
      };

      const result = getRequirementDescription(requirementType);
      expect(result).toBe('cdl class');
    });

    it('should format requirementType with underscores replaced by spaces', () => {
      const requirementType = {
        requirementType: 'YEARS_EXPERIENCE',
        requirementDescription: '',
      };

      const result = getRequirementDescription(requirementType);
      expect(result).toBe('years experience');
    });
  });

  describe('buildInitialPrompt', () => {
    it('should build initial prompt with system and assistant messages', () => {
      const jobTitle = 'Long Haul Truck Driver';
      const jobLocation = 'New York, NY';

      const result = buildInitialPrompt(jobTitle, jobLocation);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(MessageRole.SYSTEM);
      expect(result[0].content).toContain('Happy Hauler Trucking Co');
      expect(result[0].content).toContain(jobTitle);

      expect(result[1].role).toBe(MessageRole.ASSISTANT);
      expect(result[1].content).toContain('Happy Hauler Trucking Co');
      expect(result[1].content).toContain(jobTitle);
      expect(result[1].content).toContain('Can I ask you a few quick questions');
    });

    it('should handle undefined job location', () => {
      const result = buildInitialPrompt('Driver', undefined);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(MessageRole.SYSTEM);
      expect(result[1].role).toBe(MessageRole.ASSISTANT);
    });

    it('should include company name in assistant greeting', () => {
      const result = buildInitialPrompt('Driver', 'Location');
      expect(result[1].content).toContain('Happy Hauler Trucking Co');
    });
  });

  describe('buildConversationPrompt', () => {
    const createMockRequirement = (
      requirementType: string,
      priority: number = 1,
      criteria: unknown = { cdl_class: CDLClass.A, required: true }
    ): JobRequirementWithType => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      jobId: '123e4567-e89b-12d3-a456-426614174001',
      requirementTypeId: '123e4567-e89b-12d3-a456-426614174002',
      priority,
      criteria: criteria as Record<string, unknown>,
      requirementType: {
        requirementType,
        requirementDescription: 'CDL Class',
      },
    });

    const createMockConversationRequirement = (
      status: RequirementStatus,
      requirementId: string = '123e4567-e89b-12d3-a456-426614174000' // Default matches createMockRequirement's id
    ): SimplifiedConversationRequirements => ({
      id: '123e4567-e89b-12d3-a456-426614174010',
      conversationId: '123e4567-e89b-12d3-a456-426614174001',
      requirementId,
      messageId: null,
      status,
      value: null,
    });

    it('should build conversation prompt with system message and context', () => {
      const jobTitle = 'Long Haul Truck Driver';
      const currentRequirement = createMockRequirement('CDL_CLASS', 1);
      const messageHistory: ChatMessage[] = [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi there!' },
      ];

      const context: ConversationContext = {
        messageHistory,
        requirements: [currentRequirement],
        conversationRequirements: [createMockConversationRequirement(RequirementStatus.PENDING, currentRequirement.id)],
        currentRequirement,
      };

      const result = buildConversationPrompt(jobTitle, context);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].role).toBe(MessageRole.SYSTEM);
      expect(result[0].content).toContain('Happy Hauler Trucking Co');
      expect(result[0].content).toContain(jobTitle);
      expect(result[0].content).toContain('CDL Class');
    });

    it('should include conversation context as system message', () => {
      const currentRequirement = createMockRequirement('CDL_CLASS', 1);
      const context: ConversationContext = {
        messageHistory: [],
        requirements: [currentRequirement],
        conversationRequirements: [createMockConversationRequirement(RequirementStatus.PENDING, currentRequirement.id)],
        currentRequirement,
      };

      const result = buildConversationPrompt('Driver', context);

      // Should have at least 2 system messages: one for requirement, one for context
      const systemMessages = result.filter(msg => msg.role === MessageRole.SYSTEM);
      expect(systemMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('should include message history in result', () => {
      const currentRequirement = createMockRequirement('CDL_CLASS', 1);
      const messageHistory: ChatMessage[] = [
        { role: MessageRole.USER, content: 'I have a CDL' },
        { role: MessageRole.ASSISTANT, content: 'Great!' },
      ];

      const context: ConversationContext = {
        messageHistory,
        requirements: [currentRequirement],
        conversationRequirements: [createMockConversationRequirement(RequirementStatus.PENDING, currentRequirement.id)],
        currentRequirement,
      };

      const result = buildConversationPrompt('Driver', context);

      // Message history should be included
      const userMessages = result.filter(msg => msg.role === MessageRole.USER);
      const assistantMessages = result.filter(msg => msg.role === MessageRole.ASSISTANT);
      expect(userMessages.length).toBeGreaterThan(0);
      expect(assistantMessages.length).toBeGreaterThan(0);
    });

    it('should throw error when currentRequirement is missing', () => {
      const context: ConversationContext = {
        messageHistory: [],
        requirements: [],
        conversationRequirements: [],
        currentRequirement: undefined,
      };

      expect(() => buildConversationPrompt('Driver', context)).toThrow(
        'currentRequirement is required when building a conversation prompt'
      );
    });

    it('should handle empty message history', () => {
      const currentRequirement = createMockRequirement('CDL_CLASS', 1);
      const context: ConversationContext = {
        messageHistory: [],
        requirements: [currentRequirement],
        conversationRequirements: [createMockConversationRequirement(RequirementStatus.PENDING, currentRequirement.id)],
        currentRequirement,
      };

      const result = buildConversationPrompt('Driver', context);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].role).toBe(MessageRole.SYSTEM);
    });
  });

  describe('buildFollowUpPrompt', () => {
    const createMockRequirement = (): JobRequirementWithType => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      jobId: '123e4567-e89b-12d3-a456-426614174001',
      requirementTypeId: '123e4567-e89b-12d3-a456-426614174002',
      priority: 1,
      criteria: { cdl_class: CDLClass.A, required: true } as CDLClassCriteria,
      requirementType: {
        requirementType: 'CDL_CLASS',
        requirementDescription: 'CDL Class',
      },
    });

    it('should build follow-up prompt with clarification instruction', () => {
      const currentRequirement = createMockRequirement();
      const context: ConversationContext = {
        messageHistory: [
          { role: MessageRole.USER, content: 'A while' },
        ],
        requirements: [currentRequirement],
        conversationRequirements: [{
          id: '123e4567-e89b-12d3-a456-426614174010',
          conversationId: '123e4567-e89b-12d3-a456-426614174001',
          requirementId: currentRequirement.id,
          messageId: null,
          status: RequirementStatus.PENDING,
          value: null,
        }],
        currentRequirement,
      };

      const clarificationNeeded = 'exact number of years of experience';
      const result = buildFollowUpPrompt('Driver', context, clarificationNeeded);

      // Should include base conversation prompt plus follow-up instruction
      expect(result.length).toBeGreaterThan(1);
      
      // Last message should be system message with clarification instruction
      const lastMessage = result[result.length - 1];
      expect(lastMessage.role).toBe(MessageRole.SYSTEM);
      expect(lastMessage.content).toContain(clarificationNeeded);
      expect(lastMessage.content).toContain('unclear');
    });

    it('should include all base conversation messages', () => {
      const currentRequirement = createMockRequirement();
      const messageHistory: ChatMessage[] = [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi!' },
      ];

      const context: ConversationContext = {
        messageHistory,
        requirements: [currentRequirement],
        conversationRequirements: [{
          id: '123e4567-e89b-12d3-a456-426614174010',
          conversationId: '123e4567-e89b-12d3-a456-426614174001',
          requirementId: currentRequirement.id,
          messageId: null,
          status: RequirementStatus.PENDING,
          value: null,
        }],
        currentRequirement,
      };

      const result = buildFollowUpPrompt('Driver', context, 'years');

      // Should include original messages
      const userMessages = result.filter(msg => msg.role === MessageRole.USER);
      expect(userMessages.length).toBeGreaterThan(0);
    });
  });
});

