import { Pool } from 'pg';
import { JobFact, jobFactSchema } from './domain';

/**
 * Job Fact repository
 */
export class JobFactRepository {
  constructor(private client: Pool) {}

  /**
   * Get job facts for a conversation's job.
   * Uses database function - returns simplified format (fact_type, content).
   * For full JobFact objects, use getByJobId instead.
   */
  async getByConversationId(conversationId: string): Promise<Array<{ fact_type: string; content: string }>> {
    const query = `SELECT * FROM get_conversation_job_facts($1)`;
    const result = await this.client.query<{ fact_type: string; content: string }>(query, [conversationId]);
    return result.rows;
  }

  /**
   * Get job facts directly by job ID.
   */
  async getByJobId(jobId: string): Promise<JobFact[]> {
    const query = `
      SELECT id, job_id, fact_type, content, created_at
      FROM job_facts
      WHERE job_id = $1
      ORDER BY fact_type ASC
    `;
    
    const result = await this.client.query<JobFact>(query, [jobId]);
    return result.rows.map(row => jobFactSchema.parse(row));
  }
}
