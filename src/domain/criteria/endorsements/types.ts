import { z } from 'zod';
import { optionalRequiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for ENDORSEMENTS requirement type.
 * Used in job_requirements.criteria column.
 */
export const endorsementsCriteriaSchema = optionalRequiredCriteriaSchema.extend({
  hazmat: z.union([z.boolean(), z.literal('preferred')]).optional(),
  tanker: z.union([z.boolean(), z.literal('preferred')]).optional(),
  doubles_triples: z.union([z.boolean(), z.literal('preferred')]).optional(),
});

export type EndorsementsCriteria = z.infer<typeof endorsementsCriteriaSchema>;

/**
 * Value for ENDORSEMENTS conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const endorsementsValueSchema = z.object({
  hazmat: z.boolean().optional(),
  tanker: z.boolean().optional(),
  doubles_triples: z.boolean().optional(),
  endorsements_confirmed: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type EndorsementsValue = z.infer<typeof endorsementsValueSchema>;

/**
 * Type guard for ENDORSEMENTS criteria
 */
export const isEndorsementsCriteria = (criteria: unknown): criteria is EndorsementsCriteria => {
  return endorsementsCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for ENDORSEMENTS value
 */
export const isEndorsementsValue = (value: unknown): value is EndorsementsValue => {
  return endorsementsValueSchema.safeParse(value).success;
};
