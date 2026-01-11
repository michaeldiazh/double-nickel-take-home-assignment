import { z } from 'zod';
import { JobRequirementType } from '../../services/criteria/criteria-types';

/**
 * Base schema for criteria that enforces required field.
 * All job requirements must have criteria.required: boolean
 */
const jobRequirementCriteriaSchema = z.object({
  required: z.boolean(),
}).catchall(z.unknown());

/**
 * Job Requirement entity - snake_case matching database exactly
 */
export const jobRequirementSchema = z.object({
  id: z.uuidv4(),
  job_id: z.uuidv4(),
  requirement_type: z.string().pipe(z.enum(JobRequirementType)),
  requirement_description: z.string(),
  criteria: jobRequirementCriteriaSchema,
  priority: z.number().int(),
  created_at: z.coerce.date(),
});

export type JobRequirement = z.infer<typeof jobRequirementSchema>;

/**
 * Insert schema
 */
export const insertJobRequirementSchema = z.object({
  job_id: z.uuidv4(),
  requirement_type: z.string(),
  requirement_description: z.string(),
  criteria: jobRequirementCriteriaSchema,
  priority: z.number().int(),
});

export type InsertJobRequirement = z.infer<typeof insertJobRequirementSchema>;
