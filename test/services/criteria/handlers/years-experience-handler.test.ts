import { handleYearsExperience, evaluateYearsExperience } from '../../../../src/services/criteria/handlers/years-experience-handler';
import { YearsExperienceCriteria, YearsExperienceValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Years Experience Handler', () => {
  describe('handleYearsExperience', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
        const result = handleYearsExperience(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
        const invalidValue = { invalid: 'data' } as unknown as YearsExperienceValue;
        const result = handleYearsExperience(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of meets_requirement field', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
        // Even if LLM says meets_requirement: false, we calculate our own result
        const value: YearsExperienceValue = { years_experience: 3, meets_requirement: false };
        const result = handleYearsExperience(criteria, value);
        // Our calculation: 3 years >= 2 years requirement = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when requirement is required', () => {
      describe('user meets minimum years', () => {
        it('should return MET when user has exactly minimum years', () => {
          const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
          const value: YearsExperienceValue = { years_experience: 2, meets_requirement: true };
          const result = handleYearsExperience(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });

        it('should return MET when user exceeds minimum years', () => {
          const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
          const value: YearsExperienceValue = { 
            years_experience: 5, 
            meets_requirement: true,
            exceeds_requirement: true 
          };
          const result = handleYearsExperience(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });
      });

      describe('user does not meet minimum years', () => {
        it('should return NOT_MET when user has less than minimum years', () => {
          const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
          const value: YearsExperienceValue = { years_experience: 1, meets_requirement: true };
          const result = handleYearsExperience(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.NOT_MET);
        });
      });
    });

    describe('when requirement is preferred (not required)', () => {
      it('should return MET when user meets preferred years', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, preferred: true };
        const value: YearsExperienceValue = { years_experience: 3, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user does not meet preferred years (preferred is not blocking)', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, preferred: true };
        const value: YearsExperienceValue = { years_experience: 1, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when requirement has both required and preferred flags', () => {
      it('should return MET when user meets requirement and both flags are set', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, required: true, preferred: false };
        const value: YearsExperienceValue = { years_experience: 3, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not meet requirement and required is true', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2, required: true, preferred: true };
        const value: YearsExperienceValue = { years_experience: 1, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when requirement has neither required nor preferred flags', () => {
      it('should return MET when user meets minimum (defaults to required behavior)', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2 };
        const value: YearsExperienceValue = { years_experience: 2, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not meet minimum (defaults to required behavior)', () => {
        const criteria: YearsExperienceCriteria = { min_years: 2 };
        const value: YearsExperienceValue = { years_experience: 1, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('edge cases', () => {
      it('should handle zero years experience', () => {
        const criteria: YearsExperienceCriteria = { min_years: 0, required: true };
        const value: YearsExperienceValue = { years_experience: 0, meets_requirement: true };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle large years of experience', () => {
        const criteria: YearsExperienceCriteria = { min_years: 5, required: true };
        const value: YearsExperienceValue = { 
          years_experience: 20, 
          meets_requirement: true,
          exceeds_requirement: true 
        };
        const result = handleYearsExperience(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateYearsExperience', () => {
    it('should call handleYearsExperience with valid criteria', () => {
      const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
      const value: YearsExperienceValue = { years_experience: 3, meets_requirement: true };
      const result = evaluateYearsExperience(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: YearsExperienceValue = { years_experience: 3, meets_requirement: true };
      expect(() => evaluateYearsExperience(invalidCriteria, value)).toThrow('Invalid years experience criteria');
    });

    it('should handle null value', () => {
      const criteria: YearsExperienceCriteria = { min_years: 2, required: true };
      const result = evaluateYearsExperience(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

