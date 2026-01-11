import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import {
  YearsExperienceCriteria,
  yearsExperienceValueSchema,
  isYearsExperienceCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's years of experience meets the requirement criteria.
 * 
 * @param userYears - User's years of experience
 * @param criteria - Years of experience requirement criteria
 * @returns MET if user meets requirement, NOT_MET otherwise
 */
const meetsYearsRequirement = (
  userYears: number,
  criteria: YearsExperienceCriteria
): RequirementStatus => {
  const meetsMinimumYears = userYears >= criteria.min_years;
  const isOnlyPreferred = criteria.preferred && !criteria.required;

  if (isOnlyPreferred || meetsMinimumYears) {
    return RequirementStatus.MET;
  }

  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if a years of experience requirement is met based on the user's response.
 * 
 * @param criteria - Years of experience requirement criteria
 * @param value - User's experience response (unknown | null, validated with Zod schema)
 * @returns MET if user meets/exceeds required years, NOT_MET if they don't, PENDING if not answered
 */
export const handleYearsExperience: CriteriaHandler<YearsExperienceCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  } 
  const validationResult = yearsExperienceValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }
  return meetsYearsRequirement(validationResult.data.years_experience, criteria);
};

/**
 * Type guard to check if criteria is years experience criteria and route to handler.
 */
export const evaluateYearsExperience = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isYearsExperienceCriteria(criteria)) {
    throw new Error('Invalid years experience criteria');
  }

  return handleYearsExperience(criteria, value);
};

