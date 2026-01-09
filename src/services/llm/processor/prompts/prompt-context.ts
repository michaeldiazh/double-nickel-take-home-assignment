import { ChatMessage } from '../../client/types';
import { JobRequirementWithType } from '../../../criteria/types';
import { RequirementStatus } from '../../../../entities/enums';
import { SimplifiedConversationRequirements } from '../../../../entities/conversation-requirements/domain';
import {
  buildConversationHistory,
  buildRequirementsOverviewSection,
  buildCurrentRequirementDetailsSection,
  buildPreviouslyCollectedValueSection,
} from './message-builders';

/**
 * Context information for building prompts.
 */
export interface ConversationContext {
  /**
   * Previous messages in the conversation (user and assistant messages)
   */
  messageHistory: ChatMessage[];
  
  /**
   * All job requirements for this job
   */
  requirements: JobRequirementWithType[];
  
  /**
   * Conversation requirements with their status and collected values.
   * Each entry links a job requirement to its evaluation status and the value extracted from the conversation.
   */
  conversationRequirements: SimplifiedConversationRequirements[];
  
  /**
   * The requirement currently being evaluated (if any)
   */
  currentRequirement?: JobRequirementWithType;
}

/**
 * Builds the current requirement details section.
 * 
 * @param currentRequirement - The requirement currently being evaluated
 * @param conversationRequirements - Conversation requirements to find collected value
 * @returns Formatted current requirement details string
 */
const buildCurrentRequirementDetails = (
  currentRequirement: JobRequirementWithType,
  conversationRequirements: SimplifiedConversationRequirements[]
): string => {
  const conversationRequirement = conversationRequirements.find(
    cr => cr.requirementId === currentRequirement.id
  )!;
  if (!conversationRequirement) {
    throw new Error(`Conversation requirement not found for requirement ID: ${currentRequirement.id}`);
  }
  return `
    ${buildCurrentRequirementDetailsSection(currentRequirement)}
    ${buildPreviouslyCollectedValueSection(conversationRequirement!)}
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
  parts.push(buildCurrentRequirementDetails(context.currentRequirement!, context.conversationRequirements));
  
  return parts.join('\n');
};

/**
 * Checks if a conversation requirement is completed (MET or NOT_MET).
 * 
 * @param conversationRequirement - The conversation requirement to check
 * @returns True if the requirement is completed, false otherwise
 */
const isRequirementCompleted = (
  conversationRequirement: SimplifiedConversationRequirements
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
    .map(cr => `- ${cr.requirementId}: ${cr.status}`);  
  return `## Completed Requirements\n${stringifiedCompletedConversationRequirements.join('\n')}`;
};

