import {
  // Enums
  JobRequirementType,
  CDLClass,
  // Criteria schemas
  cdlClassCriteriaSchema,
  yearsExperienceCriteriaSchema,
  drivingRecordCriteriaSchema,
  endorsementsCriteriaSchema,
  ageRequirementCriteriaSchema,
  physicalExamCriteriaSchema,
  drugTestCriteriaSchema,
  // Value schemas
  cdlClassValueSchema,
  yearsExperienceValueSchema,
  drivingRecordValueSchema,
  endorsementsValueSchema,
  // Type guards
  isCDLClassCriteria,
  isYearsExperienceCriteria,
  isDrivingRecordCriteria,
  isEndorsementsCriteria,
  isAgeRequirementCriteria,
  isPhysicalExamCriteria,
  isDrugTestCriteria,
  isCDLClassValue,
  isYearsExperienceValue,
  isDrivingRecordValue,
  isEndorsementsValue,
} from '../../../src/services/criteria/criteria-types';

describe('Criteria Types', () => {
  describe('CDLClassCriteria', () => {
    it('should validate valid CDL class criteria', () => {
      const valid = { cdl_class: CDLClass.A, required: true };
      const result = cdlClassCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(valid);
      }
    });

    it('should validate all CDL classes', () => {
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: CDLClass.A, required: true }).success).toBe(true);
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: CDLClass.B, required: true }).success).toBe(true);
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: CDLClass.C, required: true }).success).toBe(true);
    });

    it('should reject invalid CDL class', () => {
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: 'D', required: true }).success).toBe(false);
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: 'invalid', required: true }).success).toBe(false);
    });

    it('should reject missing required field', () => {
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: CDLClass.A }).success).toBe(false);
      expect(cdlClassCriteriaSchema.safeParse({ required: true }).success).toBe(false);
    });

    it('should reject invalid types', () => {
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: 123, required: true }).success).toBe(false);
      expect(cdlClassCriteriaSchema.safeParse({ cdl_class: CDLClass.A, required: 'true' }).success).toBe(false);
    });
  });

  describe('YearsExperienceCriteria', () => {
    it('should validate with required flag', () => {
      const valid = { min_years: 2, required: true };
      const result = yearsExperienceCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with preferred flag', () => {
      const valid = { min_years: 1, preferred: true };
      const result = yearsExperienceCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with both flags', () => {
      const valid = { min_years: 3, required: true, preferred: false };
      const result = yearsExperienceCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with neither flag (optional)', () => {
      const valid = { min_years: 2 };
      const result = yearsExperienceCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative years', () => {
      expect(yearsExperienceCriteriaSchema.safeParse({ min_years: -1 }).success).toBe(false);
      expect(yearsExperienceCriteriaSchema.safeParse({ min_years: 0 }).success).toBe(false);
    });

    it('should reject non-integer years', () => {
      expect(yearsExperienceCriteriaSchema.safeParse({ min_years: 2.5 }).success).toBe(false);
    });

    it('should reject missing min_years', () => {
      expect(yearsExperienceCriteriaSchema.safeParse({ required: true }).success).toBe(false);
    });
  });

  describe('DrivingRecordCriteria', () => {
    it('should validate valid driving record criteria', () => {
      const valid = { max_violations: 0, max_accidents: 0, required: true };
      const result = drivingRecordCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with non-zero values', () => {
      const valid = { max_violations: 2, max_accidents: 1, required: true };
      const result = drivingRecordCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      expect(drivingRecordCriteriaSchema.safeParse({ max_violations: -1, max_accidents: 0, required: true }).success).toBe(false);
      expect(drivingRecordCriteriaSchema.safeParse({ max_violations: 0, max_accidents: -1, required: true }).success).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(drivingRecordCriteriaSchema.safeParse({ max_violations: 1.5, max_accidents: 0, required: true }).success).toBe(false);
    });

    it('should reject missing required field', () => {
      expect(drivingRecordCriteriaSchema.safeParse({ max_violations: 0, max_accidents: 0 }).success).toBe(false);
    });
  });

  describe('EndorsementsCriteria', () => {
    it('should validate with boolean values', () => {
      const valid = { hazmat: true, tanker: false, required: false };
      const result = endorsementsCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with "preferred" string values', () => {
      const valid = { hazmat: 'preferred', tanker: 'preferred', required: false };
      const result = endorsementsCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with mixed boolean and preferred', () => {
      const valid = { hazmat: true, tanker: 'preferred', doubles_triples: false };
      const result = endorsementsCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with all fields optional', () => {
      const valid = {};
      const result = endorsementsCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid string values', () => {
      expect(endorsementsCriteriaSchema.safeParse({ hazmat: 'invalid' }).success).toBe(false);
      expect(endorsementsCriteriaSchema.safeParse({ hazmat: 'required' }).success).toBe(false);
    });
  });

  describe('AgeRequirementCriteria', () => {
    it('should validate valid age requirement', () => {
      const valid = { min_age: 21, required: true };
      const result = ageRequirementCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate minimum age of 18', () => {
      const valid = { min_age: 18, required: true };
      const result = ageRequirementCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject age below 18', () => {
      expect(ageRequirementCriteriaSchema.safeParse({ min_age: 17, required: true }).success).toBe(false);
      expect(ageRequirementCriteriaSchema.safeParse({ min_age: 0, required: true }).success).toBe(false);
    });

    it('should reject non-integer age', () => {
      expect(ageRequirementCriteriaSchema.safeParse({ min_age: 21.5, required: true }).success).toBe(false);
    });

    it('should reject missing required field', () => {
      expect(ageRequirementCriteriaSchema.safeParse({ min_age: 21 }).success).toBe(false);
    });
  });

  describe('PhysicalExamCriteria', () => {
    it('should validate valid physical exam criteria', () => {
      const valid = { current_dot_physical: true, required: true };
      const result = physicalExamCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with false physical exam', () => {
      const valid = { current_dot_physical: false, required: true };
      const result = physicalExamCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      expect(physicalExamCriteriaSchema.safeParse({ current_dot_physical: true }).success).toBe(false);
      expect(physicalExamCriteriaSchema.safeParse({ required: true }).success).toBe(false);
    });
  });

  describe('DrugTestCriteria', () => {
    it('should validate with all fields', () => {
      const valid = { pre_employment: true, random_testing: true, required: true };
      const result = drugTestCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate without random_testing (optional)', () => {
      const valid = { pre_employment: true, required: true };
      const result = drugTestCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with random_testing false', () => {
      const valid = { pre_employment: true, random_testing: false, required: true };
      const result = drugTestCriteriaSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      expect(drugTestCriteriaSchema.safeParse({ pre_employment: true }).success).toBe(false);
      expect(drugTestCriteriaSchema.safeParse({ required: true }).success).toBe(false);
    });
  });
});

describe('Conversation Requirement Values', () => {
  describe('CDLClassValue', () => {
    it('should validate valid CDL class value', () => {
      const valid = { cdl_class: CDLClass.A, confirmed: true };
      const result = cdlClassValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate all CDL classes', () => {
      expect(cdlClassValueSchema.safeParse({ cdl_class: CDLClass.A, confirmed: true }).success).toBe(true);
      expect(cdlClassValueSchema.safeParse({ cdl_class: CDLClass.B, confirmed: true }).success).toBe(true);
      expect(cdlClassValueSchema.safeParse({ cdl_class: CDLClass.C, confirmed: true }).success).toBe(true);
    });

    it('should validate with confirmed false', () => {
      const valid = { cdl_class: CDLClass.A, confirmed: false };
      const result = cdlClassValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CDL class', () => {
      expect(cdlClassValueSchema.safeParse({ cdl_class: 'D', confirmed: true }).success).toBe(false);
    });

    it('should reject missing fields', () => {
      expect(cdlClassValueSchema.safeParse({ cdl_class: CDLClass.A }).success).toBe(false);
      expect(cdlClassValueSchema.safeParse({ confirmed: true }).success).toBe(false);
    });
  });

  describe('YearsExperienceValue', () => {
    it('should validate with all fields', () => {
      const valid = { years_experience: 3, meets_requirement: true, exceeds_requirement: true };
      const result = yearsExperienceValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate without exceeds_requirement (optional)', () => {
      const valid = { years_experience: 2, meets_requirement: true };
      const result = yearsExperienceValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with zero years', () => {
      const valid = { years_experience: 0, meets_requirement: false };
      const result = yearsExperienceValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative years', () => {
      expect(yearsExperienceValueSchema.safeParse({ years_experience: -1, meets_requirement: true }).success).toBe(false);
    });

    it('should reject non-integer years', () => {
      expect(yearsExperienceValueSchema.safeParse({ years_experience: 2.5, meets_requirement: true }).success).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(yearsExperienceValueSchema.safeParse({ years_experience: 3 }).success).toBe(false);
      expect(yearsExperienceValueSchema.safeParse({ meets_requirement: true }).success).toBe(false);
    });
  });

  describe('DrivingRecordValue', () => {
    it('should validate valid driving record value', () => {
      const valid = { violations: 0, accidents: 0, clean_record: true };
      const result = drivingRecordValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with non-zero values', () => {
      const valid = { violations: 2, accidents: 1, clean_record: false };
      const result = drivingRecordValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      expect(drivingRecordValueSchema.safeParse({ violations: -1, accidents: 0, clean_record: true }).success).toBe(false);
      expect(drivingRecordValueSchema.safeParse({ violations: 0, accidents: -1, clean_record: true }).success).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(drivingRecordValueSchema.safeParse({ violations: 1.5, accidents: 0, clean_record: true }).success).toBe(false);
    });

    it('should reject missing fields', () => {
      expect(drivingRecordValueSchema.safeParse({ violations: 0, accidents: 0 }).success).toBe(false);
      expect(drivingRecordValueSchema.safeParse({ clean_record: true }).success).toBe(false);
    });
  });

  describe('EndorsementsValue', () => {
    it('should validate with all fields', () => {
      const valid = { hazmat: true, tanker: true, doubles_triples: true, endorsements_confirmed: true };
      const result = endorsementsValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with some optional fields missing', () => {
      const valid = { hazmat: true, endorsements_confirmed: true };
      const result = endorsementsValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields missing', () => {
      const valid = { endorsements_confirmed: true };
      const result = endorsementsValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate with false values', () => {
      const valid = { hazmat: false, tanker: false, doubles_triples: false, endorsements_confirmed: true };
      const result = endorsementsValueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject missing endorsements_confirmed', () => {
      expect(endorsementsValueSchema.safeParse({ hazmat: true }).success).toBe(false);
    });
  });
});

describe('Type Guards', () => {
  describe('Criteria Type Guards', () => {
    it('isCDLClassCriteria should correctly identify CDL class criteria', () => {
      expect(isCDLClassCriteria({ cdl_class: CDLClass.A, required: true })).toBe(true);
      expect(isCDLClassCriteria({ cdl_class: 'invalid', required: true })).toBe(false);
      expect(isCDLClassCriteria({ min_years: 2, required: true })).toBe(false);
      expect(isCDLClassCriteria(null)).toBe(false);
      expect(isCDLClassCriteria(undefined)).toBe(false);
    });

    it('isYearsExperienceCriteria should correctly identify years experience criteria', () => {
      expect(isYearsExperienceCriteria({ min_years: 2, required: true })).toBe(true);
      expect(isYearsExperienceCriteria({ min_years: 1, preferred: true })).toBe(true);
      expect(isYearsExperienceCriteria({ min_years: -1 })).toBe(false);
      expect(isYearsExperienceCriteria({ cdl_class: CDLClass.A, required: true })).toBe(false);
    });

    it('isDrivingRecordCriteria should correctly identify driving record criteria', () => {
      expect(isDrivingRecordCriteria({ max_violations: 0, max_accidents: 0, required: true })).toBe(true);
      expect(isDrivingRecordCriteria({ max_violations: 2, max_accidents: 1, required: true })).toBe(true);
      expect(isDrivingRecordCriteria({ max_violations: -1, max_accidents: 0, required: true })).toBe(false);
      expect(isDrivingRecordCriteria({ min_years: 2 })).toBe(false);
    });

    it('isEndorsementsCriteria should correctly identify endorsements criteria', () => {
      expect(isEndorsementsCriteria({ hazmat: true, required: false })).toBe(true);
      expect(isEndorsementsCriteria({ hazmat: 'preferred', tanker: true })).toBe(true);
      expect(isEndorsementsCriteria({})).toBe(true);
      expect(isEndorsementsCriteria({ hazmat: 'invalid' })).toBe(false);
    });

    it('isAgeRequirementCriteria should correctly identify age requirement criteria', () => {
      expect(isAgeRequirementCriteria({ min_age: 21, required: true })).toBe(true);
      expect(isAgeRequirementCriteria({ min_age: 18, required: true })).toBe(true);
      expect(isAgeRequirementCriteria({ min_age: 17, required: true })).toBe(false);
      expect(isAgeRequirementCriteria({ min_age: 21 })).toBe(false);
    });

    it('isPhysicalExamCriteria should correctly identify physical exam criteria', () => {
      expect(isPhysicalExamCriteria({ current_dot_physical: true, required: true })).toBe(true);
      expect(isPhysicalExamCriteria({ current_dot_physical: false, required: true })).toBe(true);
      expect(isPhysicalExamCriteria({ current_dot_physical: true })).toBe(false);
    });

    it('isDrugTestCriteria should correctly identify drug test criteria', () => {
      expect(isDrugTestCriteria({ pre_employment: true, required: true })).toBe(true);
      expect(isDrugTestCriteria({ pre_employment: true, random_testing: true, required: true })).toBe(true);
      expect(isDrugTestCriteria({ pre_employment: true })).toBe(false);
    });
  });

  describe('Value Type Guards', () => {
    it('isCDLClassValue should correctly identify CDL class value', () => {
      expect(isCDLClassValue({ cdl_class: CDLClass.A, confirmed: true })).toBe(true);
      expect(isCDLClassValue({ cdl_class: CDLClass.B, confirmed: false })).toBe(true);
      expect(isCDLClassValue({ cdl_class: 'invalid', confirmed: true })).toBe(false);
      expect(isCDLClassValue({ cdl_class: CDLClass.A })).toBe(false);
    });

    it('isYearsExperienceValue should correctly identify years experience value', () => {
      expect(isYearsExperienceValue({ years_experience: 3, meets_requirement: true })).toBe(true);
      expect(isYearsExperienceValue({ years_experience: 2, meets_requirement: true, exceeds_requirement: true })).toBe(true);
      expect(isYearsExperienceValue({ years_experience: -1, meets_requirement: true })).toBe(false);
      expect(isYearsExperienceValue({ years_experience: 3 })).toBe(false);
    });

    it('isDrivingRecordValue should correctly identify driving record value', () => {
      expect(isDrivingRecordValue({ violations: 0, accidents: 0, clean_record: true })).toBe(true);
      expect(isDrivingRecordValue({ violations: 2, accidents: 1, clean_record: false })).toBe(true);
      expect(isDrivingRecordValue({ violations: -1, accidents: 0, clean_record: true })).toBe(false);
      expect(isDrivingRecordValue({ violations: 0, accidents: 0 })).toBe(false);
    });

    it('isEndorsementsValue should correctly identify endorsements value', () => {
      expect(isEndorsementsValue({ hazmat: true, endorsements_confirmed: true })).toBe(true);
      expect(isEndorsementsValue({ hazmat: true, tanker: true, doubles_triples: true, endorsements_confirmed: true })).toBe(true);
      expect(isEndorsementsValue({ endorsements_confirmed: true })).toBe(true);
      expect(isEndorsementsValue({ hazmat: true })).toBe(false);
    });
  });
});

