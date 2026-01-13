import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for PHYSICAL_EXAM requirement type.
 * Used in job_requirements.criteria column.
 */
export const physicalExamCriteriaSchema = requiredCriteriaSchema.extend({
  current_dot_physical: z.boolean(),
});

export type PhysicalExamCriteria = z.infer<typeof physicalExamCriteriaSchema>;

/**
 * Value for PHYSICAL_EXAM conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const physicalExamValueSchema = z.object({
  has_current_dot_physical: z.boolean(),
  confirmed: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type PhysicalExamValue = z.infer<typeof physicalExamValueSchema>;

/**
 * Type guard for PHYSICAL_EXAM criteria
 */
export const isPhysicalExamCriteria = (criteria: unknown): criteria is PhysicalExamCriteria => {
  return physicalExamCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for PHYSICAL_EXAM value
 */
export const isPhysicalExamValue = (value: unknown): value is PhysicalExamValue => {
  return physicalExamValueSchema.safeParse(value).success;
};
