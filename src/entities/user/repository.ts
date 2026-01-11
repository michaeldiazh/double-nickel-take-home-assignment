import { Pool, QueryResult } from 'pg';
import { User, InsertUser, userSchema, insertUserSchema } from './domain';

/**
 * User repository
 */
export class UserRepository {
  constructor(private client: Pool) {}

  /**
   * Create a new user.
   */
  async create(data: InsertUser): Promise<string> {
    const validated = insertUserSchema.parse(data);
    
    const query = `
      INSERT INTO users (id, first_name, last_name, email)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id
    `;
    
    const result: QueryResult<{ id: string }> = await this.client.query(query, [
      validated.first_name,
      validated.last_name,
      validated.email,
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Get user by ID.
   */
  async getById(userId: string): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name, email, created_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await this.client.query<User>(query, [userId]);
    
    if (result.rows.length === 0) return null;
    
    return userSchema.parse(result.rows[0]);
  }
}
