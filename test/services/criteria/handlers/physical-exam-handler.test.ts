import { handlePhysicalExam, evaluatePhysicalExam } from '../../../../src/services/criteria/handlers/physical-exam-handler';
import { PhysicalExamCriteria, PhysicalExamValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Physical Exam Handler', () => {
  describe('handlePhysicalExam', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const result = handlePhysicalExam(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const invalidValue = { invalid: 'data' } as unknown as PhysicalExamValue;
        const result = handlePhysicalExam(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of confirmed field', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        // Even if LLM says confirmed: false, we calculate our own result
        const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: false };
        const result = handlePhysicalExam(criteria, value);
        // Our calculation: user has physical and criteria requires it = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when physical exam is required', () => {
      it('should return MET when user has current DOT physical', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user does not have current DOT physical', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: false, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when physical exam is not required', () => {
      it('should return MET when user has current DOT physical', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: false, required: false };
        const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user does not have current DOT physical (not required)', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: false, required: false };
        const value: PhysicalExamValue = { has_current_dot_physical: false, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when required flag is set but current_dot_physical is false', () => {
      it('should return MET when criteria does not require physical exam', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: false, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: false, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when criteria does not require physical exam even if user has it', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: false, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('edge cases', () => {
      it('should handle when user has physical but criteria requires it', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle when user does not have physical and criteria requires it', () => {
        const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
        const value: PhysicalExamValue = { has_current_dot_physical: false, confirmed: false };
        const result = handlePhysicalExam(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });
  });

  describe('evaluatePhysicalExam', () => {
    it('should call handlePhysicalExam with valid criteria', () => {
      const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
      const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
      const result = evaluatePhysicalExam(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: PhysicalExamValue = { has_current_dot_physical: true, confirmed: true };
      expect(() => evaluatePhysicalExam(invalidCriteria, value)).toThrow('Invalid physical exam criteria');
    });

    it('should handle null value', () => {
      const criteria: PhysicalExamCriteria = { current_dot_physical: true, required: true };
      const result = evaluatePhysicalExam(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

