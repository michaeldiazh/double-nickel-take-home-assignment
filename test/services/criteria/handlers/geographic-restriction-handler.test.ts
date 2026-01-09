import { handleGeographicRestriction, evaluateGeographicRestriction } from '../../../../src/services/criteria/handlers/geographic-restriction-handler';
import { GeographicRestrictionCriteria, GeographicRestrictionValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Geographic Restriction Handler', () => {
  describe('handleGeographicRestriction', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        const result = handleGeographicRestriction(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        const invalidValue = { invalid: 'data' } as unknown as GeographicRestrictionValue;
        const result = handleGeographicRestriction(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should calculate result deterministically regardless of meets_requirement field', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        // Even if LLM says meets_requirement: false, we calculate our own result
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: false };
        const result = handleGeographicRestriction(criteria, value);
        // Our calculation: NY is in allowed_states = MET
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when restriction is not required', () => {
      it('should return MET regardless of location', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: false };
        const value: GeographicRestrictionValue = { location: 'California', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when no restrictions are specified', () => {
      it('should return MET when no allowed_states or allowed_regions', () => {
        const criteria: GeographicRestrictionCriteria = { required: true };
        const value: GeographicRestrictionValue = { location: 'Anywhere', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when allowed_states is empty array', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: [], required: true };
        const value: GeographicRestrictionValue = { location: 'Anywhere', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when allowed_regions is empty array', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_regions: [], required: true };
        const value: GeographicRestrictionValue = { location: 'Anywhere', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when user state is in allowed_states', () => {
      it('should return MET when user state matches allowed state', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ', 'PA'], required: true };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user state is in multiple allowed states', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ', 'PA'], required: true };
        const value: GeographicRestrictionValue = { location: 'Newark', state: 'NJ', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when user state is not in allowed_states', () => {
      it('should return NOT_MET when user state is not in allowed states', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        const value: GeographicRestrictionValue = { location: 'California', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when user state is in allowed_regions', () => {
      it('should return MET when user state code matches an entry in allowed_regions array', () => {
        // If the state code matches an entry in the allowed_regions array, it's a match
        const criteria: GeographicRestrictionCriteria = { allowed_regions: ['Northeast', 'NY'], required: true };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return PENDING when only region names are in allowed_regions and state code is provided', () => {
        // When criteria has only region names (not state codes), we can't definitively match
        const criteria: GeographicRestrictionCriteria = { allowed_regions: ['Northeast', 'Mid-Atlantic'], required: true };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when both allowed_states and allowed_regions are specified', () => {
      it('should return MET when user state is in allowed_states', () => {
        const criteria: GeographicRestrictionCriteria = {
          allowed_states: ['NY', 'NJ'],
          allowed_regions: ['Northeast'],
          required: true,
        };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when user state is in allowed_regions', () => {
        const criteria: GeographicRestrictionCriteria = {
          allowed_states: ['NY', 'NJ'],
          allowed_regions: ['Northeast', 'PA'],
          required: true,
        };
        const value: GeographicRestrictionValue = { location: 'Pennsylvania', state: 'PA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when user state is in neither', () => {
        const criteria: GeographicRestrictionCriteria = {
          allowed_states: ['NY', 'NJ'],
          allowed_regions: ['Northeast'],
          required: true,
        };
        const value: GeographicRestrictionValue = { location: 'California', state: 'CA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when user does not provide state', () => {
      it('should return PENDING when state is missing and restrictions exist', () => {
        // When restrictions exist but user doesn't provide state, we need more info
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        const value: GeographicRestrictionValue = { location: 'Somewhere', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });

      it('should return MET when state is missing but no restrictions', () => {
        const criteria: GeographicRestrictionCriteria = { required: true };
        const value: GeographicRestrictionValue = { location: 'Somewhere', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('edge cases', () => {
      it('should handle single allowed state', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY'], required: true };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return PENDING when only regions are specified and state code is ambiguous', () => {
        // When criteria has only regions (like "Northeast") and user provides state code (like "MA"),
        // we can't definitively determine if the state is in that region without a mapping.
        // Return PENDING so LLM can ask follow-up questions.
        const criteria: GeographicRestrictionCriteria = { allowed_regions: ['Northeast'], required: true };
        const value: GeographicRestrictionValue = { location: 'Boston', state: 'MA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });

      it('should return MET when state code matches region name exactly', () => {
        // If the state code happens to match a region name in the array, it's a match
        const criteria: GeographicRestrictionCriteria = { allowed_regions: ['MA'], required: true };
        const value: GeographicRestrictionValue = { location: 'Boston', state: 'MA', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle case sensitivity for state codes', () => {
        const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
        const value: GeographicRestrictionValue = { location: 'New York', state: 'ny', meets_requirement: true };
        const result = handleGeographicRestriction(criteria, value);
        // State codes should match exactly (case-sensitive)
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });
  });

  describe('evaluateGeographicRestriction', () => {
    it('should call handleGeographicRestriction with valid criteria', () => {
      const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
      const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
      const result = evaluateGeographicRestriction(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      const invalidCriteria = { invalid: 'data' };
      const value: GeographicRestrictionValue = { location: 'New York', state: 'NY', meets_requirement: true };
      expect(() => evaluateGeographicRestriction(invalidCriteria, value)).toThrow('Invalid geographic restriction criteria');
    });

    it('should handle null value', () => {
      const criteria: GeographicRestrictionCriteria = { allowed_states: ['NY', 'NJ'], required: true };
      const result = evaluateGeographicRestriction(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

