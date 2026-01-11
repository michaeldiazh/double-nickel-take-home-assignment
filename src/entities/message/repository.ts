import { Pool, QueryResult } from 'pg';
import { Message, InsertMessage, messageSchema, insertMessageSchema } from './domain';

/**
 * Message repository - handles all message database operations
 */
export class MessageRepository {
  constructor(private client: Pool) {}

  /**
   * Get all messages for a conversation, ordered by creation time.
   * Uses database function for fast, ordered retrieval.
   */
  async getByConversationId(conversationId: string): Promise<Message[]> {
    const query = `SELECT * FROM get_conversation_messages($1)`;
    const result = await this.client.query<Message>(query, [conversationId]);
    
    return result.rows.map(row => messageSchema.parse(row));
  }

  /**
   * Create a new message.
   */
  async create(data: InsertMessage): Promise<string> {
    const validated = insertMessageSchema.parse(data);
    
    const query = `
      INSERT INTO messages (id, conversation_id, sender, content)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id
    `;
    
    const result: QueryResult<{ id: string }> = await this.client.query(query, [
      validated.conversation_id,
      validated.sender,
      validated.content,
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Get message count for a conversation (useful for status checks).
   */
  async getCount(conversationId: string): Promise<number> {
    const query = `
      SELECT COUNT(*)::int as count
      FROM messages
      WHERE conversation_id = $1
    `;
    
    const result = await this.client.query<{ count: number }>(query, [conversationId]);
    return result.rows[0].count;
  }
}
