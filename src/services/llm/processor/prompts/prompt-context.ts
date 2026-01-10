import {ChatMessage} from '../../client';
import {
    ConversationRequirements,
    JobFacts,
    JobRequirements,
    RequirementStatus
} from '../../../../entities';
import {
    buildConversationHistory,
    buildRequirementsOverviewSection,
    buildCurrentRequirementDetailsSection,
    buildPreviouslyCollectedValueSection,
} from './message-builders';

type BaseContext = {
    userFirstName: string;
    jobTitle: string;
    jobFacts: JobFacts[],
    messageHistory: ChatMessage[];
    requirements: JobRequirements[];
    conversationRequirements: ConversationRequirements[];
    currentRequirement: JobRequirements;
};

export type ConversationContext =
    | (BaseContext & { status: 'NEED_FOLLOW_UP'; clarificationNeeded: string })
    | (BaseContext & {
    status: 'START' | 'ON_REQ' | 'ON_JOB_QUESTIONS' | 'DONE';
    clarificationNeeded?: never
});
/**
 * Builds the current requirement details section.
 *
 * @param currentRequirement - The requirement currently being evaluated
 * @param conversationRequirements - Conversation requirements to find collected value
 * @returns Formatted current requirement details string
 */
const buildCurrentRequirementDetails = (
    currentRequirement: JobRequirements,
    conversationRequirements: ConversationRequirements[]
): string => {
    const conversationRequirement = conversationRequirements.find(
        cr => cr.jobRequirements.id === currentRequirement.id
    )!;
    if (!conversationRequirement) {
        throw new Error(`Conversation requirement not found for requirement ID: ${currentRequirement.id}`);
    }
    return `
    ${buildCurrentRequirementDetailsSection(currentRequirement)}
    ${buildPreviouslyCollectedValueSection(conversationRequirement)}
  `;
};

/**
 * Builds conversation context message string from the context object.
 * This includes:
 * - Conversation history (previous messages)
 * - Requirements status overview
 * - Current requirement details
 *
 * @param context - The conversation context
 * @returns Formatted context message string for the prompt
 */
export const buildConversationContextMessage = (context: ConversationContext): string => {
    const parts: string[] = [];
    parts.push(buildConversationHistory(context.messageHistory));
    parts.push(buildRequirementsOverviewSection(context.conversationRequirements));
    parts.push(buildCurrentRequirementDetails(context.currentRequirement, context.conversationRequirements));

    return parts.join('\n');
};

/**
 * Checks if a conversation requirement is completed (MET or NOT_MET).
 *
 * @param conversationRequirement - The conversation requirement to check
 * @returns True if the requirement is completed, false otherwise
 */
const isRequirementCompleted = (
    conversationRequirement: ConversationRequirements
): boolean => {
    return conversationRequirement.status === RequirementStatus.MET ||
        conversationRequirement.status === RequirementStatus.NOT_MET;
};

/**
 * Builds a summary of completed requirements.
 * Useful for showing progress to the candidate.
 *
 * @param context - The conversation context
 * @returns Formatted summary string
 */
export const buildRequirementsSummary = (context: ConversationContext): string => {
    const completedConversationRequirements = context.conversationRequirements.filter(isRequirementCompleted);
    const stringifiedCompletedConversationRequirements = completedConversationRequirements
        .map(cr => `- ${cr.jobRequirements.id}: ${cr.status}`);
    return `## Completed Requirements
        ${stringifiedCompletedConversationRequirements.join('\n')}`;
};

