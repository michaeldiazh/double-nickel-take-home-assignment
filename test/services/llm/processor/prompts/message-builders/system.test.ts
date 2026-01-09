import {
  buildSystemPromptMessage,
  buildSystemPromptWithRequirementMessage,
  buildSystemMessageWithRequirement,
} from '../../../../../../src/services/llm/processor/prompts/message-builders/system';
import { MessageRole } from '../../../../../../src/services/llm/client/types';
import { JobRequirementWithType } from '../../../../../../src/services/criteria/types';
import { CDLClassCriteria, CDLClass } from '../../../../../../src/services/criteria/criteria-types';

describe('System Message Builders', () => {
  describe('buildSystemPromptMessage', () => {
    it('should build a system prompt with job title', () => {
      const jobTitle = 'Long Haul Truck Driver';
      const result = buildSystemPromptMessage(jobTitle);
      
      expect(result).toContain('Happy Hauler Trucking Co');
      expect(result).toContain(jobTitle);
      expect(result).toContain('recruitment assistant');
      expect(result).toContain('friendly, professional, and conversational');
    });

    it('should include company name in guidelines', () => {
      const result = buildSystemPromptMessage('Driver');
      expect(result).toContain('Happy Hauler Trucking Co');
    });
  });

  describe('buildSystemPromptWithRequirementMessage', () => {
    it('should build a system prompt with requirement context', () => {
      const jobTitle = 'Long Haul Truck Driver';
      const requirementDescription = 'CDL Class';
      const requirementStatus = 'required';
      const requirementType = 'CDL_CLASS';
      const criteria = { cdl_class: CDLClass.A, required: true };

      const result = buildSystemPromptWithRequirementMessage(
        jobTitle,
        requirementDescription,
        requirementStatus,
        requirementType,
        criteria
      );

      expect(result).toContain('Happy Hauler Trucking Co');
      expect(result).toContain(jobTitle);
      expect(result).toContain(requirementDescription);
      expect(result).toContain(requirementStatus);
      expect(result).toContain(requirementType);
      expect(result).toContain(JSON.stringify(criteria));
    });

    it('should handle preferred requirements', () => {
      const result = buildSystemPromptWithRequirementMessage(
        'Driver',
        'Years of Experience',
        'preferred',
        'YEARS_EXPERIENCE',
        { min_years: 2, preferred: true }
      );

      expect(result).toContain('preferred');
    });
  });

  describe('buildSystemMessageWithRequirement', () => {
    const createMockRequirement = (
      requirementType: string,
      requirementDescription: string,
      criteria: unknown,
      priority: number = 1
    ): JobRequirementWithType => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      jobId: '123e4567-e89b-12d3-a456-426614174001',
      requirementTypeId: '123e4567-e89b-12d3-a456-426614174002',
      priority,
      criteria: criteria as Record<string, unknown>,
      requirementType: {
        requirementType,
        requirementDescription,
      },
    });

    it('should build a system ChatMessage with required requirement', () => {
      const jobTitle = 'Long Haul Truck Driver';
      const requirement = createMockRequirement(
        'CDL_CLASS',
        'CDL Class',
        { cdl_class: CDLClass.A, required: true } as CDLClassCriteria
      );

      const result = buildSystemMessageWithRequirement(jobTitle, requirement);

      expect(result.role).toBe(MessageRole.SYSTEM);
      expect(result.content).toContain('Happy Hauler Trucking Co');
      expect(result.content).toContain(jobTitle);
      expect(result.content).toContain('CDL Class');
      expect(result.content).toContain('required');
      expect(result.content).toContain('CDL_CLASS');
    });

    it('should build a system ChatMessage with preferred requirement', () => {
      const jobTitle = 'Driver';
      const requirement = createMockRequirement(
        'YEARS_EXPERIENCE',
        'Years of Experience',
        { min_years: 2, preferred: true, required: false }
      );

      const result = buildSystemMessageWithRequirement(jobTitle, requirement);

      expect(result.role).toBe(MessageRole.SYSTEM);
      expect(result.content).toContain('preferred');
      expect(result.content).toContain('Years of Experience');
    });

    it('should use requirementDescription from requirementType', () => {
      const requirement = createMockRequirement(
        'DRIVING_RECORD',
        'Driving Record History',
        { max_violations: 2, max_accidents: 1, required: true }
      );

      const result = buildSystemMessageWithRequirement('Driver', requirement);

      expect(result.content).toContain('Driving Record History');
    });

    it('should fallback to formatted requirementType if description is missing', () => {
      const requirement = createMockRequirement(
        'CDL_CLASS',
        '', // Empty description should trigger fallback
        { cdl_class: CDLClass.A, required: true } as CDLClassCriteria
      );

      const result = buildSystemMessageWithRequirement('Driver', requirement);

      // Fallback should convert CDL_CLASS to "cdl class"
      expect(result.content).toContain('cdl class');
    });
  });
});

