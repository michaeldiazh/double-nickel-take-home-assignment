import {ChatMessage} from '../llm/client';
import {
    ConversationJobRequirement,
    JobRequirement,
    JobFact,
} from '../../entities';
import {ConversationStatus} from '../../entities/conversation/domain';

/**
 * Base context structure shared by all conversation states.
 */
type BaseContext = {
    conversation_id: string;  // snake_case
    user_first_name: string;  // snake_case
    job_title: string;  // snake_case
    job_facts: JobFact[];  // snake_case
    message_history: ChatMessage[];  // snake_case - but ChatMessage uses role/content (for LLM)
    requirements: JobRequirement[];
    conversation_requirements: ConversationJobRequirement[];  // snake_case
    current_requirement?: JobRequirement;  // snake_case - optional for ON_JOB_QUESTIONS and DONE
};

/**
 * Conversation context type for LLM processor.
 *
 * Represents the full context of a conversation including:
 * - User and job information
 * - Message history
 * - Requirements and their status
 * - Current requirement being evaluated
 * - Conversation status (flow state)
 *
 * Note: Uses ConversationStatus from the entity domain for persisted states.
 * NEED_FOLLOW_UP is a runtime-only state (not persisted to database).
 */
export type ConversationContext =
    | (BaseContext & { status: 'NEED_FOLLOW_UP'; clarification_needed: string })
    | (BaseContext & {
    status: ConversationStatus.PENDING | ConversationStatus.START | ConversationStatus.ON_REQ | ConversationStatus.ON_JOB_QUESTIONS | ConversationStatus.DONE;
    clarification_needed?: never;
});
