import { z } from 'zod';
import { optionalRequiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for YEARS_EXPERIENCE requirement type.
 * Used in job_requirements.criteria column.
 */
export const yearsExperienceCriteriaSchema = optionalRequiredCriteriaSchema.extend({
  min_years: z.number().int().positive(),
  preferred: z.boolean().optional(),
});

export type YearsExperienceCriteria = z.infer<typeof yearsExperienceCriteriaSchema>;

/**
 * Value for YEARS_EXPERIENCE conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const yearsExperienceValueSchema = z.object({
  years_experience: z.number().int().min(0),
  meets_requirement: z.boolean(),
  exceeds_requirement: z.boolean().optional(),
  needs_clarification: z.boolean().optional(),
});

export type YearsExperienceValue = z.infer<typeof yearsExperienceValueSchema>;

/**
 * Type guard for YEARS_EXPERIENCE criteria
 */
export const isYearsExperienceCriteria = (criteria: unknown): criteria is YearsExperienceCriteria => {
  return yearsExperienceCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for YEARS_EXPERIENCE value
 */
export const isYearsExperienceValue = (value: unknown): value is YearsExperienceValue => {
  return yearsExperienceValueSchema.safeParse(value).success;
};
