import {z} from 'zod';
import {applicationStatusSchema} from '../enums';
import {userShape, userFilterShape} from '../user/domain';
import {jobShape, jobFilterShape} from '../job/domain';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema} from "../../database/types";

/**
 * Application shape - base fields for simplified Application objects
 * Excludes metadata timestamps
 * Uses userId and jobId references instead of full objects to avoid infinite nesting
 */
export const applicationShape = {
    id: z.uuidv4(),
    userId: z.uuidv4(),
    jobId: z.uuidv4(),
    appliedOn: z.date(),
    status: applicationStatusSchema,
};
/**
 * Simplified Application object
 * Used when embedding application information in other entities
 * Contains only essential application fields (excludes timestamps)
 */
export const simplifiedApplicationSchema = z.object(applicationShape);

export type SimplifiedApplication = z.infer<typeof simplifiedApplicationSchema>;

/**
 * Zod schema for Application entity
 * Use this for validating unknown data from the database
 * Uses simplified user and job objects (with ID references, not full nested objects)
 * Extends applicationShape and replaces userId/jobId with full user/job objects
 */
export const applicationSchema = z.object(applicationShape).extend({
    user: z.object(userShape),
    job: z.object(jobShape),
    createdAt: z.date(),
    updatedAt: z.date(),
}).omit({userId: true, jobId: true});

/**
 * Application Entity
 *
 * This entity represents a job application made by a user. It records when a user applies
 * for a specific job and tracks the current status of that application through the screening process.
 *
 * Purpose:
 * - Links users to jobs they've applied for
 * - Tracks application status (SUBMITTED, IN_PROGRESS, WITHDRAWN, HIRED, REJECTED)
 * - Records the timestamp when the application was submitted
 * - Serves as the base for conversation/screening sessions
 *
 * Lifecycle:
 * An application is created when a user applies for a job with status SUBMITTED. During
 * the screening process, the status progresses to IN_PROGRESS. The application can then
 * result in being HIRED, REJECTED, or WITHDRAWN by the applicant. If the conversation
 * screening summary is DENIED, the application status is automatically set to REJECTED.
 *
 * Relationships:
 * - Each application belongs to one user and one job
 * - An application can have one or more conversations for screening
 * - The unique constraint ensures a user can only apply once per job
 */
export type Application = z.infer<typeof applicationSchema>;

export const applicationFilterShape = {
    id: stringFilterOperatorsSchema,
    userId: stringFilterOperatorsSchema,
    jobId: stringFilterOperatorsSchema,
    appliedOn: dateFilterOperatorsSchema,
    status: stringFilterOperatorsSchema,
    user: z.object(userFilterShape).partial(),
    job: z.object(jobFilterShape).partial(),
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const applicationFilterSchema: z.ZodObject = z.object(applicationFilterShape).partial();

export const applicationKeySchema = applicationSchema.keyof();
export type ApplicationKey = z.infer<typeof applicationKeySchema>;

