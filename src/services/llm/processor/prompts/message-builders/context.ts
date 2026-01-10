import {ChatMessage} from "../../../client";
import {ConversationRequirements, JobRequirements, RequirementStatus,} from "../../../../../entities";
import {isRequiredCriteria, JobRequirementCriteria} from "../../../../criteria/criteria-types";
import {ConversationContext} from "../prompt-context";

const buildHeading = () => `
    Here's the current context of our conversation, chat:
`


/**
 * Builds the conversation history section from message history.
 *
 * @param messageHistory - Previous messages in the conversation
 * @returns Formatted conversation history string, or empty string if no messages
 */
export const buildConversationHistory = (messageHistory: ChatMessage[]): string => {
    const createMessageHistoryLine = (msg: ChatMessage): string => `- ${msg.role}: ${msg.content}`;
    const buildMessageHistory = (messageHistory: ChatMessage[]): string => messageHistory.map(createMessageHistoryLine).join('\n');
    return `
    ## Conversation History
    ${buildMessageHistory(messageHistory)}
  `;
};

/**
 * Builds the requirements overview section content with counts.
 *
 * @param conversationRequirements - Conversation requirements with their status and values
 * @returns Formatted overview section string
 */
export const buildRequirementsOverviewSection = (
    conversationRequirements: ConversationRequirements[]
): string => {
    const countByStatus = (status: RequirementStatus) => conversationRequirements.filter(cr => cr.status === status).length;
    return `## Job Requirements Overview
            -Total requirements: ${conversationRequirements.length}
            - Met: ${countByStatus(RequirementStatus.MET)}
            - Not Met: ${countByStatus(RequirementStatus.NOT_MET)}
            - Pending: ${countByStatus(RequirementStatus.PENDING)}
`;
};

/**
 * Builds the current requirement details section.
 *
 * @param currentRequirement - The requirement currently being evaluated
 * @returns Formatted current requirement details string
 */
export const buildCurrentRequirementDetailsSection = (
    currentRequirement: JobRequirements
): string => {
    const {jobRequirementType} = currentRequirement;
    const buildIsRequiredLine = (criteria: JobRequirementCriteria): string => isRequiredCriteria(criteria) ? 'Yes' : 'No (Preferred)';
    const buildCriteriaLine = (criteria: JobRequirementCriteria): string => JSON.stringify(criteria);
    return `## Current Requirement
          - Type: ${jobRequirementType.requirementType}
          - Priority: ${currentRequirement.priority}
          - Required: ${buildIsRequiredLine(currentRequirement.criteria)}
          - Criteria: ${buildCriteriaLine(currentRequirement.criteria)}`;
};

/**
 * Builds the previously collected value section.
 *
 * @param conversationRequirement - The conversation requirement with collected value
 * @returns Formatted previously collected value string
 */
export const buildPreviouslyCollectedValueSection = (
    conversationRequirement: ConversationRequirements
): string => {
    return `Previously collected value: ${JSON.stringify(conversationRequirement.value)}`;
};


export const buildSystemContextMessage = (
    context: ConversationContext
): string => {
    const {conversationRequirements, currentRequirement, messageHistory} = context;
    const conversationRequirement = conversationRequirements.find(
        cr => cr.jobRequirements.id === currentRequirement.id
    )!;
    if (!conversationRequirement) {
        throw new Error(`Conversation requirement not found for requirement ID: ${currentRequirement.id}`);
    }
    return `
    ${buildHeading()}
    ${buildConversationHistory(messageHistory)}
    ${buildRequirementsOverviewSection(conversationRequirements)}
    ${buildCurrentRequirementDetailsSection(currentRequirement)}
    ${buildPreviouslyCollectedValueSection(conversationRequirement!)}
  `;
}