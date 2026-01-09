import { z } from 'zod';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, numberFilterOperatorsSchema} from "../../database/types";

/**
 * JobFactsType shape - base fields for simplified JobFactsType objects
 * Excludes metadata timestamps
 */
export const jobFactsTypeShape = {
  id: z.number().int().positive(),
  factType: z.string().max(50),
  factDescription: z.string(),
} as const;

/**
 * Simplified JobFactsType object
 * Used when embedding job facts type information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedJobFactsTypeSchema = z.object(jobFactsTypeShape);

export type SimplifiedJobFactsType = z.infer<typeof simplifiedJobFactsTypeSchema>;

/**
 * Zod schema for JobFactsType entity
 * Use this for validating unknown data from the database
 */
export const jobFactsTypeSchema = z.object(jobFactsTypeShape).extend({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Job Fact Type Entity
 * 
 * This is a lookup table that defines the different categories/types of facts
 * that can be associated with a specific job posting.
 * 
 * Purpose:
 * - Categorizes facts about a job (e.g., "work_schedule", "benefits", "location_details")
 * - Used by the LLM model to understand what type of fact it's working with
 * - Helps generate accurate FAQ responses to user questions about the job
 */
export type JobFactsType = z.infer<typeof jobFactsTypeSchema>;

export const jobFactsTypeFilterShape = {
    id: numberFilterOperatorsSchema,
    factType: stringFilterOperatorsSchema,
    factDescription: stringFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const jobFactsTypeFilterSchema: z.ZodObject = z.object(jobFactsTypeFilterShape).partial();

export const jobFactsTypeKeySchema = jobFactsTypeSchema.keyof();
export type JobFactsTypeKey = z.infer<typeof jobFactsTypeKeySchema>;


