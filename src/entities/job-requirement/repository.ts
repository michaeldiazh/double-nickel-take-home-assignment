import { Pool } from 'pg';
import {
  JobRequirement,
  jobRequirementSchema,
} from './domain';

/**
 * Job Requirement repository
 */
export class JobRequirementRepository {
  constructor(private client: Pool) {}

  /**
   * Get job requirements for a job, ordered by priority.
   */
  async getByJobId(jobId: string): Promise<JobRequirement[]> {
    const query = `
      SELECT id, job_id, requirement_type, requirement_description, criteria, priority, created_at
      FROM job_requirements
      WHERE job_id = $1
      ORDER BY priority ASC, created_at ASC
    `;
    
    const result = await this.client.query<JobRequirement>(query, [jobId]);
    return result.rows.map(row => jobRequirementSchema.parse(row));
  }

  /**
   * Get job requirement IDs for a job (ordered by priority).
   * Used when creating conversation job requirements.
   */
  async getIdsByJobId(jobId: string): Promise<string[]> {
    const query = `
      SELECT id
      FROM job_requirements
      WHERE job_id = $1
      ORDER BY priority ASC, created_at ASC
    `;
    
    const result = await this.client.query<{ id: string }>(query, [jobId]);
    return result.rows.map(row => row.id);
  }

  /**
   * Get a job requirement by ID.
   */
  async getById(jobRequirementId: string): Promise<JobRequirement | null> {
    const query = `
      SELECT id, job_id, requirement_type, requirement_description, criteria, priority, created_at
      FROM job_requirements
      WHERE id = $1
    `;
    
    const result = await this.client.query<JobRequirement>(query, [jobRequirementId]);
    if (result.rows.length === 0) return null;
    return jobRequirementSchema.parse(result.rows[0]);
  }
}
