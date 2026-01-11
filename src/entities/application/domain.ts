import { z } from 'zod';

/**
 * Application entity - snake_case matching database exactly
 */
export const applicationSchema = z.object({
  id: z.uuidv4(),
  user_id: z.uuidv4(),
  job_id: z.uuidv4(),
  created_at: z.coerce.date(),
});

export type Application = z.infer<typeof applicationSchema>;

/**
 * Insert schema
 */
export const insertApplicationSchema = z.object({
  user_id: z.uuidv4(),
  job_id: z.uuidv4(),
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
