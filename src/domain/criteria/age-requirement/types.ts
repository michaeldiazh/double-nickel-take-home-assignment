import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for AGE_REQUIREMENT requirement type.
 * Used in job_requirements.criteria column.
 */
export const ageRequirementCriteriaSchema = requiredCriteriaSchema.extend({
  min_age: z.number().int().positive().min(18),
});

export type AgeRequirementCriteria = z.infer<typeof ageRequirementCriteriaSchema>;

/**
 * Value for AGE_REQUIREMENT conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const ageRequirementValueSchema = z.object({
  age: z.number().int().min(18),
  meets_requirement: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type AgeRequirementValue = z.infer<typeof ageRequirementValueSchema>;

/**
 * Type guard for AGE_REQUIREMENT criteria
 */
export const isAgeRequirementCriteria = (criteria: unknown): criteria is AgeRequirementCriteria => {
  return ageRequirementCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for AGE_REQUIREMENT value
 */
export const isAgeRequirementValue = (value: unknown): value is AgeRequirementValue => {
  return ageRequirementValueSchema.safeParse(value).success;
};
