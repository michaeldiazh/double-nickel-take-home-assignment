import {
  buildConversationHistory,
  buildRequirementsOverviewSection,
  buildCurrentRequirementDetailsSection,
  buildPreviouslyCollectedValueSection,
} from '../../../../../../src/services/llm/processor/prompts/message-builders/context';
import { ChatMessage, MessageRole } from '../../../../../../src/services/llm/client/types';
import { JobRequirementWithType } from '../../../../../../src/services/criteria/types';
import { RequirementStatus } from '../../../../../../src/entities/enums';
import { SimplifiedConversationRequirements } from '../../../../../../src/entities/conversation-requirements/domain';
import { CDLClassCriteria, CDLClass } from '../../../../../../src/services/criteria/criteria-types';

describe('Context Message Builders', () => {
  describe('buildConversationHistory', () => {
    it('should build conversation history from messages', () => {
      const messages: ChatMessage[] = [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi there!' },
        { role: MessageRole.USER, content: 'I have a CDL Class A' },
      ];

      const result = buildConversationHistory(messages);

      expect(result).toContain('## Conversation History');
      expect(result).toContain('user: Hello');
      expect(result).toContain('assistant: Hi there!');
      expect(result).toContain('user: I have a CDL Class A');
    });

    it('should handle empty message history', () => {
      const result = buildConversationHistory([]);
      expect(result).toContain('## Conversation History');
      expect(result).toContain('\n    \n  '); // Empty history section
    });

    it('should handle single message', () => {
      const messages: ChatMessage[] = [
        { role: MessageRole.USER, content: 'Hello' },
      ];

      const result = buildConversationHistory(messages);
      expect(result).toContain('user: Hello');
    });
  });

  describe('buildRequirementsOverviewSection', () => {
    const createMockConversationRequirement = (
      status: RequirementStatus,
      id: string = '123e4567-e89b-12d3-a456-426614174000'
    ): SimplifiedConversationRequirements => ({
      id,
      conversationId: '123e4567-e89b-12d3-a456-426614174001',
      requirementId: '123e4567-e89b-12d3-a456-426614174002',
      messageId: null,
      status,
      value: null,
    });

    it('should build overview with correct counts', () => {
      const requirements: SimplifiedConversationRequirements[] = [
        createMockConversationRequirement(RequirementStatus.MET),
        createMockConversationRequirement(RequirementStatus.MET),
        createMockConversationRequirement(RequirementStatus.NOT_MET),
        createMockConversationRequirement(RequirementStatus.PENDING),
        createMockConversationRequirement(RequirementStatus.PENDING),
      ];

      const result = buildRequirementsOverviewSection(requirements);

      expect(result).toContain('## Job Requirements Overview');
      expect(result).toContain('Total requirements: 5');
      expect(result).toContain('- Met: 2');
      expect(result).toContain('- Not Met: 1');
      expect(result).toContain('- Pending: 2');
    });

    it('should handle empty requirements', () => {
      const result = buildRequirementsOverviewSection([]);
      expect(result).toContain('Total requirements: 0');
      expect(result).toContain('- Met: 0');
      expect(result).toContain('- Not Met: 0');
      expect(result).toContain('- Pending: 0');
    });

    it('should handle all requirements with same status', () => {
      const requirements: SimplifiedConversationRequirements[] = [
        createMockConversationRequirement(RequirementStatus.MET),
        createMockConversationRequirement(RequirementStatus.MET),
        createMockConversationRequirement(RequirementStatus.MET),
      ];

      const result = buildRequirementsOverviewSection(requirements);
      expect(result).toContain('- Met: 3');
      expect(result).toContain('- Not Met: 0');
      expect(result).toContain('- Pending: 0');
    });
  });

  describe('buildCurrentRequirementDetailsSection', () => {
    const createMockRequirement = (
      requirementType: string,
      priority: number,
      criteria: unknown
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

    it('should build current requirement details for required requirement', () => {
      const requirement = createMockRequirement(
        'CDL_CLASS',
        1,
        { cdl_class: CDLClass.A, required: true } as CDLClassCriteria
      );

      const result = buildCurrentRequirementDetailsSection(requirement);

      expect(result).toContain('## Current Requirement');
      expect(result).toContain('Type: CDL_CLASS');
      expect(result).toContain('Priority: 1');
      expect(result).toContain('Required: Yes');
      expect(result).toContain(JSON.stringify(requirement.criteria));
    });

    it('should build current requirement details for preferred requirement', () => {
      const requirement = createMockRequirement(
        'YEARS_EXPERIENCE',
        2,
        { min_years: 2, preferred: true, required: false }
      );

      const result = buildCurrentRequirementDetailsSection(requirement);

      expect(result).toContain('Type: YEARS_EXPERIENCE');
      expect(result).toContain('Priority: 2');
      expect(result).toContain('Required: No (Preferred)');
    });

    it('should include criteria as JSON string', () => {
      const criteria = { cdl_class: CDLClass.B, required: true };
      const requirement = createMockRequirement('CDL_CLASS', 1, criteria);

      const result = buildCurrentRequirementDetailsSection(requirement);

      expect(result).toContain(`Criteria: ${JSON.stringify(criteria)}`);
    });
  });

  describe('buildPreviouslyCollectedValueSection', () => {
    it('should build section with collected value', () => {
      const conversationRequirement: SimplifiedConversationRequirements = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        requirementId: '123e4567-e89b-12d3-a456-426614174002',
        messageId: '123e4567-e89b-12d3-a456-426614174003',
        status: RequirementStatus.MET,
        value: { cdl_class: CDLClass.A, confirmed: true },
      };

      const result = buildPreviouslyCollectedValueSection(conversationRequirement);

      expect(result).toContain('Previously collected value:');
      expect(result).toContain(JSON.stringify(conversationRequirement.value));
    });

    it('should handle null value', () => {
      const conversationRequirement: SimplifiedConversationRequirements = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        requirementId: '123e4567-e89b-12d3-a456-426614174002',
        messageId: null,
        status: RequirementStatus.PENDING,
        value: null,
      };

      const result = buildPreviouslyCollectedValueSection(conversationRequirement);

      expect(result).toContain('Previously collected value: null');
    });

    it('should handle complex nested values', () => {
      const complexValue = {
        years_experience: 5,
        meets_requirement: true,
        details: {
          verified: true,
          source: 'user_response',
        },
      };

      const conversationRequirement: SimplifiedConversationRequirements = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '123e4567-e89b-12d3-a456-426614174001',
        requirementId: '123e4567-e89b-12d3-a456-426614174002',
        messageId: '123e4567-e89b-12d3-a456-426614174003',
        status: RequirementStatus.MET,
        value: complexValue,
      };

      const result = buildPreviouslyCollectedValueSection(conversationRequirement);

      expect(result).toContain(JSON.stringify(complexValue));
    });
  });
});

