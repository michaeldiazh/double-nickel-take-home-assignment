import {
  BackgroundCheckCriteria,
  backgroundCheckValueSchema,
  isBackgroundCheckCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's background check agreement meets the requirement criteria.
 * 
 * @param userAgreesToBackgroundCheck - Whether user agrees to background check
 * @param criteria - Background check requirement criteria
 * @returns MET if user meets requirement, NOT_MET otherwise
 */
const meetsBackgroundCheckRequirement = (
  userAgreesToBackgroundCheck: boolean,
  criteria: BackgroundCheckCriteria
): RequirementEvaluationResult => {
  if (!criteria.required) {
    return RequirementEvaluationResult.MET;
  }

  if (userAgreesToBackgroundCheck) {
    return RequirementEvaluationResult.MET;
  }

  return RequirementEvaluationResult.NOT_MET;
};

/**
 * Evaluates if a background check requirement is met based on the user's response.
 * 
 * @param criteria - Background check requirement criteria
 * @param value - User's background check response (unknown | null, validated with Zod schema)
 * @returns MET if user agrees to background check, NOT_MET if they don't, PENDING if not answered
 */
export const handleBackgroundCheck: CriteriaHandler<BackgroundCheckCriteria> = (
  criteria,
  value
): RequirementEvaluationResult => {
  if (value === null) {
    return RequirementEvaluationResult.PENDING;
  }

  const validationResult = backgroundCheckValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementEvaluationResult.NOT_MET;
  }

  return meetsBackgroundCheckRequirement(validationResult.data.agrees_to_background_check, criteria);
};

/**
 * Type guard to check if criteria is background check criteria and route to handler.
 */
export const evaluateBackgroundCheck = (
  criteria: unknown,
  value: unknown
): RequirementEvaluationResult => {
  if (!isBackgroundCheckCriteria(criteria)) {
    throw new Error('Invalid background check criteria');
  }

  return handleBackgroundCheck(criteria, value);
};

