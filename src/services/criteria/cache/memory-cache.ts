import { RequirementsCache } from './interface';
import { JobRequirementWithType } from '../types';
import { JobRequirementCacheEntry } from '../types';

/**
 * Checks if a cache entry has expired based on TTL.
 * 
 * @param entry - The cache entry to check
 * @param ttlMinutes - Time-to-live in minutes
 * @returns true if entry is expired, false otherwise
 */
const isEntryExpired = (entry: JobRequirementCacheEntry, ttlMinutes: number): boolean => {
  const now = new Date();
  const ttlMs = ttlMinutes * 60 * 1000;
  const age = now.getTime() - entry.createdAt.getTime();
  return age > ttlMs;
};

/**
 * Gets the top 3 requirements sorted by priority (lower number = higher priority).
 * 
 * @param requirements - Array of job requirements
 * @returns Top 3 requirements sorted by priority
 */
const getTopRequirements = (requirements: JobRequirementWithType[]): JobRequirementWithType[] => {
  return requirements
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
};

/**
 * Creates a new cache entry with the given requirements and timestamps.
 * 
 * @param requirements - Top 3 job requirements
 * @param createdAt - Creation timestamp
 * @param lastUsed - Last used timestamp
 * @returns A new JobRequirementCacheEntry
 */
const createCacheEntry = (
  requirements: JobRequirementWithType[],
  createdAt: Date,
  lastUsed: Date
): JobRequirementCacheEntry => {
  return {
    requirements,
    createdAt,
    lastUsed,
  };
};

/**
 * Creates an in-memory cache implementation for job requirements.
 * 
 * Features:
 * - TTL-based eviction (default 5 minutes)
 * - Automatic lastUsed tracking on get()
 * - Stores only top 3 requirements per job
 * - Priority threshold filtering on get()
 * 
 * @param ttlMinutes - Time-to-live in minutes for cache entries (default: 5)
 * @param cleanupIntervalMs - Interval in milliseconds for running cleanup (default: 60000 = 1 minute).
 *                           Set to 0 to disable automatic cleanup. Useful for testing.
 * @returns RequirementsCache implementation
 */
export function createMemoryRequirementsCache(
  ttlMinutes: number = 5,
  cleanupIntervalMs: number = 60000
): RequirementsCache {
  // Cache storage: jobId -> cache entry
  const cache: Record<string, JobRequirementCacheEntry> = {};

  /**
   * Removes a cache entry for the given job ID.
   * Private closure function that has access to the cache.
   */
  const removeEntry = (jobId: string): void => { delete cache[jobId]; };

  /**
   * Updates an existing cache entry with new requirements and lastUsed timestamp.
   * Private closure function that has access to the cache.
   * 
   * @param jobId - The job ID
   * @param requirements - New top 3 requirements
   * @param lastUsed - New lastUsed timestamp
   */
  const updateEntry = (
    jobId: string,
    requirements: JobRequirementWithType[],
    lastUsed: Date
  ): void => {
    const entry = cache[jobId];
    if (entry) {
      entry.requirements = requirements;
      entry.lastUsed = lastUsed;
    }
  };

  const get = async (
    jobId: string,
    priorityThreshold: number = 2
  ): Promise<JobRequirementWithType[] | null> => {
    const entry = cache[jobId];
    
    // Cache miss
    if (!entry) {
      return null;
    }
    
    // Check TTL expiration
    if (isEntryExpired(entry, ttlMinutes)) {
      // Entry expired, remove it and return null
      removeEntry(jobId);
      return null;
    }
    
    // Update lastUsed timestamp
    const now = new Date();
    entry.lastUsed = now;
    
    // Filter by priorityThreshold
    return entry.requirements.filter(
      (req) => req.priority <= priorityThreshold
    );
  };

  const set = async (
    jobId: string,
    requirements: JobRequirementWithType[]
  ): Promise<void> => {
    // Take only top 3 requirements (sorted by priority, lower number = higher priority)
    const topRequirements = getTopRequirements(requirements);

    const now = new Date(Date.now());
    const existingEntry = cache[jobId];

    if (existingEntry) {
      // Update existing entry: refresh requirements and update lastUsed, keep original createdAt
      updateEntry(jobId, topRequirements, now);
    } else {
      // Create new cache entry with createdAt and lastUsed timestamps
      const entry = createCacheEntry(topRequirements, now, now);
      cache[jobId] = entry;
    }
  };

  const invalidate = async (jobId: string): Promise<void> => removeEntry(jobId);
  

  /**
   * Cleans up expired cache entries.
   * Runs periodically to remove entries that have exceeded their TTL.
   */
  const cleanupExpiredEntries = (): void => {
    const jobIds = Object.keys(cache);
    for (const jobId of jobIds) {
      const entry = cache[jobId];
      if (entry && isEntryExpired(entry, ttlMinutes)) {
        removeEntry(jobId);
      }
    }
  };

  // Run cleanup at specified interval (or skip if 0 for testing)
  let cleanupInterval: NodeJS.Timeout | null = null;
  if (cleanupIntervalMs > 0) {
    cleanupInterval = setInterval(cleanupExpiredEntries, cleanupIntervalMs);
  }

  const stop = async (): Promise<void> => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };

  return {
    get,
    set,
    invalidate,
    stop,
  };
}

