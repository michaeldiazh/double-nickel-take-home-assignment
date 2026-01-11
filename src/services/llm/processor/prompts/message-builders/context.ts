import {ChatMessage} from "../../../client";
import {ConversationJobRequirement, JobRequirement, RequirementStatus} from "../../../../../entities";
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
    conversationRequirements: ConversationJobRequirement[]
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
    currentRequirement: JobRequirement
): string => {
    const buildIsRequiredLine = (criteria: JobRequirementCriteria): string => isRequiredCriteria(criteria) ? 'Yes' : 'No (Preferred)';
    const buildCriteriaLine = (criteria: JobRequirementCriteria): string => JSON.stringify(criteria);
    return `## Current Requirement
          - Type: ${currentRequirement.requirement_type}
          - Description: ${currentRequirement.requirement_description}
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
    conversationRequirement: ConversationJobRequirement
): string => {
    if (!conversationRequirement.extracted_value) {
        return 'Previously collected value: None (first time asking)';
    }
    return `Previously collected value: ${JSON.stringify(conversationRequirement.extracted_value)}`;
};


export const buildSystemContextMessage = (
    context: ConversationContext
): string => {
    const {conversation_requirements, current_requirement, message_history} = context;
    
    let requirementDetails = '';
    if (current_requirement) {
        const conversationRequirement = conversation_requirements.find(
            cr => cr.job_requirement_id === current_requirement.id
        );
        if (conversationRequirement) {
            requirementDetails = `
    ${buildCurrentRequirementDetailsSection(current_requirement)}
    ${buildPreviouslyCollectedValueSection(conversationRequirement)}
    `;
        }
    }
    
    return `
    ${buildHeading()}
    ${buildConversationHistory(message_history)}
    ${buildRequirementsOverviewSection(conversation_requirements)}
    ${requirementDetails}
  `;
}
