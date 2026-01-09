/**
 * Context section message builders.
 * These build sections that provide context to the LLM about the conversation and requirements.
 */

import { ChatMessage } from '../../../client/types';
import { JobRequirementWithType } from '../../../../criteria/types';
import { isRequiredCriteria, JobRequirementCriteria } from '../../../../criteria/criteria-types';
import { RequirementStatus } from '../../../../../entities/enums';
import { SimplifiedConversationRequirements } from '../../../../../entities/conversation-requirements/domain';

/**
 * Builds the conversation history section from message history.
 * 
 * @param messageHistory - Previous messages in the conversation
 * @returns Formatted conversation history string, or empty string if no messages
 */
export const buildConversationHistory = (messageHistory: ChatMessage[]): string => {
  const createMessageHistoryLine = (msg: ChatMessage): string => `${msg.role}: ${msg.content}`;
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
  conversationRequirements: SimplifiedConversationRequirements[]
): string => {
  const countByStatus = (status: RequirementStatus) => conversationRequirements.filter(cr => cr.status === status).length;
  return `## Job Requirements Overview
          Total requirements: ${conversationRequirements.length}
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
  currentRequirement: JobRequirementWithType
): string => {
  const buildIsRequiredLine = (criteria: JobRequirementCriteria): string => isRequiredCriteria(criteria) ? 'Yes' : 'No (Preferred)';
  const buildCriteriaLine = (criteria: JobRequirementCriteria): string => JSON.stringify(criteria);
  return `## Current Requirement
          - Type: ${currentRequirement.requirementType.requirementType}
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
  conversationRequirement: SimplifiedConversationRequirements
): string => {
  return `Previously collected value: ${JSON.stringify(conversationRequirement.value)}`;
};

