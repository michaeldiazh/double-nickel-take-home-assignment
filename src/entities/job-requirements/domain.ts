import { z } from 'zod';
import { jobShape, jobFilterShape } from '../job/domain';
import { jobRequirementTypeShape, jobRequirementTypeFilterShape } from '../job-requirement-type/domain';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, numberFilterOperatorsSchema} from "../../database/types";

/**
 * JobRequirements shape - base fields for simplified JobRequirements objects
 * Excludes metadata timestamps
 * Uses jobId and requirementTypeId references instead of full objects to avoid infinite nesting
 */
export const jobRequirementsShape = {
  id: z.uuidv4(),
  jobId: z.uuidv4(),
  requirementTypeId: z.number().int().positive(),
  criteria: z.record(z.string(), z.unknown()),
  priority: z.number().int(),
};

/**
 * Simplified JobRequirements object
 * Used when embedding job requirements information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedJobRequirementsSchema = z.object(jobRequirementsShape);

export type SimplifiedJobRequirements = z.infer<typeof simplifiedJobRequirementsSchema>;

/**
 * Zod schema for JobRequirements entity
 * Use this for validating unknown data from the database
 * Uses simplified job and jobRequirementType objects (with ID references, not full nested objects)
 * Extends jobRequirementsShape and replaces jobId/requirementTypeId with full objects
 */
export const jobRequirementsSchema = z.object(jobRequirementsShape).extend({
  job: z.object(jobShape),
  jobRequirementType: z.object(jobRequirementTypeShape),
  createdAt: z.date(),
  updatedAt: z.date(),
}).omit({ jobId: true, requirementTypeId: true });

/**
 * Job Requirements Entity
 * 
 * This entity represents specific requirements that must be met by applicants for a job posting.
 * Each requirement is categorized by a JobRequirementType and stores the requirement details
 * in a flexible JSONB format.
 * 
 * Purpose:
 * - Defines what applicants need to qualify for a specific job
 * - Stores requirement criteria in JSON format for flexibility (e.g., years of experience, certifications, skills)
 * - Prioritizes requirements through the priority field to determine screening order
 * - Provides structured data for the LLM to evaluate applicant responses during screening
 * 
 * Usage:
 * When an applicant applies for a job, the system uses these requirements to guide the
 * screening conversation. The LLM will ask questions about each requirement (ordered by priority)
 * and compare the applicant's responses against the stored criteria.
 */
export type JobRequirements = z.infer<typeof jobRequirementsSchema>;

export const jobRequirementsFilterShape = {
    id: stringFilterOperatorsSchema,
    priority: numberFilterOperatorsSchema,
    job: z.object(jobFilterShape).partial(),
    jobRequirementType: z.object(jobRequirementTypeFilterShape).partial(),
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const jobRequirementsFilterSchema: z.ZodObject = z.object(jobRequirementsFilterShape).partial();

export const jobRequirementsKeySchema = jobRequirementsSchema.keyof();
export type JobRequirementsKey = z.infer<typeof jobRequirementsKeySchema>;


