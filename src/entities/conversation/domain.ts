import { z } from 'zod';
import { screeningDecisionSchema } from '../enums';
import { applicationShape, applicationFilterShape } from '../application/domain';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, booleanFilterOperatorsSchema} from "../../database/types";

/**
 * Conversation shape - base fields for simplified Conversation objects
 * Excludes metadata timestamps
 * Uses appId reference instead of full application object to avoid infinite nesting
 */
export const conversationShape = {
  id: z.uuidv4(),
  appId: z.uuidv4(),
  isActive: z.boolean(),
  screeningDecision: screeningDecisionSchema,
  screeningSummary: z.string().nullable(),
  screeningReasons: z.record(z.string(), z.unknown()).nullable(),
  endedAt: z.date().nullable(),
};

/**
 * Simplified Conversation object
 * Used when embedding conversation information in other entities
 * Contains only essential conversation fields (excludes timestamps)
 */
export const simplifiedConversationSchema = z.object(conversationShape);

export type SimplifiedConversation = z.infer<typeof simplifiedConversationSchema>;

/**
 * Zod schema for Conversation entity
 * Use this for validating unknown data from the database
 * Uses simplified application object (with ID references, not full nested objects)
 * Extends conversationShape and replaces appId with full application object
 */
export const conversationSchema = z.object(conversationShape).extend({
  application: z.object(applicationShape),
  createdAt: z.date(),
  updatedAt: z.date(),
}).omit({ appId: true });

/**
 * Conversation Entity
 * 
 * A conversation represents a session between the LLM (AI assistant) and an applicant.
 * This is the core entity that manages the interactive screening process for a job application.
 * 
 * Purpose:
 * - Tracks the back-and-forth dialogue between the applicant and the LLM during screening
 * - Stores the final screening decision (APPROVED, DENIED, or PENDING)
 * - Maintains a summary and reasons for the screening outcome
 * - Can be marked as active or inactive (ended) to control the conversation state
 * 
 * Lifecycle:
 * A conversation is created when an application enters the screening phase and remains
 * active until the screening is complete or the conversation is terminated.
 */
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationFilterShape = {
    id: stringFilterOperatorsSchema,
    appId: stringFilterOperatorsSchema,
    isActive: booleanFilterOperatorsSchema,
    screeningDecision: stringFilterOperatorsSchema,
    screeningSummary: stringFilterOperatorsSchema,
    application: z.object(applicationFilterShape).partial(),
    endedAt: dateFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const conversationFilterSchema: z.ZodObject = z.object(conversationFilterShape).partial();

export const conversationKeySchema = conversationSchema.keyof();
export type ConversationKey = z.infer<typeof conversationKeySchema>;


