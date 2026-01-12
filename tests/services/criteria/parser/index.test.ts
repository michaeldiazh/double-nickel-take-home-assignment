/**
 * Tests for parser module
 */

import { parseLLMResponse } from '../../../../src/services/criteria/parser';
import { JobRequirementType, CDLClass } from '../../../../src/services/criteria/criteria-types';
import { RequirementStatus } from '../../../../src/entities/enums';

describe('parseLLMResponse - CDL Class with NOT_MET', () => {
  it('should correctly parse CDL class response with confirmed: false and assessment: NOT_MET', () => {
    const content = `{
    "cdl_class": "A",
    "confirmed": false,
    "assessment": "NOT_MET",
    "message": "I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!",
    "needs_clarification": false
}`;

    const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);

    expect(result.success).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.value).toMatchObject({
      cdl_class: CDLClass.A,
      confirmed: false,
      needs_clarification: false,
    });
    expect(result.assessment).toBe(RequirementStatus.NOT_MET);
    expect(result.message).toBe('I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!');
    expect(result.needsClarification).toBe(false);
  });

  it('should correctly parse CDL class response with confirmed: false and assessment: NOT_MET (minimal JSON)', () => {
    const content = `{"cdl_class":"A","confirmed":false,"assessment":"NOT_MET","message":"I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!","needs_clarification":false}`;

    const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);

    expect(result.success).toBe(true);
    expect(result.value).toBeDefined();
    expect(result.value).toMatchObject({
      cdl_class: CDLClass.A,
      confirmed: false,
    });
    expect(result.assessment).toBe(RequirementStatus.NOT_MET);
    expect(result.needsClarification).toBe(false);
  });

  it('should correctly extract message when assessment is NOT_MET', () => {
    const content = `{
    "cdl_class": "A",
    "confirmed": false,
    "assessment": "NOT_MET",
    "message": "I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!",
    "needs_clarification": false
}`;

    const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);

    expect(result.success).toBe(true);
    expect(result.message).toBe('I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!');
    expect(result.message).not.toContain('{');
    expect(result.message).not.toContain('}');
  });

  it('should correctly set needsClarification to false when needs_clarification is false', () => {
    const content = `{
    "cdl_class": "A",
    "confirmed": false,
    "assessment": "NOT_MET",
    "message": "I see you do not have a CDL Class A license. Unfortunately, this is a requirement for the position. If you obtain the license in the future, feel free to reach out again. Thank you!",
    "needs_clarification": false
}`;

    const result = parseLLMResponse(JobRequirementType.CDL_CLASS, content);

    expect(result.success).toBe(true);
    expect(result.needsClarification).toBe(false);
    expect(result.value).toBeDefined();
  });
});
