import { handleEndorsements, evaluateEndorsements } from '../../../../src/services/criteria/handlers/endorsements-handler';
import { EndorsementsCriteria, EndorsementsValue } from '../../../../src/services/criteria/criteria-types';
import { RequirementEvaluationResult } from '../../../../src/services/criteria/handlers/types';

describe('Endorsements Handler', () => {
  describe('handleEndorsements', () => {
    describe('when value is null (not answered)', () => {
      it('should return PENDING', () => {
        const criteria: EndorsementsCriteria = { hazmat: true };
        const result = handleEndorsements(criteria, null);
        expect(result).toBe(RequirementEvaluationResult.PENDING);
      });
    });

    describe('when value is invalid', () => {
      it('should return NOT_MET for invalid value structure', () => {
        const criteria: EndorsementsCriteria = { hazmat: true };
        const invalidValue = { invalid: 'data' } as unknown as EndorsementsValue;
        const result = handleEndorsements(criteria, invalidValue);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('when user value is missing (undefined)', () => {
      it('should return MET when endorsement is preferred', () => {
        const criteria: EndorsementsCriteria = { hazmat: 'preferred' };
        const value: EndorsementsValue = { hazmat: undefined, endorsements_confirmed: true };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when endorsement is not needed (false)', () => {
        const criteria: EndorsementsCriteria = { hazmat: false };
        const value: EndorsementsValue = { hazmat: undefined, endorsements_confirmed: true };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when endorsement is required (true)', () => {
        const criteria: EndorsementsCriteria = { hazmat: true };
        const value: EndorsementsValue = { hazmat: undefined, endorsements_confirmed: true };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return MET when criteria value is undefined', () => {
        const criteria: EndorsementsCriteria = {};
        const value: EndorsementsValue = { hazmat: undefined, endorsements_confirmed: true };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });

    describe('when user value is provided', () => {
      describe('required endorsement (true)', () => {
        it('should return MET when user has the endorsement', () => {
          const criteria: EndorsementsCriteria = { hazmat: true };
          const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });

        it('should return NOT_MET when user does not have the endorsement', () => {
          const criteria: EndorsementsCriteria = { hazmat: true };
          const value: EndorsementsValue = { hazmat: false, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.NOT_MET);
        });
      });

      describe('preferred endorsement', () => {
        it('should return MET when user has the endorsement', () => {
          const criteria: EndorsementsCriteria = { hazmat: 'preferred' };
          const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });

        it('should return MET when user does not have the endorsement (preferred is not blocking)', () => {
          const criteria: EndorsementsCriteria = { hazmat: 'preferred' };
          const value: EndorsementsValue = { hazmat: false, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });
      });

      describe('not needed endorsement (false)', () => {
        it('should return MET when user has the endorsement', () => {
          const criteria: EndorsementsCriteria = { hazmat: false };
          const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });

        it('should return MET when user does not have the endorsement', () => {
          const criteria: EndorsementsCriteria = { hazmat: false };
          const value: EndorsementsValue = { hazmat: false, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });
      });

      describe('criteria value is undefined', () => {
        it('should return MET regardless of user value', () => {
          const criteria: EndorsementsCriteria = {};
          const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
          const result = handleEndorsements(criteria, value);
          expect(result).toBe(RequirementEvaluationResult.MET);
        });
      });
    });

    describe('multiple endorsements', () => {
      it('should return MET when all required endorsements are met', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: true,
          doubles_triples: true,
        };
        const value: EndorsementsValue = {
          hazmat: true,
          tanker: true,
          doubles_triples: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when one required endorsement is not met', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: true,
          doubles_triples: true,
        };
        const value: EndorsementsValue = {
          hazmat: true,
          tanker: false,
          doubles_triples: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return MET when all are preferred and user has none', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: 'preferred',
          tanker: 'preferred',
          doubles_triples: 'preferred',
        };
        const value: EndorsementsValue = {
          hazmat: false,
          tanker: false,
          doubles_triples: false,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return MET when mix of required, preferred, and not needed', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: 'preferred',
          doubles_triples: false,
        };
        const value: EndorsementsValue = {
          hazmat: true,
          tanker: false,
          doubles_triples: false,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when required endorsement is missing but others are met', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: 'preferred',
          doubles_triples: false,
        };
        const value: EndorsementsValue = {
          hazmat: false,
          tanker: true,
          doubles_triples: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });

      it('should return MET when required endorsement is missing but user value is undefined (preferred/not needed)', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: 'preferred',
          tanker: false,
        };
        const value: EndorsementsValue = {
          hazmat: undefined,
          tanker: undefined,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should return NOT_MET when required endorsement is missing and user value is undefined', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: 'preferred',
        };
        const value: EndorsementsValue = {
          hazmat: undefined,
          tanker: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.NOT_MET);
      });
    });

    describe('edge cases', () => {
      it('should handle empty criteria', () => {
        const criteria: EndorsementsCriteria = {};
        const value: EndorsementsValue = {
          hazmat: true,
          tanker: true,
          doubles_triples: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle criteria with only one endorsement', () => {
        const criteria: EndorsementsCriteria = { hazmat: true };
        const value: EndorsementsValue = {
          hazmat: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });

      it('should handle criteria with only two endorsements', () => {
        const criteria: EndorsementsCriteria = {
          hazmat: true,
          tanker: true,
        };
        const value: EndorsementsValue = {
          hazmat: true,
          tanker: true,
          endorsements_confirmed: true,
        };
        const result = handleEndorsements(criteria, value);
        expect(result).toBe(RequirementEvaluationResult.MET);
      });
    });
  });

  describe('evaluateEndorsements', () => {
    it('should call handleEndorsements with valid criteria', () => {
      const criteria: EndorsementsCriteria = { hazmat: true };
      const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
      const result = evaluateEndorsements(criteria, value);
      expect(result).toBe(RequirementEvaluationResult.MET);
    });

    it('should throw error for invalid criteria', () => {
      // Using wrong type for hazmat (should be boolean or 'preferred', not string)
      const invalidCriteria = { hazmat: 'invalid_string' };
      const value: EndorsementsValue = { hazmat: true, endorsements_confirmed: true };
      expect(() => evaluateEndorsements(invalidCriteria, value)).toThrow('Invalid endorsements criteria');
    });

    it('should handle null value', () => {
      const criteria: EndorsementsCriteria = { hazmat: true };
      const result = evaluateEndorsements(criteria, null);
      expect(result).toBe(RequirementEvaluationResult.PENDING);
    });
  });
});

