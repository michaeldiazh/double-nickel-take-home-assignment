import { z } from 'zod';
import { messageSenderSchema } from '../enums';
import { conversationShape, conversationFilterShape } from '../conversation/domain';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema} from "../../database/types";

/**
 * Zod schema for Message entity
 * Use this for validating unknown data from the database
 * Uses simplified conversation object (with ID references, not full nested objects)
 */
export const messageSchema = z.object({
  id: z.uuidv4(),
  conversation: z.object(conversationShape),
  sender: messageSenderSchema,
  content: z.string(),
  createdAt: z.date(),
});

/**
 * Message Entity
 * 
 * A message represents a single entry in the discussion within a conversation.
 * Messages make up the dialogue between the applicant and the LLM during the screening process.
 * 
 * Sender Types:
 * - USER: Messages from the applicant (responses to questions, asking questions, etc.)
 * - ASSISTANT: Messages from the LLM (asking screening questions, providing information, etc.)
 * - SYSTEM: System-generated messages (error notifications, timeouts, or other system events)
 * 
 * Usage:
 * Each message is linked to a conversation and forms part of the complete screening dialogue.
 * The sender type helps determine who sent the message and how it should be processed or displayed.
 */
export type Message = z.infer<typeof messageSchema>;

export const messageFilterShape = {
    id: stringFilterOperatorsSchema,
    conversationId: stringFilterOperatorsSchema,
    sender: stringFilterOperatorsSchema,
    content: stringFilterOperatorsSchema,
    conversation: z.object(conversationFilterShape).partial(),
    createdAt: dateFilterOperatorsSchema,
};

export const messageFilterSchema: z.ZodObject = z.object(messageFilterShape).partial();

export const messageKeySchema = messageSchema.keyof();
export type MessageKey = z.infer<typeof messageKeySchema>;


