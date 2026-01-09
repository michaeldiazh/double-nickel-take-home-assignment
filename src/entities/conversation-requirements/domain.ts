import {z} from 'zod';
import {requirementStatusSchema} from '../enums';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema} from "../../database/types";
import {
    conversationShape,
    conversationFilterShape,
    conversationFilterSchema,
    conversationSchema
} from '../conversation';
import {jobRequirementsFilterSchema, jobRequirementsSchema, jobRequirementsShape} from '../job-requirements';

/**
 * ConversationRequirements shape - base fields for simplified ConversationRequirements objects
 * Excludes metadata timestamps
 */
export const conversationRequirementsShape = {
    id: z.uuidv4(),
    conversationId: z.uuidv4(),
    requirementId: z.uuidv4(),
    messageId: z.uuidv4().nullable(),
    status: requirementStatusSchema,
    value: z.record(z.string(), z.unknown()).nullable(),
};

/**
 * Simplified ConversationRequirements object
 * Used when embedding conversation requirements information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedConversationRequirementsSchema = z.object(conversationRequirementsShape);

export type SimplifiedConversationRequirements = z.infer<typeof simplifiedConversationRequirementsSchema>;

/**
 * Zod schema for ConversationRequirements entity
 * Use this for validating unknown data from the database
 * Uses simplified conversation and jobRequirements objects (with ID references, not full nested objects)
 * Extends conversationRequirementsShape and replaces conversationId/requirementId with full objects
 */
export const conversationRequirementsSchema = z.object(conversationRequirementsShape).extend({
    conversation: conversationSchema,
    jobRequirements: jobRequirementsSchema,
    lastUpdated: z.date(),
    createdAt: z.date(),
}).omit({conversationId: true, requirementId: true});

/**
 * Conversation Requirements Entity
 *
 * This junction table links specific parts of a conversation to job requirements,
 * tracking whether applicants have provided clear, unambiguous answers to requirement questions.
 *
 * Purpose:
 * - Maps conversation messages to the specific job requirements being addressed
 * - Checks whether a user answered correctly (i.e., without ambiguity)
 * - Stores the extracted answer value in JSON format
 * - Points to the specific message where the user provided their answer (via messageId)
 *
 * Important Notes:
 * - "Answered correctly" means the user responded without ambiguity, NOT that they met the requirement
 * - If the user's response is ambiguous, the assistant will send follow-up messages to clarify
 * - The status tracks whether the requirement question has been answered (PENDING, MET, NOT_MET)
 * - The value field stores the parsed/extracted answer in JSON format for further processing
 */
export type ConversationRequirements = z.infer<typeof conversationRequirementsSchema>;

export const conversationRequirementsFilterShape = {
    id: stringFilterOperatorsSchema,
    conversationId: stringFilterOperatorsSchema,
    requirementId: stringFilterOperatorsSchema,
    messageId: stringFilterOperatorsSchema,
    status: stringFilterOperatorsSchema,
    lastUpdated: dateFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    conversation: conversationFilterSchema,
    jobRequirements: jobRequirementsFilterSchema,
};

export const conversationRequirementsFilterSchema: z.ZodObject = z.object(conversationRequirementsFilterShape).partial();

export const conversationRequirementsKeySchema = conversationRequirementsSchema.keyof();
export type ConversationRequirementsKey = z.infer<typeof conversationRequirementsKeySchema>;


