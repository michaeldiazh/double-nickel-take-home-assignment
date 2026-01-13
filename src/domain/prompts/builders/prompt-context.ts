import { ConversationContext } from './types';
import {
    ConversationJobRequirement,
    JobRequirement
} from '../../../entities';

// Re-export for convenience
export type { ConversationContext } from './types';

/**
 * Builds the current requirement details section.
 *
 * @param currentRequirement - The requirement currently being evaluated
 * @param conversationRequirements - Conversation requirements to find collected value
 * @returns Formatted current requirement details string
 */
const buildCurrentRequirementDetails = (
    currentRequirement: JobRequirement,
    conversationRequirements: ConversationJobRequirement[]
): string => {
    const conversationRequirement = conversationRequirements.find(
        cr => cr.job_requirement_id === currentRequirement.id
    );
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
    parts.push(buildConversationHistory(context.message_history));
    parts.push(buildRequirementsOverviewSection(context.conversation_requirements));
    if (context.current_requirement) {
        parts.push(buildCurrentRequirementDetails(context.current_requirement, context.conversation_requirements));
    }

    return parts.join('\n');
};

/**
 * Checks if a conversation requirement is completed (MET or NOT_MET).
 *
 * @param conversationRequirement - The conversation requirement to check
 * @returns True if the requirement is completed, false otherwise
 */
const isRequirementCompleted = (
    conversationRequirement: ConversationJobRequirement
): boolean => {
    return conversationRequirement.status === 'MET' ||
        conversationRequirement.status === 'NOT_MET';
};

/**
 * Builds a summary of completed requirements.
 * Useful for showing progress to the candidate.
 *
 * @param context - The conversation context
 * @returns Formatted summary string
 */
export const buildRequirementsSummary = (context: ConversationContext): string => {
    const completedConversationRequirements = context.conversation_requirements.filter(isRequirementCompleted);
    const stringifiedCompletedConversationRequirements = completedConversationRequirements
        .map((cr: ConversationJobRequirement) => `- ${cr.job_requirement_id}: ${cr.status}`);
    return `## Completed Requirements
        ${stringifiedCompletedConversationRequirements.join('\n')}`;
};

// Helper functions (imported from message-builders)
import {
    buildConversationHistory,
    buildRequirementsOverviewSection,
    buildCurrentRequirementDetailsSection,
    buildPreviouslyCollectedValueSection,
} from './message-builders';