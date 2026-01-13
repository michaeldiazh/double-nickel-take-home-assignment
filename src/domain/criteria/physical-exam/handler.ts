import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import {
  PhysicalExamCriteria,
  physicalExamValueSchema,
  isPhysicalExamCriteria,
} from './types';

/**
 * Type for criteria handlers - evaluates if a requirement is met based on user response.
 */
export type CriteriaHandler<TCriteria> = (
  criteria: TCriteria,
  value: unknown | null
) => RequirementStatus;

/**
 * Checks if user's physical exam status meets the requirement criteria.
 * 
 * @param userHasPhysical - Whether user has current DOT physical
 * @param criteria - Physical exam requirement criteria
 * @returns MET if user meets requirement, NOT_MET otherwise
 */
const meetsPhysicalExamRequirement = (
  userHasPhysical: boolean,
  criteria: PhysicalExamCriteria
): RequirementStatus => {
  if (!criteria.current_dot_physical) {
    return RequirementStatus.MET;
  }

  if (userHasPhysical) {
    return RequirementStatus.MET;
  }

  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if a physical exam requirement is met based on the user's response.
 * 
 * @param criteria - Physical exam requirement criteria
 * @param value - User's physical exam response (unknown | null, validated with Zod schema)
 * @returns MET if user has required physical exam, NOT_MET if they don't, PENDING if not answered
 */
export const handlePhysicalExam: CriteriaHandler<PhysicalExamCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  }

  const validationResult = physicalExamValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }

  return meetsPhysicalExamRequirement(validationResult.data.has_current_dot_physical, criteria);
};

/**
 * Type guard to check if criteria is physical exam criteria and route to handler.
 */
export const evaluatePhysicalExam = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isPhysicalExamCriteria(criteria)) {
    throw new Error('Invalid physical exam criteria');
  }

  return handlePhysicalExam(criteria, value);
};
