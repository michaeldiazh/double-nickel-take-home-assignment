import { Pool } from 'pg';
import { Job, jobSchema } from './domain';

/**
 * Job repository
 */
export class JobRepository {
  constructor(private client: Pool) {}

  /**
   * Get job by ID.
   */
  async getById(jobId: string): Promise<Job | null> {
    const query = `
      SELECT id, name, description, payment_info, created_at
      FROM jobs
      WHERE id = $1
    `;
    
    const result = await this.client.query<Job>(query, [jobId]);
    
    if (result.rows.length === 0) return null;
    
    return jobSchema.parse(result.rows[0]);
  }
}
