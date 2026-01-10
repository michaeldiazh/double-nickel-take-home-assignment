/**
 * Context loader for initializing new conversation contexts.
 * Creates conversation and conversation requirements, then loads full context data.
 */

import { Pool } from 'pg';
import { createConversation } from '../../../entities/conversation/database';
import { createConversationRequirements } from '../../../entities/conversation-requirements/database';
import { getApplicationWithJobAndUser } from '../../../entities/application/database';
import { loadConversationRequirements, loadJobFacts } from './loaders';
import { ConversationContext } from '../processor/prompts/prompt-context';
import type { StartConversationContextResult } from './types';

/**
 * Starts a new conversation context by creating conversation and all conversation requirements.
 * All conversation requirements will be created with status PENDING.
 * 
 * This function:
 * 1. Gets application data (jobId, userId, userFirstName, jobTitle)
 * 2. Creates conversation (in transaction)
 * 3. Creates conversation_requirements for each job requirement with PENDING status (in transaction)
 * 4. Loads back full conversation_requirements with nested data
 * 5. Builds ConversationContext with START status
 * 
 * @param dbPool - Database connection pool
 * @param applicationId - The application ID
 * @returns Result with conversationId and ConversationContext (START status)
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
      // 1. Get application data with job and user information
      const { jobId, jobName: jobTitle, userFirstName } = await getApplicationWithJobAndUser(client, applicationId);
      
      // 2. Create conversation
      const createdConversationId = await createConversation(client, applicationId);
      
      // 3. Create conversation_requirements for each job requirement (status: PENDING)
      // This function will fetch job requirement IDs and create conversation_requirements
      await createConversationRequirements(client, createdConversationId, jobId);
      
      // Commit transaction
      await client.query('COMMIT');
      
      // 5. Load back full conversation_requirements with nested data and job facts
      // (We can't use the existing loader with the transaction client, so we'll use the pool after commit)
      const [conversationRequirements, jobFacts] = await Promise.all([
        loadConversationRequirements(createdConversationId),
        loadJobFacts(jobId),
      ]);
      
      // 6. Build ConversationContext with START status
      // Extract requirements from conversationRequirements (for START context)
      const requirements = conversationRequirements.map(cr => cr.jobRequirements);
      const currentRequirement = requirements[0]; // First requirement (ordered by priority)
      
      if (!currentRequirement) {
        throw new Error('No requirements found in conversation requirements');
      }
      
      const context: ConversationContext = {
        status: 'START',
        userFirstName,
        jobTitle,
        jobFacts,
        messageHistory: [], // Empty for START
        requirements,
        conversationRequirements,
        currentRequirement,
      };
      
      return {
        conversationId: createdConversationId,
        context,
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

