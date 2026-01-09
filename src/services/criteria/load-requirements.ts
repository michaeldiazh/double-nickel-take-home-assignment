import { pool } from '../../database/connection';
import { RequirementsCache } from './cache/interface';
import { JobRequirementWithType } from './types';
import { z } from 'zod';
import {
  buildJobIdFromConversationQuery,
  buildRequirementsByJobIdQuery,
  buildTopXActiveJobsQuery,
} from './builder/requirements-query';

/**
 * Zod schema for JobRequirementWithType as returned from PostgreSQL JSON functions.
 */
const jobRequirementWithTypeSchema: z.ZodType<JobRequirementWithType> = z.object({
  id: z.uuidv4(),
  jobId: z.uuidv4(),
  requirementTypeId: z.number().int().positive(),
  criteria: z.record(z.string(), z.unknown()),
  priority: z.number().int(),
  requirementType: z.object({
    id: z.number().int().positive(),
    requirementType: z.string().max(50),
    requirementDescription: z.string(),
  }),
});

/**
 * Schema for the query result - returns a JSON array of JobRequirementWithType.
 */
const jobRequirementsQueryResultSchema = z.object({
  requirements: z.array(jobRequirementWithTypeSchema),
});

/**
 * Loads job requirements for a given conversation ID.
 * Checks cache first, then loads from database if cache miss.
 * 
 * Flow: conversation -> application -> job -> requirements
 * Uses a single query with joins to get requirements directly.
 * 
 * @param cache - The requirements cache instance
 * @param conversationId - The UUID of the conversation
 * @returns Promise resolving to job requirements with their types, or null if not found
 */
export const loadRequirementsByConversationId = async (
  cache: RequirementsCache,
  conversationId: string
): Promise<JobRequirementWithType[] | null> => {
  // Get job_id from conversation via application
  const { query, values } = buildJobIdFromConversationQuery(conversationId);

  const jobIdResult = await pool.query<{ job_id: string }>(query, values);

  if (jobIdResult.rows.length === 0) {
    return null;
  }

  const jobId = jobIdResult.rows[0].job_id;
  
  // Use the existing loadRequirementsByJobId which handles cache and loading
  return loadRequirementsByJobId(cache, jobId);
};

/**
 * Loads job requirements for a given job ID.
 * Checks cache first, then loads from database if cache miss.
 * 
 * @param cache - The requirements cache instance
 * @param jobId - The UUID of the job
 * @returns Promise resolving to job requirements with their types, or null if not found
 */
export const loadRequirementsByJobId = async (
  cache: RequirementsCache,
  jobId: string
): Promise<JobRequirementWithType[] | null> => {
  // Check cache first
  const cached = await cache.get(jobId);
  if (cached) {
    return cached;
  }

  // Load from database
  const requirements = await loadRequirementsFromDatabase(jobId);
  
  if (requirements.length === 0) {
    return null;
  }

  // Store in cache
  await cache.set(jobId, requirements);

  return requirements;
};

/**
 * Loads job requirements from the database for a given job ID.
 * Joins with job_requirement_type to get requirement type information.
 * 
 * @param jobId - The UUID of the job
 * @returns Promise resolving to job requirements with their types
 */
const loadRequirementsFromDatabase = async (
  jobId: string
): Promise<JobRequirementWithType[]> => {
  const { query, values } = buildRequirementsByJobIdQuery(jobId);

  const result = await pool.query(query, values);

  if (result.rows.length === 0 || !result.rows[0].requirements) {
    return [];
  }

  // Validate and return the JSON array
  const validated = jobRequirementsQueryResultSchema.parse({
    requirements: result.rows[0].requirements,
  });

  return validated.requirements;
};


/**
 * Loads the top X most recently created active jobs.
 * Used for cache warm-up on application startup.
 * 
 * @param limit - Number of jobs to load (default: 10)
 * @returns Promise resolving to array of job IDs
 */
export const loadTopXActiveJobs = async (limit: number = 10): Promise<string[]> => {
  const { query, values } = buildTopXActiveJobsQuery(limit);

  const result = await pool.query<{ id: string }>(query, values);

  return result.rows.map((row) => row.id);
};

/**
 * Convenience function that loads top 10 active jobs.
 * @returns Promise resolving to array of job IDs
 */
export const loadTop10ActiveJobs = (): Promise<string[]> => {
  return loadTopXActiveJobs(10);
};

/**
 * Warms up the cache by loading requirements for the top 10 active jobs.
 * 
 * @param cache - The requirements cache instance
 * @param loadTopJobs - Function that returns top job IDs (default: loadTop10ActiveJobs)
 * @returns Promise that resolves when warm-up completes
 */
export const warmUpCache = async (
  cache: RequirementsCache,
  loadTopJobs: () => Promise<string[]> = loadTop10ActiveJobs
): Promise<void> => {
  const topJobIds = await loadTopJobs();

  // Load requirements for each job (this will cache them)
  await Promise.all(
    topJobIds.map((jobId) => loadRequirementsByJobId(cache, jobId))
  );
};

