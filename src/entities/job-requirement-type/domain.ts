import { z } from 'zod';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, numberFilterOperatorsSchema} from "../../database/types";

/**
 * JobRequirementType shape - base fields for simplified JobRequirementType objects
 * Excludes metadata timestamps
 */
export const jobRequirementTypeShape = {
  id: z.number().int().positive(),
  requirementType: z.string().max(50),
  requirementDescription: z.string(),
} as const;

/**
 * Simplified JobRequirementType object
 * Used when embedding job requirement type information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedJobRequirementTypeSchema = z.object(jobRequirementTypeShape);

export type SimplifiedJobRequirementType = z.infer<typeof simplifiedJobRequirementTypeSchema>;

/**
 * Zod schema for JobRequirementType entity
 * Use this for validating unknown data from the database
 */
export const jobRequirementTypeSchema = z.object(jobRequirementTypeShape).extend({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Job Requirement Type Entity
 * 
 * This is a lookup table that defines the different categories/types of requirements
 * that must be met by applicants for a specific job posting.
 * 
 * Purpose:
 * - Categorizes job requirements for checking criteria against applicant responses
 * - Provides base information to the LLM model to help parse messages coming from applicants
 * - Helps the LLM determine if a user has answered a requirement question or not
 */
export type JobRequirementType = z.infer<typeof jobRequirementTypeSchema>;

export const jobRequirementTypeFilterShape = {
    id: numberFilterOperatorsSchema,
    requirementType: stringFilterOperatorsSchema,
    requirementDescription: stringFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const jobRequirementTypeFilterSchema: z.ZodObject = z.object(jobRequirementTypeFilterShape).partial();

export const jobRequirementTypeKeySchema = jobRequirementTypeSchema.keyof();
export type JobRequirementTypeKey = z.infer<typeof jobRequirementTypeKeySchema>;


