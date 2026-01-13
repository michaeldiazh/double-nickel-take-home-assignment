import { z } from 'zod';
import { requiredCriteriaSchema } from '../base-schemas';

/**
 * CDL Class values
 */
export enum CDLClass {
  A = 'A',
  B = 'B',
  C = 'C',
}

/**
 * Criteria for CDL_CLASS requirement type.
 * Used in job_requirements.criteria column.
 */
export const cdlClassCriteriaSchema = requiredCriteriaSchema.extend({
  cdl_class: z.enum([CDLClass.A, CDLClass.B, CDLClass.C]),
});

export type CDLClassCriteria = z.infer<typeof cdlClassCriteriaSchema>;

/**
 * Value for CDL_CLASS conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const cdlClassValueSchema = z.object({
  cdl_class: z.enum([CDLClass.A, CDLClass.B, CDLClass.C]),
  confirmed: z.boolean(),
  needs_clarification: z.boolean().optional(),
});

export type CDLClassValue = z.infer<typeof cdlClassValueSchema>;

/**
 * Type guard for CDL_CLASS criteria
 */
export const isCDLClassCriteria = (criteria: unknown): criteria is CDLClassCriteria => {
  return cdlClassCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for CDL_CLASS value
 */
export const isCDLClassValue = (value: unknown): value is CDLClassValue => {
  return cdlClassValueSchema.safeParse(value).success;
};
