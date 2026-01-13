/**
 * Tests for response-format module
 */

import { getResponseFormatDescription } from '../../../src/domain/criteria/response-format';
import { JobRequirementType } from '../../../src/domain/criteria';

describe('getResponseFormatDescription', () => {
  it('should return format for CDL_CLASS', () => {
    const format = getResponseFormatDescription(JobRequirementType.CDL_CLASS);
    expect(format).toContain('cdl_class');
    expect(format).toContain('confirmed');
    expect(format).toContain('assessment');
    expect(format).toContain('confidence');
    expect(format).toContain('message');
    expect(format).toContain('needs_clarification');
  });

  it('should return format for YEARS_EXPERIENCE', () => {
    const format = getResponseFormatDescription(JobRequirementType.YEARS_EXPERIENCE);
    expect(format).toContain('years_experience');
    expect(format).toContain('meets_requirement');
    expect(format).toContain('exceeds_requirement');
  });

  it('should return format for DRIVING_RECORD', () => {
    const format = getResponseFormatDescription(JobRequirementType.DRIVING_RECORD);
    expect(format).toContain('violations');
    expect(format).toContain('accidents');
    expect(format).toContain('clean_record');
  });

  it('should return format for ENDORSEMENTS', () => {
    const format = getResponseFormatDescription(JobRequirementType.ENDORSEMENTS);
    expect(format).toContain('hazmat');
    expect(format).toContain('tanker');
    expect(format).toContain('doubles_triples');
    expect(format).toContain('endorsements_confirmed');
  });

  it('should return format for AGE_REQUIREMENT', () => {
    const format = getResponseFormatDescription(JobRequirementType.AGE_REQUIREMENT);
    expect(format).toContain('age');
    expect(format).toContain('meets_requirement');
  });

  it('should return format for PHYSICAL_EXAM', () => {
    const format = getResponseFormatDescription(JobRequirementType.PHYSICAL_EXAM);
    expect(format).toContain('has_current_dot_physical');
    expect(format).toContain('confirmed');
  });

  it('should return format for DRUG_TEST', () => {
    const format = getResponseFormatDescription(JobRequirementType.DRUG_TEST);
    expect(format).toContain('agrees_to_pre_employment');
    expect(format).toContain('agrees_to_random_testing');
    expect(format).toContain('confirmed');
  });

  it('should return format for BACKGROUND_CHECK', () => {
    const format = getResponseFormatDescription(JobRequirementType.BACKGROUND_CHECK);
    expect(format).toContain('agrees_to_background_check');
    expect(format).toContain('confirmed');
  });

  it('should return format for GEOGRAPHIC_RESTRICTION', () => {
    const format = getResponseFormatDescription(JobRequirementType.GEOGRAPHIC_RESTRICTION);
    expect(format).toContain('location');
    expect(format).toContain('state');
    expect(format).toContain('meets_requirement');
  });

  it('should throw error for unsupported requirement type', () => {
    expect(() => {
      getResponseFormatDescription('UNSUPPORTED_TYPE' as any);
    }).toThrow('Unsupported requirement type');
  });

  it('should include common fields in all formats', () => {
    const format = getResponseFormatDescription(JobRequirementType.CDL_CLASS);
    expect(format).toContain('assessment');
    expect(format).toContain('confidence');
    expect(format).toContain('message');
    expect(format).toContain('needs_clarification');
  });
});
