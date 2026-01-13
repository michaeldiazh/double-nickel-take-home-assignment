import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for GEOGRAPHIC_RESTRICTION requirement type.
 * Used in job_requirements.criteria column.
 */
export const geographicRestrictionCriteriaSchema = requiredCriteriaSchema.extend({
  allowed_states: z.array(z.string().length(2)).optional(), // State codes like ["NY", "NJ", "PA"]
  allowed_regions: z.array(z.string()).optional(), // Regions like ["Northeast", "Mid-Atlantic"]
});

export type GeographicRestrictionCriteria = z.infer<typeof geographicRestrictionCriteriaSchema>;

/**
 * Value for GEOGRAPHIC_RESTRICTION conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const geographicRestrictionValueSchema = z.object({
  location: z.string(), // State code or city
  state: z.string().length(2).optional(), // State code (e.g., "NY")
  meets_requirement: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type GeographicRestrictionValue = z.infer<typeof geographicRestrictionValueSchema>;

/**
 * Type guard for GEOGRAPHIC_RESTRICTION criteria
 */
export const isGeographicRestrictionCriteria = (criteria: unknown): criteria is GeographicRestrictionCriteria => {
  return geographicRestrictionCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for GEOGRAPHIC_RESTRICTION value
 */
export const isGeographicRestrictionValue = (value: unknown): value is GeographicRestrictionValue => {
  return geographicRestrictionValueSchema.safeParse(value).success;
};
