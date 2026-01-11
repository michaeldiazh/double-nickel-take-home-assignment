import { z } from 'zod';

/**
 * Screening decision enum - matches database enum
 */
export enum ScreeningDecision {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  USER_CANCELED = 'USER_CANCELED',
  PENDING = 'PENDING',
}

export const screeningDecisionSchema = z.string().pipe(z.enum(Object.values(ScreeningDecision)));

/**
 * Conversation status enum - tracks flow state
 */
export enum ConversationStatus {
  PENDING = 'PENDING',
  START = 'START',
  ON_REQ = 'ON_REQ',
  ON_JOB_QUESTIONS = 'ON_JOB_QUESTIONS',
  DONE = 'DONE',
}

export const conversationStatusSchema = z.string().pipe(z.enum(Object.values(ConversationStatus)));

/**
 * Conversation entity - snake_case matching database exactly
 */
export const conversationSchema = z.object({
  id: z.uuidv4(),
  application_id: z.uuidv4(),
  is_active: z.boolean(),
  conversation_status: conversationStatusSchema,
  screening_decision: screeningDecisionSchema,
  screening_summary: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Conversation = z.infer<typeof conversationSchema>;

/**
 * Insert schema (for creating new conversations)
 */
export const insertConversationSchema = z.object({
  application_id: z.uuidv4(),
  is_active: z.boolean().optional().default(true),
  conversation_status: conversationStatusSchema.optional().default(ConversationStatus.PENDING),
  screening_decision: screeningDecisionSchema.optional().default(ScreeningDecision.PENDING),
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;

/**
 * Update schema (for updating conversations)
 */
export const updateConversationSchema = z.object({
  is_active: z.boolean().optional(),
  conversation_status: conversationStatusSchema.optional(),
  screening_decision: screeningDecisionSchema.optional(),
  screening_summary: z.string().nullable().optional(),
}).partial();
export type UpdateConversation = z.infer<typeof updateConversationSchema>;
