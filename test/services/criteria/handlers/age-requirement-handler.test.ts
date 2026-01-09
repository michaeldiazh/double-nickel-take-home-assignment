import { handleAgeRequirement, evaluateAgeRequirement } from '../../../../src/services/criteria/handlers/age-requirement-handler';
import { AgeRequirementCriteria, AgeRequirementValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Age Requirement Handler', () => {
  describe('handleAgeRequirement', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const result = handleAgeRequirement(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const invalidValue = { invalid: 'data' } as unknown as AgeRequirementValue;
        const result = handleAgeRequirement(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of meets_requirement field', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        // Even if LLM says meets_requirement: false, we calculate our own result
        const value: AgeRequirementValue = { age: 25, meets_requirement: false };
        const result = handleAgeRequirement(criteria, value);
        // Our calculation: 25 >= 21 requirement = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when user meets minimum age', () => {
      it('should return MET when user has exactly minimum age', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const value: AgeRequirementValue = { age: 21, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user exceeds minimum age', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const value: AgeRequirementValue = { age: 30, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when user does not meet minimum age', () => {
      it('should return NOT_MET when user is below minimum age', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const value: AgeRequirementValue = { age: 18, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when user is just below minimum age', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
        const value: AgeRequirementValue = { age: 20, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when requirement is not required', () => {
      it('should still return MET when user meets requirement (required flag does not affect calculation)', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: false };
        const value: AgeRequirementValue = { age: 25, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should still return NOT_MET when user does not meet requirement (required flag does not affect calculation)', () => {
        const criteria: AgeRequirementCriteria = { min_age: 21, required: false };
        const value: AgeRequirementValue = { age: 18, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('edge cases', () => {
      it('should handle minimum age of 18', () => {
        const criteria: AgeRequirementCriteria = { min_age: 18, required: true };
        const value: AgeRequirementValue = { age: 18, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle large age values', () => {
        const criteria: AgeRequirementCriteria = { min_age: 25, required: true };
        const value: AgeRequirementValue = { age: 65, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle age exactly at boundary', () => {
        const criteria: AgeRequirementCriteria = { min_age: 25, required: true };
        const value: AgeRequirementValue = { age: 25, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle age one below boundary', () => {
        const criteria: AgeRequirementCriteria = { min_age: 25, required: true };
        const value: AgeRequirementValue = { age: 24, meets_requirement: true };
        const result = handleAgeRequirement(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });
  });

  describe('evaluateAgeRequirement', () => {
    it('should call handleAgeRequirement with valid criteria', () => {
      const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
      const value: AgeRequirementValue = { age: 25, meets_requirement: true };
      const result = evaluateAgeRequirement(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: AgeRequirementValue = { age: 25, meets_requirement: true };
      expect(() => evaluateAgeRequirement(invalidCriteria, value)).toThrow('Invalid age requirement criteria');
    });

    it('should handle null value', () => {
      const criteria: AgeRequirementCriteria = { min_age: 21, required: true };
      const result = evaluateAgeRequirement(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

