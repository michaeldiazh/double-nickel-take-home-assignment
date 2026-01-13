import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for DRIVING_RECORD requirement type.
 * Used in job_requirements.criteria column.
 */
export const drivingRecordCriteriaSchema = requiredCriteriaSchema.extend({
  max_violations: z.number().int().min(0),
  max_accidents: z.number().int().min(0),
});

export type DrivingRecordCriteria = z.infer<typeof drivingRecordCriteriaSchema>;

/**
 * Value for DRIVING_RECORD conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const drivingRecordValueSchema = z.object({
  violations: z.number().int().min(0),
  accidents: z.number().int().min(0),
  clean_record: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type DrivingRecordValue = z.infer<typeof drivingRecordValueSchema>;

/**
 * Type guard for DRIVING_RECORD criteria
 */
export const isDrivingRecordCriteria = (criteria: unknown): criteria is DrivingRecordCriteria => {
  return drivingRecordCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for DRIVING_RECORD value
 */
export const isDrivingRecordValue = (value: unknown): value is DrivingRecordValue => {
  return drivingRecordValueSchema.safeParse(value).success;
};
