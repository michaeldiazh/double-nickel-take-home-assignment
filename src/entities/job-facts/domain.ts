import { z } from 'zod';
import { jobShape, jobFilterShape } from '../job/domain';
import { jobFactsTypeShape, jobFactsTypeFilterShape } from '../job-facts-type/domain';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, numberFilterOperatorsSchema} from "../../database/types";

/**
 * JobFacts shape - base fields for simplified JobFacts objects
 * Excludes metadata timestamps
 * Uses jobId and factTypeId references instead of full objects to avoid infinite nesting
 */
export const jobFactsShape = {
  id: z.uuidv4(),
  jobId: z.uuidv4(),
  factTypeId: z.number().int().positive(),
  content: z.string(),
};

/**
 * Simplified JobFacts object
 * Used when embedding job facts information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedJobFactsSchema = z.object(jobFactsShape);

export type SimplifiedJobFacts = z.infer<typeof simplifiedJobFactsSchema>;

/**
 * Zod schema for JobFacts entity
 * Use this for validating unknown data from the database
 * Uses simplified job and jobFactsType objects (with ID references, not full nested objects)
 * Extends jobFactsShape and replaces jobId/factTypeId with full objects
 */
export const jobFactsSchema = z.object(jobFactsShape).extend({
  job: z.object(jobShape),
  factType: z.object(jobFactsTypeShape),
  createdAt: z.date(),
  updatedAt: z.date(),
}).omit({ jobId: true, factTypeId: true });

/**
 * JobFacts Entity
 * 
 * This entity represents a specific fact about a job posting. It stores the fact type,
 * content, and is associated with a job posting.
 * 
 * Purpose:
 * - Stores specific facts about a job (e.g., "work_schedule", "benefits", "location_details")
 * - Provides a base entity for other job-fact-related tables
 * - Helps the LLM model understand what type of fact it's working with
 * - Helps generate accurate FAQ responses to user questions about the job
 */
export type JobFacts = z.infer<typeof jobFactsSchema>;

export const jobFactsFilterShape = {
    id: stringFilterOperatorsSchema,
    jobId: stringFilterOperatorsSchema,
    factTypeId: numberFilterOperatorsSchema,
    content: stringFilterOperatorsSchema,
    job: z.object(jobFilterShape).partial(),
    factType: z.object(jobFactsTypeFilterShape).partial(),
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const jobFactsFilterSchema: z.ZodObject = z.object(jobFactsFilterShape).partial();

export const jobFactsKeySchema = jobFactsSchema.keyof();
export type JobFactsKey = z.infer<typeof jobFactsKeySchema>;


