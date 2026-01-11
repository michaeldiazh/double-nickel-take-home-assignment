import { z } from 'zod';

/**
 * Job Fact entity - snake_case matching database exactly
 */
export const jobFactSchema = z.object({
  id: z.uuidv4(),
  job_id: z.uuidv4(),
  fact_type: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
});

export type JobFact = z.infer<typeof jobFactSchema>;

/**
 * Insert schema
 */
export const insertJobFactSchema = z.object({
  job_id: z.uuidv4(),
  fact_type: z.string(),
  content: z.string(),
});

export type InsertJobFact = z.infer<typeof insertJobFactSchema>;
