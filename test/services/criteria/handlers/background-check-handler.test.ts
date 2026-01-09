import { handleBackgroundCheck, evaluateBackgroundCheck } from '../../../../src/services/criteria/handlers/background-check-handler';
import { BackgroundCheckCriteria, BackgroundCheckValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Background Check Handler', () => {
  describe('handleBackgroundCheck', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: BackgroundCheckCriteria = { required: true };
        const result = handleBackgroundCheck(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: BackgroundCheckCriteria = { required: true };
        const invalidValue = { invalid: 'data' } as unknown as BackgroundCheckValue;
        const result = handleBackgroundCheck(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of confirmed field', () => {
        const criteria: BackgroundCheckCriteria = { required: true };
        // Even if LLM says confirmed: false, we calculate our own result
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: false };
        const result = handleBackgroundCheck(criteria, value);
        // Our calculation: user agrees and criteria requires it = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when background check is required', () => {
      it('should return MET when user agrees to background check', () => {
        const criteria: BackgroundCheckCriteria = { required: true };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not agree to background check', () => {
        const criteria: BackgroundCheckCriteria = { required: true };
        const value: BackgroundCheckValue = { agrees_to_background_check: false, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when background check is not required', () => {
      it('should return MET when user agrees to background check', () => {
        const criteria: BackgroundCheckCriteria = { required: false };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user does not agree to background check (not required)', () => {
        const criteria: BackgroundCheckCriteria = { required: false };
        const value: BackgroundCheckValue = { agrees_to_background_check: false, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when criteria has optional fields', () => {
      it('should return MET when user agrees and criteria has criminal_check', () => {
        const criteria: BackgroundCheckCriteria = { required: true, criminal_check: true };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user agrees and criteria has employment_verification', () => {
        const criteria: BackgroundCheckCriteria = { required: true, employment_verification: true };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user agrees and criteria has education_verification', () => {
        const criteria: BackgroundCheckCriteria = { required: true, education_verification: true };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user agrees and criteria has all optional fields', () => {
        const criteria: BackgroundCheckCriteria = {
          required: true,
          criminal_check: true,
          employment_verification: true,
          education_verification: true,
        };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not agree even with optional fields', () => {
        const criteria: BackgroundCheckCriteria = {
          required: true,
          criminal_check: true,
          employment_verification: true,
        };
        const value: BackgroundCheckValue = { agrees_to_background_check: false, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('edge cases', () => {
      it('should handle when user agrees but required is false', () => {
        const criteria: BackgroundCheckCriteria = { required: false };
        const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle when user does not agree and required is false', () => {
        const criteria: BackgroundCheckCriteria = { required: false };
        const value: BackgroundCheckValue = { agrees_to_background_check: false, confirmed: false };
        const result = handleBackgroundCheck(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateBackgroundCheck', () => {
    it('should call handleBackgroundCheck with valid criteria', () => {
      const criteria: BackgroundCheckCriteria = { required: true };
      const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
      const result = evaluateBackgroundCheck(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: BackgroundCheckValue = { agrees_to_background_check: true, confirmed: true };
      expect(() => evaluateBackgroundCheck(invalidCriteria, value)).toThrow('Invalid background check criteria');
    });

    it('should handle null value', () => {
      const criteria: BackgroundCheckCriteria = { required: true };
      const result = evaluateBackgroundCheck(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

