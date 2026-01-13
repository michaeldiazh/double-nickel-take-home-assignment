import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for BACKGROUND_CHECK requirement type.
 * Used in job_requirements.criteria column.
 */
export const backgroundCheckCriteriaSchema = requiredCriteriaSchema.extend({
  // Optional: specific types of background checks
  criminal_check: z.boolean().optional(),
  employment_verification: z.boolean().optional(),
  education_verification: z.boolean().optional(),
});

export type BackgroundCheckCriteria = z.infer<typeof backgroundCheckCriteriaSchema>;

/**
 * Value for BACKGROUND_CHECK conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const backgroundCheckValueSchema = z.object({
  agrees_to_background_check: z.boolean(),
  confirmed: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type BackgroundCheckValue = z.infer<typeof backgroundCheckValueSchema>;

/**
 * Type guard for BACKGROUND_CHECK criteria
 */
export const isBackgroundCheckCriteria = (criteria: unknown): criteria is BackgroundCheckCriteria => {
  return backgroundCheckCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for BACKGROUND_CHECK value
 */
export const isBackgroundCheckValue = (value: unknown): value is BackgroundCheckValue => {
  return backgroundCheckValueSchema.safeParse(value).success;
};
