import { SimplifiedJobRequirements } from '../../entities/job-requirements';
import { SimplifiedJobRequirementType } from '../../entities/job-requirement-type';

/**
 * Combined type for job requirements with their requirement type information.
 * This is the structure stored in the cache and used by handlers.
 */
export type JobRequirementWithType = SimplifiedJobRequirements & {
  requirementType: SimplifiedJobRequirementType;
};

/**
 * Cache entry structure for storing job requirements with metadata.
 * 
 * Contains:
 * - requirements: The top 3 job requirements (ordered by priority)
 * - lastUsed: Timestamp of when this entry was last accessed
 * - createdAt: Timestamp of when this entry was created (for TTL calculation)
 */
export type JobRequirementCacheEntry = {
  requirements: JobRequirementWithType[];
  lastUsed: Date;
  createdAt: Date;
};

