import { z } from 'zod';

/**
 * Job entity - snake_case matching database exactly
 * Note: location and is_active are optional for backward compatibility
 */
export const jobSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  description: z.string(),
  location: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  payment_info: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.coerce.date(),
});

export type Job = z.infer<typeof jobSchema>;

/**
 * Insert schema
 */
export const insertJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  payment_info: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
