import { parseLLMResponse } from '../../../src/services/criteria/parser';
import { AgeRequirementValue, EndorsementsValue, CDLClassValue, DrivingRecordValue, GeographicRestrictionValue, JobRequirementType, BackgroundCheckValue } from '../../../src/services/criteria/criteria-types';

describe('Parser', () => {
  describe('parseLLMResponse', () => {
    describe('CDL_CLASS', () => {
      it('should parse JSON response with CDL class', () => {
        const content = JSON.stringify({ cdl_class: 'A', confirmed: true });
        const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ cdl_class: 'A', confirmed: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language response with CDL class', () => {
        const content = 'I have a Class A CDL license';
        const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ cdl_class: 'A', confirmed: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should return error when CDL class cannot be parsed', () => {
        const content = 'I do not have any license';
        const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);
        
        expect(result.success).toBe(false);
        expect(result.value).toBe(null);
        expect(result.needsClarification).toBe(true);
        expect(result.error).toContain('CDL class');
      });
    });

    describe('DRUG_TEST', () => {
      it('should parse JSON response with drug test agreement', () => {
        const content = JSON.stringify({
          agrees_to_pre_employment: true,
          agrees_to_random_testing: true,
          confirmed: true,
        });
        const result = parseLLMResponse(JobRequirementType.DRUG_TEST, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({
          agrees_to_pre_employment: true,
          agrees_to_random_testing: true,
          confirmed: true,
        });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language agreement', () => {
        const content = 'Yes, I agree to drug testing';
        const result = parseLLMResponse(JobRequirementType.DRUG_TEST, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({
          agrees_to_pre_employment: true,
          agrees_to_random_testing: true,
          confirmed: true,
        });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language disagreement', () => {
        const content = 'No, I do not agree';
        const result = parseLLMResponse(JobRequirementType.DRUG_TEST, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({
          agrees_to_pre_employment: false,
          agrees_to_random_testing: false,
          confirmed: true,
        });
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('YEARS_EXPERIENCE', () => {
      it('should parse JSON response with years of experience', () => {
        const content = JSON.stringify({ years_experience: 5, meets_requirement: true });
        const result = parseLLMResponse(JobRequirementType.YEARS_EXPERIENCE, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ years_experience: 5, meets_requirement: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with years of experience', () => {
        const content = 'I have 5 years of experience';
        const result = parseLLMResponse(JobRequirementType.YEARS_EXPERIENCE, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ years_experience: 5, meets_requirement: true });
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('ENDORSEMENTS', () => {
      it('should parse JSON response with endorsements', () => {
        const content = JSON.stringify({
          hazmat: true,
          tanker: false,
          endorsements_confirmed: true,
        });
        const result = parseLLMResponse(JobRequirementType.ENDORSEMENTS, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({
          hazmat: true,
          tanker: false,
          endorsements_confirmed: true,
        });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with endorsements', () => {
        const content = 'I have HAZMAT and TANKER endorsements';
        const result = parseLLMResponse<EndorsementsValue>(JobRequirementType.ENDORSEMENTS, content);
        
        expect(result.success).toBe(true);
        expect(result.value?.hazmat).toBe(true);
        expect(result.value?.tanker).toBe(true);
        expect(result.value?.endorsements_confirmed).toBe(true);
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('PHYSICAL_EXAM', () => {
      it('should parse JSON response with physical exam status', () => {
        const content = JSON.stringify({ has_current_dot_physical: true, confirmed: true });
        const result = parseLLMResponse(JobRequirementType.PHYSICAL_EXAM, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ has_current_dot_physical: true, confirmed: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with physical exam status', () => {
        const content = 'Yes, I have a current DOT physical';
        const result = parseLLMResponse(JobRequirementType.PHYSICAL_EXAM, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ has_current_dot_physical: true, confirmed: true });
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('GEOGRAPHIC_RESTRICTION', () => {
      it('should parse JSON response with location', () => {
        const content = JSON.stringify({ location: 'NY', state: 'NY', meets_requirement: true });
        const result = parseLLMResponse(JobRequirementType.GEOGRAPHIC_RESTRICTION, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ location: 'NY', state: 'NY', meets_requirement: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with state code', () => {
        const content = 'I am located in NY';
        const result = parseLLMResponse<GeographicRestrictionValue>(JobRequirementType.GEOGRAPHIC_RESTRICTION, content);
        
        expect(result.success).toBe(true);
        expect(result.value?.state).toBe('NY');
        expect(result.value?.location).toBe('NY');
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('AGE_REQUIREMENT', () => {
      it('should parse JSON response with age', () => {
        const content = JSON.stringify({ age: 25, meets_requirement: true });
        const result = parseLLMResponse(JobRequirementType.AGE_REQUIREMENT, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ age: 25, meets_requirement: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with age', () => {
        const content = 'I am 25 years old';
        const result = parseLLMResponse<AgeRequirementValue>(JobRequirementType.AGE_REQUIREMENT, content);
        
        expect(result.success).toBe(true);
        expect(result.value?.age).toBe(25);
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('DRIVING_RECORD', () => {
      it('should parse JSON response with driving record', () => {
        const content = JSON.stringify({ violations: 2, accidents: 1, clean_record: false });
        const result = parseLLMResponse(JobRequirementType.DRIVING_RECORD, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ violations: 2, accidents: 1, clean_record: false });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language with violations and accidents', () => {
        const content = 'I have 2 violations and 1 accident';
        const result = parseLLMResponse<DrivingRecordValue>(JobRequirementType.DRIVING_RECORD, content);
        
        expect(result.success).toBe(true);
        expect(result.value?.violations).toBe(2);
        expect(result.value?.accidents).toBe(1);
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('BACKGROUND_CHECK', () => {
      it('should parse JSON response with background check agreement', () => {
        const content = JSON.stringify({ agrees_to_background_check: true, confirmed: true });
        const result = parseLLMResponse(JobRequirementType.BACKGROUND_CHECK, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ agrees_to_background_check: true, confirmed: true });
        expect(result.needsClarification).toBe(false);
      });

      it('should parse natural language agreement', () => {
        const content = 'Yes, I agree to a background check';
        const result = parseLLMResponse<BackgroundCheckValue>(JobRequirementType.BACKGROUND_CHECK, content);
        
        expect(result.success).toBe(true);
        expect(result.value?.agrees_to_background_check).toBe(true);
        expect(result.needsClarification).toBe(false);
      });
    });

    describe('Unsupported requirement types', () => {
      it('should return error for unsupported requirement type', () => {
        const result = parseLLMResponse<any>('UNSUPPORTED_TYPE' as any, 'some content');
        
        expect(result.success).toBe(false);
        expect(result.value).toBe(null);
        expect(result.needsClarification).toBe(true);
        expect(result.error).toContain('Unsupported requirement type');
      });
    });

    describe('Case insensitivity', () => {
      it('should handle lowercase requirement types', () => {
        const content = JSON.stringify({ cdl_class: 'A', confirmed: true });
        const result = parseLLMResponse<CDLClassValue>(JobRequirementType.CDL_CLASS, content);
        
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ cdl_class: 'A', confirmed: true });
      });
    });
  });
});
