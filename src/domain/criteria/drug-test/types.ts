import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * Criteria for DRUG_TEST requirement type.
 * Used in job_requirements.criteria column.
 */
export const drugTestCriteriaSchema = requiredCriteriaSchema.extend({
  pre_employment: z.boolean(),
  random_testing: z.boolean().optional(),
});

export type DrugTestCriteria = z.infer<typeof drugTestCriteriaSchema>;

/**
 * Value for DRUG_TEST conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const drugTestValueSchema = z.object({
  agrees_to_pre_employment: z.boolean(),
  agrees_to_random_testing: z.boolean().optional(),
  confirmed: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type DrugTestValue = z.infer<typeof drugTestValueSchema>;

/**
 * Type guard for DRUG_TEST criteria
 */
export const isDrugTestCriteria = (criteria: unknown): criteria is DrugTestCriteria => {
  return drugTestCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for DRUG_TEST value
 */
export const isDrugTestValue = (value: unknown): value is DrugTestValue => {
  return drugTestValueSchema.safeParse(value).success;
};
