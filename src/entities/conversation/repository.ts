import { Pool, QueryResult } from 'pg';
import {
  Conversation,
  ConversationStatus,
  InsertConversation,
  ScreeningDecision,
  UpdateConversation,
  conversationSchema,
  insertConversationSchema,
  updateConversationSchema,
} from './domain';

/**
 * Conversation context data (from JOIN query)
 */
export interface ConversationContext {
  conversation_id: string;
  application_id: string;
  user_id: string;
  job_id: string;
  user_first_name: string;
  user_last_name: string;
  job_title: string;
  job_description: string;
  job_payment_info: Record<string, unknown> | null;
  is_active: boolean;
  conversation_status: ConversationStatus;
  screening_decision: ScreeningDecision;
  screening_summary: string | null;
  conversation_created_at: Date;
}

/**
 * Conversation repository - handles all conversation database operations
 */
export class ConversationRepository {
  constructor(private client: Pool) {}

  /**
   * Create a new conversation.
   */
  async create(data: InsertConversation): Promise<string> {
    const validated = insertConversationSchema.parse(data);
    
    const query = `
      INSERT INTO conversations (id, application_id, is_active, conversation_status, screening_decision)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING id
    `;
    
    const result: QueryResult<{ id: string }> = await this.client.query(query, [
      validated.application_id,
      validated.is_active,
      validated.conversation_status,
      validated.screening_decision,
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Get conversation by ID.
   */
  async getById(conversationId: string): Promise<Conversation | null> {
    const query = `
      SELECT id, application_id, is_active, conversation_status, screening_decision, screening_summary, created_at, updated_at
      FROM conversations
      WHERE id = $1
    `;
    
    const result = await this.client.query<Conversation>(query, [conversationId]);
    
    if (result.rows.length === 0) return null;
    
    return conversationSchema.parse(result.rows[0]);
  }

  /**
   * Get conversation by application ID.
   */
  async getByApplicationId(applicationId: string): Promise<Conversation | null> {
    const query = `
      SELECT id, application_id, is_active, conversation_status, screening_decision, screening_summary, created_at, updated_at
      FROM conversations
      WHERE application_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await this.client.query<Conversation>(query, [applicationId]);
    
    if (result.rows.length === 0) return null;
    
    return conversationSchema.parse(result.rows[0]);
  }

  /**
   * Get conversation context (with user and job data).
   * Simple JOIN query - no view needed.
   */
  async getContext(conversationId: string): Promise<ConversationContext | null> {
    const query = `
      SELECT 
        c.id as conversation_id,
        c.application_id,
        c.is_active,
        c.conversation_status,
        c.screening_decision,
        c.screening_summary,
        c.created_at as conversation_created_at,
        
        a.user_id,
        a.job_id,
        
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        
        j.name as job_title,
        j.description as job_description,
        j.payment_info as job_payment_info
      FROM conversations c
      JOIN applications a ON c.application_id = a.id
      JOIN users u ON a.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE c.id = $1
    `;
    
    const result = await this.client.query<ConversationContext>(query, [conversationId]);
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0];
  }

  /**
   * Update conversation.
   */
  async update(conversationId: string, data: UpdateConversation): Promise<void> {
    const validated = updateConversationSchema.parse(data);
    
    const { updates, values, paramIndex } = this.buildUpdateQuery(validated);

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(conversationId);
    
    const query = `
      UPDATE conversations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    await this.client.query(query, values);
  }

  /**
   * Private helper: Builds update query parts from validated data.
   * Uses reduce to flatten key-value pairs into updates and values arrays.
   */
  private buildUpdateQuery(data: UpdateConversation): {
    updates: string[];
    values: unknown[];
    paramIndex: number;
  } {
    const entries = Object.entries(data).filter(([_, value]) => value !== undefined);
    
    if (entries.length === 0) {
      return { updates: [], values: [], paramIndex: 1 };
    }
    
    const result = entries.reduce(
      (acc, [key, value], index) => {
        const paramIndex = acc.startingIndex + index;
        acc.updates.push(`${key} = $${paramIndex}`);
        acc.values.push(value);
        return acc;
      },
      { updates: [] as string[], values: [] as unknown[], startingIndex: 1 }
    );

    return {
      updates: result.updates,
      values: result.values,
      paramIndex: result.startingIndex + entries.length,
    };
  }
}
