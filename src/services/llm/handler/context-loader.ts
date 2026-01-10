/**
 * Context loader for initializing new conversation contexts.
 * Creates conversation and conversation requirements, then loads full context data.
 */

import { Pool } from 'pg';
import { ScreeningDecision, RequirementStatus } from '../../../entities/enums';
import { ConversationRequirements } from '../../../entities';
import { insertConversationRowSchema } from '../../../entities/conversation/database';
import { insertConversationRequirementsRowSchema } from '../../../entities/conversation-requirements/database';
import { loadConversationRequirements } from './loaders';

/**
 * Result of starting a new conversation context.
 * Contains all data needed to build the START context.
 */
export interface StartConversationContextResult {
  /**
   * The created conversation ID
   */
  conversationId: string;
  
  /**
   * Full conversation requirements with nested data (job requirements, conversation, application, etc.)
   * All requirements will have status PENDING.
   */
  conversationRequirements: ConversationRequirements[];
  
  /**
   * User's first name (for context building)
   */
  userFirstName: string;
  
  /**
   * Job title/name (for context building)
   */
  jobTitle: string;
}

/**
 * Creates a new conversation in the database.
 * Utility function exposed separately for other use cases.
 * 
 * @param dbPool - Database connection pool
 * @param appId - The application ID this conversation belongs to
 * @returns The created conversation ID
 */
export const createConversation = async (
  dbPool: Pool,
  appId: string
): Promise<string> => {
  const insertData = {
    app_id: appId,
    is_active: true,
    screening_decision: ScreeningDecision.PENDING,
    screening_summary: null,
    screening_reasons: null,
    ended_at: null,
  };
  
  // Validate insert data
  const validatedData = insertConversationRowSchema.parse(insertData);
  
  // Build and execute INSERT query - let PostgreSQL generate the UUID
  const query = `
    INSERT INTO conversation (id, app_id, is_active, screening_decision, screening_summary, screening_reasons, ended_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  
  const values = [
    validatedData.app_id,
    validatedData.is_active,
    validatedData.screening_decision,
    validatedData.screening_summary,
    validatedData.screening_reasons,
    validatedData.ended_at,
  ];
  
  const result = await dbPool.query<{ id: string }>(query, values);
  return result.rows[0].id;
};

/**
 * Starts a new conversation context by creating conversation and all conversation requirements.
 * All conversation requirements will be created with status PENDING.
 * 
 * This function:
 * 1. Gets application data (jobId, userId)
 * 2. Gets user firstName and job title
 * 3. Gets job requirements for the job
 * 4. Creates conversation (in transaction)
 * 5. Creates conversation_requirements for each job requirement with PENDING status (in transaction)
 * 6. Loads back full conversation_requirements with nested data
 * 
 * @param dbPool - Database connection pool
 * @param applicationId - The application ID
 * @returns Result with conversationId, full conversationRequirements, userFirstName, and jobTitle
 */
export const startNewConversationContext = async (
  dbPool: Pool,
  applicationId: string
): Promise<StartConversationContextResult> => {
  const client = await dbPool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    try {
      // 1. Get application data (jobId, userId, jobName, userFirstName)
      const applicationQuery = `
        SELECT 
          a.job_id,
          a.user_id,
          j.name as job_name,
          u.first_name as user_first_name
        FROM application a
        INNER JOIN job j ON a.job_id = j.id
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.id = $1
      `;
      
      const applicationResult = await client.query<{
        job_id: string;
        user_id: string;
        job_name: string;
        user_first_name: string;
      }>(applicationQuery, [applicationId]);
      
      if (applicationResult.rows.length === 0) {
        throw new Error(`Application not found: ${applicationId}`);
      }
      
      const { job_id: jobId, job_name: jobTitle, user_first_name: userFirstName } = applicationResult.rows[0];
      
      // 2. Get job requirements for the job (ordered by priority)
      const jobRequirementsQuery = `
        SELECT id
        FROM job_requirements
        WHERE job_id = $1
        ORDER BY priority ASC, created_at ASC
      `;
      
      const jobRequirementsResult = await client.query<{ id: string }>(jobRequirementsQuery, [jobId]);
      
      if (jobRequirementsResult.rows.length === 0) {
        throw new Error(`No job requirements found for job: ${jobId}`);
      }
      
      const jobRequirementIds = jobRequirementsResult.rows.map(row => row.id);
      
      // 3. Create conversation (inlined to use transaction client)
      const conversationInsertQuery = `
        INSERT INTO conversation (id, app_id, is_active, screening_decision, screening_summary, screening_reasons, ended_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const conversationInsertData = insertConversationRowSchema.parse({
        app_id: applicationId,
        is_active: true,
        screening_decision: ScreeningDecision.PENDING,
        screening_summary: null,
        screening_reasons: null,
        ended_at: null,
      });
      
      const conversationInsertResult = await client.query<{ id: string }>(
        conversationInsertQuery,
        [
          conversationInsertData.app_id,
          conversationInsertData.is_active,
          conversationInsertData.screening_decision,
          conversationInsertData.screening_summary,
          conversationInsertData.screening_reasons,
          conversationInsertData.ended_at,
        ]
      );
      
      const createdConversationId = conversationInsertResult.rows[0].id;
      
      // 4. Create conversation_requirements for each job requirement (status: PENDING)
      const createConversationRequirementQuery = `
        INSERT INTO conversation_requirements (id, conversation_id, requirement_id, status, message_id, value)
        VALUES (gen_random_uuid(), $1, $2, $3, NULL, NULL)
        RETURNING id
      `;
      
      for (const requirementId of jobRequirementIds) {
        const insertData = insertConversationRequirementsRowSchema.parse({
          conversation_id: createdConversationId,
          requirement_id: requirementId,
          status: RequirementStatus.PENDING,
          message_id: null,
          value: null,
        });
        
        await client.query(createConversationRequirementQuery, [
          insertData.conversation_id,
          insertData.requirement_id,
          insertData.status,
        ]);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // 5. Load back full conversation_requirements with nested data using existing loader
      // (We can't use the existing loader with the transaction client, so we'll use the pool after commit)
      const conversationRequirements = await loadConversationRequirements(createdConversationId);
      
      return {
        conversationId: createdConversationId,
        conversationRequirements,
        userFirstName,
        jobTitle,
      };
      
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    // Always release the client back to the pool
    client.release();
  }
};

