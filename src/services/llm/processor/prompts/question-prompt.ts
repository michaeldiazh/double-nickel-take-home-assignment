import {ConversationContext} from './prompt-context';
import {ChatMessage, MessageRole} from '../../client';
import {buildIntroductionSystemPromptMessage} from './message-builders';
import {buildSystemMessage} from "./message-builders/message";
import {buildRequirementFollowUpSystemPromptMessage} from "./message-builders/follow-up";
import {buildSystemContextMessage} from "./message-builders/context";
import {buildJobFactsSystemPromptMessage} from "./message-builders/job-facts";
import {buildCompletionSystemPromptMessage} from "./message-builders/complete";
import {buildRequirementSystemMessage} from "./message-builders/requirements";

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
 * Builds the initial prompt for a new conversation.
 * This is sent when the conversation is first created (no user message yet).
 *
 * @param context - The conversation context (job title)
 * @returns Array of ChatMessage objects (System + Assistant greeting)
 */
export const buildInitialPrompt = (
    context: ConversationContext
): ChatMessage[] => {
    const systemPrompt = buildIntroductionSystemPromptMessage(context);
    return [buildSystemMessage(systemPrompt)];
};


const buildRequirementSystemMessagePrompt = (
    context: ConversationContext
): ChatMessage[] => {
    const {job_title, current_requirement} = context;
    if (!current_requirement) {
        throw new Error('current_requirement is required for requirement prompts');
    }
    const nextRequirementMessage = buildRequirementSystemMessage(job_title, current_requirement);
    const systemPrompt = buildSystemMessage(nextRequirementMessage);
    return [systemPrompt];
}

export const buildFollowUpRequirementPrompt = (
    context: ConversationContext,
): ChatMessage[] => {
    if (!context.current_requirement) {
        throw new Error('current_requirement is required for follow-up prompts');
    }
    const requirementType = context.current_requirement.requirement_type;
    const clarificationNeeded = context.clarification_needed!;
    const {job_title} = context
    const followUpMessage = buildRequirementFollowUpSystemPromptMessage(job_title, clarificationNeeded, requirementType);
    const systemPrompt = buildSystemMessage(followUpMessage);
    return [systemPrompt];
}


const buildJobFactsSystemMessage = (
    context: ConversationContext
): ChatMessage[] => {
    // Combine context and job facts message into one system message
    const contextString = buildSystemContextMessage(context);
    const jobFactsMessage = buildJobFactsSystemPromptMessage(context);
    const combinedSystemMessage = `${jobFactsMessage}`;
    const systemPrompt = buildSystemMessage(combinedSystemMessage);
    // Don't include message_history - context summary is sufficient
    return [systemPrompt];
};

const buildCompleteSystemPrompt = (
    context: ConversationContext
): ChatMessage[] => {
    // Combine context and completion message into one system message
    const contextString = buildSystemContextMessage(context);
    const finalPromptMessage = buildCompletionSystemPromptMessage(context);
    const combinedSystemMessage = `${contextString}\n\n${finalPromptMessage}`;
    const systemPrompt = buildSystemMessage(combinedSystemMessage);
    // Don't include message_history - context summary is sufficient
    return [systemPrompt];
}

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
    const {job_title, current_requirement} = context;
    if (!current_requirement) {
        throw new Error('current_requirement is required for follow-up prompts');
    }
    const pastMessages = context.message_history;
    const followMessage = buildRequirementFollowUpSystemPromptMessage(job_title, clarificationNeeded, current_requirement.requirement_type);
    pastMessages.push({role: MessageRole.SYSTEM, content: `\n${followMessage}`});
    return pastMessages;
};

