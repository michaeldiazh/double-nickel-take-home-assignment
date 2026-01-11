import { z } from 'zod';

/**
 * Message sender enum - matches database enum
 */
export const messageSenderSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);

export type MessageSender = z.infer<typeof messageSenderSchema>;

/**
 * Message entity - snake_case matching database exactly
 */
export const messageSchema = z.object({
  id: z.uuidv4(),
  conversation_id: z.uuidv4(),
  sender: messageSenderSchema,
  content: z.string(),
  created_at: z.coerce.date(),
});

export type Message = z.infer<typeof messageSchema>;

/**
 * Insert schema (for creating new messages)
 */
export const insertMessageSchema = z.object({
  conversation_id: z.uuidv4(),
  sender: messageSenderSchema,
  content: z.string().min(1),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
