import { Pool, QueryResult } from 'pg';
import {
  ConversationJobRequirement,
  ConversationRequirementWithJob,
  InsertConversationJobRequirement,
  UpdateConversationJobRequirement,
  conversationJobRequirementSchema,
  insertConversationJobRequirementSchema,
  updateConversationJobRequirementSchema,
  RequirementStatus,
} from './domain';

/**
 * Conversation Job Requirement repository
 */
export class ConversationJobRequirementRepository {
  constructor(private client: Pool) {}

  /**
   * Create conversation job requirements for a conversation.
   * Creates one record per job requirement (all with PENDING status).
   */
  async createForConversation(
    conversationId: string,
    jobId: string
  ): Promise<void> {
    // Get job requirement IDs ordered by priority
    const jobReqQuery = `
      SELECT id
      FROM job_requirements
      WHERE job_id = $1
      ORDER BY priority ASC, created_at ASC
    `;
    
    const jobReqs = await this.client.query<{ id: string }>(jobReqQuery, [jobId]);
    
    if (jobReqs.rows.length === 0) {
      throw new Error(`No job requirements found for job: ${jobId}`);
    }

    // Create conversation job requirements
    const insertQuery = `
      INSERT INTO conversation_job_requirements 
        (id, conversation_id, job_requirement_id, status)
      VALUES (gen_random_uuid(), $1, $2, 'PENDING')
      ON CONFLICT (conversation_id, job_requirement_id) DO NOTHING
    `;
    
    for (const req of jobReqs.rows) {
      await this.client.query(insertQuery, [conversationId, req.id]);
    }
  }

  /**
   * Get all conversation requirements with full job requirement data.
   * Uses database function - single query!
   */
  async getConversationRequirements(
    conversationId: string
  ): Promise<ConversationRequirementWithJob[]> {
    const query = `SELECT * FROM get_conversation_requirements($1)`;
    const result = await this.client.query<ConversationRequirementWithJob>(query, [conversationId]);
    return result.rows;
  }

  /**
   * Get next pending requirement for a conversation.
   * Uses database function - optimized query!
   */
  async getNextPending(conversationId: string): Promise<ConversationRequirementWithJob | null> {
    const query = `SELECT * FROM get_next_pending_requirement($1)`;
    const result = await this.client.query<ConversationRequirementWithJob>(query, [conversationId]);
    
    if (result.rows.length === 0) return null;
    
    // Get full data for this requirement
    const fullQuery = `
      SELECT * FROM get_conversation_requirements($1)
      WHERE job_requirement_id = $2
    `;
    const fullResult = await this.client.query<ConversationRequirementWithJob>(fullQuery, [
      conversationId,
      result.rows[0].job_requirement_id,
    ]);
    
    if (fullResult.rows.length === 0) return null;
    
    return fullResult.rows[0];
  }

  /**
   * Update a conversation job requirement.
   */
  async update(
    conversationId: string,
    jobRequirementId: string,
    data: UpdateConversationJobRequirement
  ): Promise<void> {
    const validated = updateConversationJobRequirementSchema.parse(data);
    
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (validated.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(validated.status);
    }
    if (validated.extracted_value !== undefined) {
      updates.push(`extracted_value = $${paramIndex++}`);
      values.push(JSON.stringify(validated.extracted_value));
    }
    if (validated.evaluated_at !== undefined) {
      updates.push(`evaluated_at = $${paramIndex++}`);
      values.push(validated.evaluated_at);
    }
    if (validated.message_id !== undefined) {
      updates.push(`message_id = $${paramIndex++}`);
      values.push(validated.message_id);
    }

    if (updates.length === 0) return;

    values.push(conversationId, jobRequirementId);
    
    const query = `
      UPDATE conversation_job_requirements
      SET ${updates.join(', ')}
      WHERE conversation_id = $${paramIndex++}
        AND job_requirement_id = $${paramIndex}
    `;
    
    await this.client.query(query, values);
  }

  /**
   * Check if all requirements are completed.
   */
  async areAllCompleted(conversationId: string): Promise<boolean> {
    const query = `SELECT are_all_requirements_completed($1) as completed`;
    const result = await this.client.query<{ completed: boolean }>(query, [conversationId]);
    return result.rows[0].completed;
  }
}
