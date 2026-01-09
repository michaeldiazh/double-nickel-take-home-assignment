import { handleCDLClass, evaluateCDLClass } from '../../../../src/services/criteria/handlers/cdl-class-handler';
import { CDLClassCriteria, CDLClassValue, CDLClass } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('CDL Class Handler', () => {
  describe('handleCDLClass', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };
        const result = handleCDLClass(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };
        const invalidValue = { invalid: 'data' } as unknown as CDLClassValue;
        const result = handleCDLClass(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of confirmed field', () => {
        const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };
        // Even if LLM says confirmed: false, we calculate our own result
        const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: false };
        const result = handleCDLClass(criteria, value);
        // Our calculation: Class A meets Class A requirement = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when requirement is Class A', () => {
      const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };

      it('should return MET when user has Class A', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user has Class B', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.B, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when user has Class C', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.C, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when requirement is Class B', () => {
      const criteria: CDLClassCriteria = { cdl_class: CDLClass.B, required: true };

      it('should return MET when user has Class A (higher class)', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user has Class B', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.B, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user has Class C', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.C, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when requirement is Class C', () => {
      const criteria: CDLClassCriteria = { cdl_class: CDLClass.C, required: true };

      it('should return MET when user has Class A (higher class)', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user has Class B (higher class)', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.B, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user has Class C', () => {
        const value: CDLClassValue = { cdl_class: CDLClass.C, confirmed: true };
        const result = handleCDLClass(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateCDLClass', () => {
    it('should call handleCDLClass with valid criteria', () => {
      const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };
      const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: true };
      const result = evaluateCDLClass(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: CDLClassValue = { cdl_class: CDLClass.A, confirmed: true };
      expect(() => evaluateCDLClass(invalidCriteria, value)).toThrow('Invalid CDL class criteria');
    });

    it('should handle null value', () => {
      const criteria: CDLClassCriteria = { cdl_class: CDLClass.A, required: true };
      const result = evaluateCDLClass(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

