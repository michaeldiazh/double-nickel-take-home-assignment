import { Pool } from 'pg';
import { Job, jobSchema } from './domain';

/**
 * Job repository
 */
export class JobRepository {
  constructor(private client: Pool) {}

  /**
   * Get job by ID.
   * Backward compatible: handles cases where location and is_active may not exist in database.
   * Note: payment_info is JSONB and will be automatically parsed by pg library.
   */
  async getById(jobId: string): Promise<Job | null> {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        location, 
        is_active, 
        payment_info::jsonb, 
        created_at
      FROM jobs
      WHERE id = $1
    `;
    
    const result = await this.client.query<Job>(query, [jobId]);
    
    if (result.rows.length === 0) return null;
    
    // Parse with defaults for backward compatibility
    const row = result.rows[0];
    const jobData = {
      ...row,
      location: row.location ?? null,
      is_active: row.is_active ?? true,
    };
    
    return jobSchema.parse(jobData);
  }

  /**
   * Get all jobs ordered by created_at ascending.
   * Returns jobs with name, description, location, and is_active.
   * Note: payment_info is JSONB and will be automatically parsed by pg library.
   */
  async getAll(): Promise<Job[]> {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        location, 
        is_active, 
        payment_info::jsonb, 
        created_at
      FROM jobs
      ORDER BY created_at ASC
    `;
    
    const result = await this.client.query<Job>(query);
    
    // Parse with defaults for backward compatibility
    return result.rows.map(row => {
      const jobData = {
        ...row,
        location: row.location ?? null,
        is_active: row.is_active ?? true,
      };
      return jobSchema.parse(jobData);
    });
  }
}
