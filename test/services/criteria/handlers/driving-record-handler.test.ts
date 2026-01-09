import { handleDrivingRecord, evaluateDrivingRecord } from '../../../../src/services/criteria/handlers/driving-record-handler';
import { DrivingRecordCriteria, DrivingRecordValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Driving Record Handler', () => {
  describe('handleDrivingRecord', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const result = handleDrivingRecord(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const invalidValue = { invalid: 'data' } as unknown as DrivingRecordValue;
        const result = handleDrivingRecord(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of clean_record field', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        // Even if LLM says clean_record: false, we calculate our own result
        const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: false };
        const result = handleDrivingRecord(criteria, value);
        // Our calculation: 1 violation <= 2 max, 0 accidents <= 1 max = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when both violations and accidents are within limits', () => {
      it('should return MET when violations and accidents are exactly at limits', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 2, accidents: 1, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when violations and accidents are below limits', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when both are zero (perfect record)', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 0, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when violations exceed limit', () => {
      it('should return NOT_MET when violations exceed max_violations', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 3, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when violations exceed limit even if accidents are within limit', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 3, accidents: 1, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when accidents exceed limit', () => {
      it('should return NOT_MET when accidents exceed max_accidents', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 0, accidents: 2, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when accidents exceed limit even if violations are within limit', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 2, accidents: 2, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when both violations and accidents exceed limits', () => {
      it('should return NOT_MET when both exceed their respective limits', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
        const value: DrivingRecordValue = { violations: 5, accidents: 3, clean_record: false };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when requirement is not required', () => {
      it('should still return MET when within limits (required flag does not affect calculation)', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: false };
        const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should still return NOT_MET when exceeding limits (required flag does not affect calculation)', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: false };
        const value: DrivingRecordValue = { violations: 3, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('edge cases', () => {
      it('should handle zero limits (no violations or accidents allowed)', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 0, max_accidents: 0, required: true };
        const value: DrivingRecordValue = { violations: 0, accidents: 0, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when limits are zero but user has violations', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 0, max_accidents: 0, required: true };
        const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: false };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return NOT_MET when limits are zero but user has accidents', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 0, max_accidents: 0, required: true };
        const value: DrivingRecordValue = { violations: 0, accidents: 1, clean_record: false };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should handle large numbers', () => {
        const criteria: DrivingRecordCriteria = { max_violations: 10, max_accidents: 5, required: true };
        const value: DrivingRecordValue = { violations: 10, accidents: 5, clean_record: true };
        const result = handleDrivingRecord(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateDrivingRecord', () => {
    it('should call handleDrivingRecord with valid criteria', () => {
      const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
      const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: true };
      const result = evaluateDrivingRecord(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: DrivingRecordValue = { violations: 1, accidents: 0, clean_record: true };
      expect(() => evaluateDrivingRecord(invalidCriteria, value)).toThrow('Invalid driving record criteria');
    });

    it('should handle null value', () => {
      const criteria: DrivingRecordCriteria = { max_violations: 2, max_accidents: 1, required: true };
      const result = evaluateDrivingRecord(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

