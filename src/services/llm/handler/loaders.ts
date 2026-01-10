/**
 * Database loading functions for the LLM handler.
 * These functions load conversation context data needed for processing messages.
 */

import { pool } from '../../../database/connection';
import { z } from 'zod';
import { buildConversationRequirementsQuery } from './builder/conversation-requirements-query';
import { buildJobFactsQuery } from './builder/job-facts-query';
import { buildConversationBasicQuery } from './builder/conversation-basic-query';
import { buildUserFirstNameQuery } from './builder/user-first-name-query';
import { buildJobInfoQuery } from './builder/job-info-query';
import { buildMessagesQuery } from './builder/messages-query';
import { conversationRequirementsSchema } from '../../../entities/conversation-requirements/domain';
import { conversationSchema } from '../../../entities/conversation/domain';
import { jobRequirementsSchema } from '../../../entities/job-requirements/domain';
import { simplifiedApplicationSchema } from '../../../entities/application/domain';
import { jobFactsSchema } from '../../../entities/job-facts/domain';
import { ConversationRequirements, JobFacts } from '../../../entities';
import { ChatMessage, MessageRole } from '../client';

/**
 * Loads basic conversation data needed for context building.
 * Gets conversation ID and application ID (to derive user and job info).
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Promise resolving to { conversationId, appId } or null if not found
 */
export const loadConversationBasic = async (
  conversationId: string
): Promise<{ conversationId: string; appId: string } | null> => {
  const { query, values } = buildConversationBasicQuery(conversationId);

  const result = await pool.query<{ id: string; app_id: string }>(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    conversationId: row.id,
    appId: row.app_id,
  };
};

/**
 * Loads user firstName from an application ID.
 * Gets the user's first name by joining application -> user.
 * 
 * @param appId - The UUID of the application
 * @returns Promise resolving to user firstName or null if not found
 */
export const loadUserFirstName = async (appId: string): Promise<string | null> => {
  const { query, values } = buildUserFirstNameQuery(appId);

  const result = await pool.query<{ first_name: string }>(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].first_name;
};

/**
 * Loads job title (name) and job ID from an application ID.
 * Gets the job name by joining application -> job.
 * 
 * @param appId - The UUID of the application
 * @returns Promise resolving to { jobId, jobTitle } or null if not found
 */
export const loadJobInfo = async (
  appId: string
): Promise<{ jobId: string; jobTitle: string } | null> => {
  const { query, values } = buildJobInfoQuery(appId);

  const result = await pool.query<{ id: string; name: string }>(query, values);
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    jobId: row.id,
    jobTitle: row.name,
  };
};

/**
 * Maps MessageSender (database enum) to MessageRole (LLM client enum).
 */
const mapMessageSenderToRole = (sender: string): MessageRole => {
  const normalized = sender.toUpperCase();
  if (normalized === 'USER') return MessageRole.USER;
  if (normalized === 'ASSISTANT') return MessageRole.ASSISTANT;
  return MessageRole.SYSTEM;
};

/**
 * Loads messages for a conversation, ordered by creation time.
 * Converts database MessageSender enum to ChatMessage MessageRole format.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Promise resolving to array of ChatMessage objects
 */
export const loadMessages = async (
  conversationId: string
): Promise<ChatMessage[]> => {
  const { query, values } = buildMessagesQuery(conversationId);

  const result = await pool.query<{ sender: string; content: string }>(query, values);
  
  return result.rows.map((row) => ({
    role: mapMessageSenderToRole(row.sender),
    content: row.content,
  }));
};

/**
 * Helper: Extends a conversation schema with date coercion for PostgreSQL query results.
 * Reuses conversationSchema but overrides date fields with coercion.
 */
const conversationSchemaWithDateCoercion = conversationSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  application: simplifiedApplicationSchema.extend({
    appliedOn: z.coerce.date(),
  }),
});

/**
 * Helper: Extends a job requirements schema with date coercion for PostgreSQL query results.
 * Reuses jobRequirementsSchema but overrides date fields with coercion.
 * Note: The nested job object doesn't have dates in the query output, so it remains as-is from jobRequirementsSchema.
 */
const jobRequirementsSchemaWithDateCoercion = jobRequirementsSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  // job field is already defined in jobRequirementsSchema, which matches query output
});

/**
 * Zod schema for ConversationRequirements as returned from PostgreSQL JSON functions.
 * Dates are returned as strings from PostgreSQL, so we need to coerce them.
 * Reuses conversationRequirementsSchema but overrides date fields with coercion.
 */
const conversationRequirementsQuerySchema: z.ZodType<ConversationRequirements> = 
  conversationRequirementsSchema.extend({
    lastUpdated: z.coerce.date(),
    createdAt: z.coerce.date(),
    conversation: conversationSchemaWithDateCoercion,
    jobRequirements: jobRequirementsSchemaWithDateCoercion,
  });

/**
 * Schema for the query result - returns a JSON array of ConversationRequirements.
 */
const conversationRequirementsQueryResultSchema = z.object({
  conversation_requirements: z.array(conversationRequirementsQuerySchema),
});

/**
 * Loads full conversation requirements with nested job requirements for a conversation.
 * Uses JSON aggregation query to get full entity structure.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Promise resolving to array of ConversationRequirements entities, or empty array if none found
 */
export const loadConversationRequirements = async (
  conversationId: string
): Promise<ConversationRequirements[]> => {
  const { query, values } = buildConversationRequirementsQuery(conversationId);

  const result = await pool.query(query, values);

  if (result.rows.length === 0 || !result.rows[0].conversation_requirements) {
    return [];
  }

  // Validate and return the JSON array
  const validated = conversationRequirementsQueryResultSchema.parse({
    conversation_requirements: result.rows[0].conversation_requirements,
  });

  return validated.conversation_requirements;
};

/**
 * Zod schema for JobFacts as returned from PostgreSQL JSON functions.
 * Dates are returned as strings from PostgreSQL, so we need to coerce them.
 * Reuses jobFactsSchema but overrides date fields with coercion.
 * Note: The nested job and factType objects don't have dates in the query output, so they remain as-is.
 */
const jobFactsQuerySchema: z.ZodType<JobFacts> = jobFactsSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Schema for the query result - returns a JSON array of JobFacts.
 */
const jobFactsQueryResultSchema = z.object({
  job_facts: z.array(jobFactsQuerySchema),
});

/**
 * Loads full job facts with nested job and fact type for a job.
 * Uses JSON aggregation query to get full entity structure.
 * 
 * @param jobId - The UUID of the job
 * @returns Promise resolving to array of JobFacts entities, or empty array if none found
 */
export const loadJobFacts = async (
  jobId: string
): Promise<JobFacts[]> => {
  const { query, values } = buildJobFactsQuery(jobId);

  const result = await pool.query(query, values);

  if (result.rows.length === 0 || !result.rows[0].job_facts) {
    return [];
  }

  // Validate and return the JSON array
  const validated = jobFactsQueryResultSchema.parse({
    job_facts: result.rows[0].job_facts,
  });

  return validated.job_facts;
};

