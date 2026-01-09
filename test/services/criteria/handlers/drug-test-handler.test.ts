import { handleDrugTest, evaluateDrugTest } from '../../../../src/services/criteria/handlers/drug-test-handler';
import { DrugTestCriteria, DrugTestValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Drug Test Handler', () => {
  describe('handleDrugTest', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        const result = handleDrugTest(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        const invalidValue = { invalid: 'data' } as unknown as DrugTestValue;
        const result = handleDrugTest(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of confirmed field', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        // Even if LLM says confirmed: false, we calculate our own result
        const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: false };
        const result = handleDrugTest(criteria, value);
        // Our calculation: user agrees and criteria requires it = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when only pre-employment is required', () => {
      it('should return MET when user agrees to pre-employment drug test', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not agree to pre-employment drug test', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when only random testing is required', () => {
      it('should return MET when user agrees to random testing', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, agrees_to_random_testing: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not agree to random testing', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, agrees_to_random_testing: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when user does not provide random testing agreement', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when both pre-employment and random testing are required', () => {
      it('should return MET when user agrees to both', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: true, agrees_to_random_testing: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not agree to pre-employment', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, agrees_to_random_testing: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when user does not agree to random testing', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: true, agrees_to_random_testing: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when user does not agree to either', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, random_testing: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, agrees_to_random_testing: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when neither is required', () => {
      it('should return MET when criteria does not require any drug tests', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, required: false };
        const value: DrugTestValue = { agrees_to_pre_employment: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET even if user agrees when not required', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, required: false };
        const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when required flag is set but tests are not required', () => {
      it('should return MET when pre_employment is false', () => {
        const criteria: DrugTestCriteria = { pre_employment: false, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('edge cases', () => {
      it('should handle when random_testing is not in criteria', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: true, agrees_to_random_testing: false, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle when random_testing is not in value but not required', () => {
        const criteria: DrugTestCriteria = { pre_employment: true, random_testing: false, required: true };
        const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: true };
        const result = handleDrugTest(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateDrugTest', () => {
    it('should call handleDrugTest with valid criteria', () => {
      const criteria: DrugTestCriteria = { pre_employment: true, required: true };
      const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: true };
      const result = evaluateDrugTest(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: DrugTestValue = { agrees_to_pre_employment: true, confirmed: true };
      expect(() => evaluateDrugTest(invalidCriteria, value)).toThrow('Invalid drug test criteria');
    });

    it('should handle null value', () => {
      const criteria: DrugTestCriteria = { pre_employment: true, required: true };
      const result = evaluateDrugTest(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

