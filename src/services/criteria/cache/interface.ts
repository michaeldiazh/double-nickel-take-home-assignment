import { JobRequirementWithType } from '../types';

/**
 * Cache interface for storing and retrieving job requirements.
 * 
 * This interface allows for different cache implementations:
 * - In-memory cache for development/testing
 * - Redis cache for production
 * 
 * Cache key: job_id (UUID string)
 * Cache value: Array of JobRequirementWithType, ordered by priority (top 3 only)
 * 
 * Note: Only the top 3 requirements (by priority, lower number = higher priority) are cached.
 * This aligns with the screening flow which asks up to 3 qualification questions.
 */
export interface RequirementsCache {
  /**
   * Retrieves job requirements for a given job ID from the cache.
   * 
   * @param jobId - The UUID of the job
   * @param priorityThreshold - Optional priority threshold. Only returns requirements with priority <= threshold.
   *                          If not provided, returns all cached requirements (up to 3).
   * @returns Promise resolving to the filtered requirements array if found, null if cache miss
   */
  get(jobId: string, priorityThreshold?: number): Promise<JobRequirementWithType[] | null>;

  /**
   * Stores job requirements for a given job ID in the cache.
   * Only the top 3 requirements (by priority, lower number = higher priority) are stored.
   * 
   * @param jobId - The UUID of the job
   * @param requirements - Array of requirements with their types, should be ordered by priority.
   *                      Only the top 3 will be cached.
   * @returns Promise that resolves when the cache operation completes
   */
  set(jobId: string, requirements: JobRequirementWithType[]): Promise<void>;

  /**
   * Removes job requirements for a given job ID from the cache.
   * Useful for cache invalidation when requirements are updated.
   * 
   * @param jobId - The UUID of the job
   * @returns Promise that resolves when the cache operation completes
   */
  invalidate(jobId: string): Promise<void>;

  /**
   * Stops the cleanup interval and cleans up resources.
   * Useful for testing. In production, intervals stop automatically on process exit.
   * 
   * @returns Promise that resolves when cleanup completes
   */
  stop?(): Promise<void>;
}

