import { z } from 'zod';

/**
 * Requirement status enum - matches database enum
 */
export enum RequirementStatus {
  PENDING = 'PENDING',
  MET = 'MET',
  NOT_MET = 'NOT_MET',
}

export const requirementStatusSchema = z.string().pipe(z.enum(Object.values(RequirementStatus)));

/**
 * Conversation Job Requirement entity - snake_case matching database exactly
 * Tracks evaluation status of each job requirement in a conversation
 */
export const conversationJobRequirementSchema = z.object({
  id: z.uuidv4(),
  conversation_id: z.uuidv4(),
  job_requirement_id: z.uuidv4(),
  status: requirementStatusSchema,
  extracted_value: z.record(z.string(), z.unknown()).nullable(),
  evaluated_at: z.coerce.date().nullable(),
  message_id: z.uuidv4().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type ConversationJobRequirement = z.infer<typeof conversationJobRequirementSchema>;

/**
 * Insert schema (for creating conversation job requirements)
 */
export const insertConversationJobRequirementSchema = z.object({
  conversation_id: z.uuidv4(),
  job_requirement_id: z.uuidv4(),
  status: requirementStatusSchema.optional().default(RequirementStatus.PENDING),
});

export type InsertConversationJobRequirement = z.infer<typeof insertConversationJobRequirementSchema>;

/**
 * Update schema (for updating conversation job requirements)
 */
export const updateConversationJobRequirementSchema = z.object({
  status: requirementStatusSchema.optional(),
  extracted_value: z.record(z.string(), z.unknown()).nullable().optional(),
  evaluated_at: z.coerce.date().nullable().optional(),
  message_id: z.uuidv4().nullable().optional(),
}).partial();

export type UpdateConversationJobRequirement = z.infer<typeof updateConversationJobRequirementSchema>;

/**
 * Full requirement data (from function with job requirement details)
 */
export interface ConversationRequirementWithJob {
  conversation_job_requirement_id: string;
  job_requirement_id: string;
  requirement_type: string;
  requirement_description: string;
  criteria: Record<string, unknown>;
  priority: number;
  status: RequirementStatus;
  extracted_value: Record<string, unknown> | null;
  evaluated_at: Date | null;
  message_id: string | null;
}
