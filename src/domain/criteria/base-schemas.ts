import { z } from 'zod';

/**
 * Base schema for criteria that has a required field.
 * This is a common pattern across many criteria types.
 * The required field can be required or optional depending on the criteria type.
 */
export const requiredCriteriaSchema = z.object({
  required: z.boolean(),
}).catchall(z.unknown());

/**
 * Base schema for criteria with optional required field.
 * Used for criteria types where required is optional.
 */
export const optionalRequiredCriteriaSchema = z.object({
  required: z.boolean().optional(),
}).catchall(z.unknown());
