import {
  AgeRequirementCriteria,
  ageRequirementValueSchema,
  isAgeRequirementCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's age meets the requirement criteria.
 * 
 * @param userAge - User's age
 * @param criteria - Age requirement criteria
 * @returns MET if user meets requirement, NOT_MET otherwise
 */
const meetsAgeRequirement = (
  userAge: number,
  criteria: AgeRequirementCriteria
): RequirementEvaluationResult => {
  if (userAge >= criteria.min_age) {
    return RequirementEvaluationResult.MET;
  }

  return RequirementEvaluationResult.NOT_MET;
};

/**
 * Evaluates if an age requirement is met based on the user's response.
 * 
 * @param criteria - Age requirement criteria
 * @param value - User's age response (unknown | null, validated with Zod schema)
 * @returns MET if user meets/exceeds required age, NOT_MET if they don't, PENDING if not answered
 */
export const handleAgeRequirement: CriteriaHandler<AgeRequirementCriteria> = (
  criteria,
  value
): RequirementEvaluationResult => {
  if (value === null) {
    return RequirementEvaluationResult.PENDING;
  }

  const validationResult = ageRequirementValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementEvaluationResult.NOT_MET;
  }

  return meetsAgeRequirement(validationResult.data.age, criteria);
};

/**
 * Type guard to check if criteria is age requirement criteria and route to handler.
 */
export const evaluateAgeRequirement = (
  criteria: unknown,
  value: unknown
): RequirementEvaluationResult => {
  if (!isAgeRequirementCriteria(criteria)) {
    throw new Error('Invalid age requirement criteria');
  }

  return handleAgeRequirement(criteria, value);
};

