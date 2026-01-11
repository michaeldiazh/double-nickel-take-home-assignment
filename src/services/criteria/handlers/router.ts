import { ConversationRequirementValue, JobRequirementCriteria, JobRequirementType } from '../criteria-types';
import { RequirementEvaluationResult } from './types';
import { evaluateCDLClass } from './cdl-class-handler';
import { evaluateYearsExperience } from './years-experience-handler';
import { evaluateDrivingRecord } from './driving-record-handler';
import { evaluateEndorsements } from './endorsements-handler';
import { evaluateAgeRequirement } from './age-requirement-handler';
import { evaluatePhysicalExam } from './physical-exam-handler';
import { evaluateDrugTest } from './drug-test-handler';
import { evaluateBackgroundCheck } from './background-check-handler';
import { evaluateGeographicRestriction } from './geographic-restriction-handler';
import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';

/**
 * Handler function type for evaluating a requirement.
 */
type CriteriaHandlerFunction = (
  criteria: unknown,
  value: unknown
) => RequirementStatus;

/**
 * Router mapping requirement types to their evaluation handlers.
 */
type CriteriaRouter = Record<JobRequirementType, CriteriaHandlerFunction>;

const criteriaRouter: CriteriaRouter = {
  [JobRequirementType.CDL_CLASS]: evaluateCDLClass,
  [JobRequirementType.YEARS_EXPERIENCE]: evaluateYearsExperience,
  [JobRequirementType.DRIVING_RECORD]: evaluateDrivingRecord,
  [JobRequirementType.ENDORSEMENTS]: evaluateEndorsements,
  [JobRequirementType.AGE_REQUIREMENT]: evaluateAgeRequirement,
  [JobRequirementType.PHYSICAL_EXAM]: evaluatePhysicalExam,
  [JobRequirementType.DRUG_TEST]: evaluateDrugTest,
  [JobRequirementType.BACKGROUND_CHECK]: evaluateBackgroundCheck,
  [JobRequirementType.GEOGRAPHIC_RESTRICTION]: evaluateGeographicRestriction,
};

/**
 * Routes a requirement evaluation to the appropriate handler based on the requirement type.
 * 
 * @param requirementType - The type of requirement (e.g., 'CDL_CLASS', 'YEARS_EXPERIENCE')
 * @param criteria - The requirement criteria from job_requirements.criteria (JSONB)
 * @param value - The user's response from conversation_requirements.value (JSONB, can be null)
 * @returns RequirementEvaluationResult indicating if the requirement is met, not met, or pending
 * @throws Error if the requirement type is not supported or criteria is invalid
 */
export const evaluateRequirement = (
  requirementType: JobRequirementType,
  criteria: JobRequirementCriteria,
  value: ConversationRequirementValue
): RequirementStatus => {
  const handler = criteriaRouter[requirementType];
  if (!handler) {
    throw new Error(`Unsupported requirement type: ${requirementType}`);
  }
  return handler(criteria, value);
};

