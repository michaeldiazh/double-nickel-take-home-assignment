import { z } from 'zod';

/**
 * User entity - snake_case matching database exactly
 */
export const userSchema = z.object({
    id: z.uuidv4(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  address: z.string().nullable(),
  apt_num: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Insert schema
 */
export const insertUserSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  apt_num: z.string().optional(),
  state: z.string().min(1),
  zip_code: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
