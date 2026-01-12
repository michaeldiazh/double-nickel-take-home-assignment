import { Pool, QueryResult } from 'pg';
import {
  Application,
  InsertApplication,
  applicationSchema,
  insertApplicationSchema,
} from './domain';

/**
 * Application repository
 */
export class ApplicationRepository {
  constructor(private client: Pool) {}

  /**
   * Create a new application.
   */
  async create(data: InsertApplication): Promise<string> {
    const validated = insertApplicationSchema.parse(data);
    
    const query = `
      INSERT INTO applications (id, user_id, job_id)
      VALUES (gen_random_uuid(), $1, $2)
      RETURNING id
    `;
    
    const result: QueryResult<{ id: string }> = await this.client.query(query, [
      validated.user_id,
      validated.job_id,
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Get application by ID.
   */
  async getById(applicationId: string): Promise<Application | null> {
    const query = `
      SELECT id, user_id, job_id, created_at
      FROM applications
      WHERE id = $1
    `;
    
    const result = await this.client.query<Application>(query, [applicationId]);
    
    if (result.rows.length === 0) return null;
    
    return applicationSchema.parse(result.rows[0]);
  }

  /**
   * Get application with user and job data (for context loading).
   */
  async getWithUserAndJob(applicationId: string) {
    const query = `
      SELECT 
        a.id as application_id,
        a.user_id,
        a.job_id,
        a.created_at as application_created_at,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        j.name as job_title,
        j.description as job_description,
        j.payment_info as job_payment_info
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    
    const result = await this.client.query(query, [applicationId]);
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0];
  }

  /**
   * Get all applications for a user with job and conversation data.
   * Returns applications with job name, description, location, and screening decision.
   */
  async getApplicationsWithJobAndConversationByUserId(userId: string) {
    const query = `
      SELECT 
        a.id as application_id,
        a.job_id,
        a.created_at,
        j.name as job_name,
        j.description as job_description,
        COALESCE(j.location, '') as job_location,
        c.screening_decision
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN conversations c ON c.application_id = a.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await this.client.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete an application by ID.
   * This will cascade delete the conversation and all related data.
   */
  async delete(applicationId: string): Promise<boolean> {
    const query = `
      DELETE FROM applications
      WHERE id = $1
    `;
    
    const result = await this.client.query(query, [applicationId]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
