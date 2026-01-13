import {ConversationContext} from './types';
import {ChatMessage} from '../../llm/client';
import {buildIntroductionSystemPromptMessage} from './message-builders';
import {buildSystemMessage} from "./message-builders/message";
import {buildRequirementFollowUpSystemPromptMessage} from "./message-builders/follow-up";
import {buildJobFactsSystemPromptMessage} from "./message-builders/job-facts";
import {buildCompletionSystemPromptMessage} from "./message-builders/complete";
import {buildRequirementSystemMessage} from "./message-builders/requirements";
import { buildPendingGreetingSystemPromptMessage } from './message-builders/greeting';
import {ScreeningDecision} from '../../../entities';

type PromptFunction = (context: ConversationContext) => ChatMessage[];

/**
 * Gets a human-readable description for a requirement type.
 * Uses the requirement_description from the job requirement, with a fallback.
 *
 * @param requirementDescription - The requirement description string
 * @param requirementType - The requirement type string (e.g., 'CDL_CLASS')
 * @returns Human-readable description
 */
export const getRequirementDescription = (
    requirementDescription: string,
    requirementType: string
): string => {
    return requirementDescription || requirementType.toLowerCase().replace(/_/g, ' ');
};

/**
 * Helper to create a system message ChatMessage from a prompt string.
 */
const createSystemMessage = (prompt: string): ChatMessage[] => [buildSystemMessage(prompt)];

export const buildPendingGreetingPrompt = (
    context: ConversationContext
): ChatMessage[] => {
    return createSystemMessage(buildPendingGreetingSystemPromptMessage(context));
};

/**
 * Builds the initial prompt for a new conversation.
 * This is sent when the conversation is first created (no user message yet).
 *
 * @param context - The conversation context (job title)
 * @returns Array of ChatMessage objects (System + Assistant greeting)
 */
export const buildInitialPrompt = (
    context: ConversationContext
): ChatMessage[] => {
    return createSystemMessage(buildIntroductionSystemPromptMessage(context));
};

const buildRequirementSystemMessagePrompt = (
    context: ConversationContext
): ChatMessage[] => {
    const {job_title, current_requirement} = context;
    if (!current_requirement) {
        throw new Error('current_requirement is required for requirement prompts');
    }
    return createSystemMessage(buildRequirementSystemMessage(job_title, current_requirement));
};

export const buildFollowUpRequirementPrompt = (
    context: ConversationContext,
): ChatMessage[] => {
    if (!context.current_requirement) {
        throw new Error('current_requirement is required for follow-up prompts');
    }
    const requirementType = context.current_requirement.requirement_type;
    const clarificationNeeded = context.clarification_needed!;
    const {job_title} = context;
    return createSystemMessage(buildRequirementFollowUpSystemPromptMessage(job_title, clarificationNeeded, requirementType));
};

const buildJobFactsSystemMessage = (
    context: ConversationContext
): ChatMessage[] => {
    // Combine context and job facts message into one system message
    // Don't include message_history - context summary is sufficient
    return createSystemMessage(buildJobFactsSystemPromptMessage(context));
};

export const buildCompleteSystemPrompt = (
    context: ConversationContext,
    screeningDecision?: ScreeningDecision
): ChatMessage[] => {
    // Combine context and completion message into one system message
    // Use DENIED as default if screening decision not provided (safer default)
    const decision = screeningDecision ?? ScreeningDecision.DENIED;
    // Don't include message_history - context summary is sufficient
    return createSystemMessage(buildCompletionSystemPromptMessage(context, decision));
};

const promptBuilders: Record<ConversationContext['status'], PromptFunction> = {
    'PENDING': buildInitialPrompt,
    'START': buildRequirementSystemMessagePrompt,  // START means user accepted, we're asking requirements
    'ON_REQ': buildRequirementSystemMessagePrompt,
    'NEED_FOLLOW_UP': buildFollowUpRequirementPrompt,
    'ON_JOB_QUESTIONS': buildJobFactsSystemMessage,
    'DONE': buildCompleteSystemPrompt,
};
/**
 * Builds a prompt for continuing an existing conversation.
 * Includes conversation history and current requirement context.
 *
 * @param context - The conversation context (history, requirements, current requirement)
 * @returns Array of ChatMessage objects
 */
export const buildConversationPrompt = (
    context: ConversationContext
): ChatMessage[] => promptBuilders[context.status](context);

/**
 * Builds a follow-up question prompt when the user's answer is ambiguous.
 *
 * @param context - The conversation context
 * @param clarificationNeeded - What specific clarification is needed
 * @returns Array of ChatMessage objects with a follow-up question
 */
export const buildFollowUpPrompt = (
    context: ConversationContext,
    clarificationNeeded: string
): ChatMessage[] => {
    // Create a new context with NEED_FOLLOW_UP status and clarification_needed set
    const contextWithClarification: ConversationContext = {
        ...context,
        status: 'NEED_FOLLOW_UP' as const,
        clarification_needed: clarificationNeeded,
    };
    // Use the existing buildFollowUpRequirementPrompt which handles this case
    return buildFollowUpRequirementPrompt(contextWithClarification);
};

