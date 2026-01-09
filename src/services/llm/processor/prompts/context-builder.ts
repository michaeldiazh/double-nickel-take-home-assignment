import { ChatMessage, MessageRole } from '../../client/types';
import { JobRequirementWithType } from '../../../criteria/types';
import { RequirementStatus } from '../../../../entities/enums';

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
   * Status of each requirement (which ones are MET, NOT_MET, PENDING)
   * Keyed by requirement ID
   */
  requirementStatuses: Record<string, RequirementStatus>;
  
  /**
   * The requirement currently being evaluated (if any)
   */
  currentRequirement?: JobRequirementWithType;
  
  /**
   * Values already collected for requirements (from conversation_requirements.value)
   * Keyed by requirement ID
   */
  collectedValues: Record<string, unknown>;
}

/**
 * Builds conversation context string from the context object.
 * This includes:
 * - Conversation history (previous messages)
 * - Requirements status overview
 * - Current requirement details
 * 
 * @param context - The conversation context
 * @returns Formatted context string for the prompt
 */
export const buildConversationContext = (context: ConversationContext): string => {
  const parts: string[] = [];
  
  // Add conversation history
  if (context.messageHistory.length > 0) {
    parts.push('## Conversation History');
    context.messageHistory.forEach((msg, index) => {
      const roleLabel = msg.role === MessageRole.USER ? 'Candidate' : 'Assistant';
      parts.push(`${roleLabel}: ${msg.content}`);
    });
    parts.push(''); // Empty line
  }
  
  // Add requirements overview
  if (context.requirements.length > 0) {
    parts.push('## Job Requirements Overview');
    const metCount = Object.values(context.requirementStatuses).filter(
      status => status === RequirementStatus.MET
    ).length;
    const notMetCount = Object.values(context.requirementStatuses).filter(
      status => status === RequirementStatus.NOT_MET
    ).length;
    const pendingCount = Object.values(context.requirementStatuses).filter(
      status => status === RequirementStatus.PENDING
    ).length;
    
    parts.push(`Total requirements: ${context.requirements.length}`);
    parts.push(`- Met: ${metCount}`);
    parts.push(`- Not Met: ${notMetCount}`);
    parts.push(`- Pending: ${pendingCount}`);
    parts.push(''); // Empty line
  }
  
  // Add current requirement details
  if (context.currentRequirement) {
    const isRequired = typeof context.currentRequirement.criteria === 'object' && 
                       context.currentRequirement.criteria !== null &&
                       'required' in context.currentRequirement.criteria &&
                       (context.currentRequirement.criteria as { required?: boolean }).required !== false;
    
    parts.push('## Current Requirement');
    parts.push(`Type: ${context.currentRequirement.requirementType.requirementType}`);
    parts.push(`Priority: ${context.currentRequirement.priority}`);
    parts.push(`Required: ${isRequired ? 'Yes' : 'No (Preferred)'}`);
    parts.push(`Criteria: ${JSON.stringify(context.currentRequirement.criteria)}`);
    
    // Add already collected value if exists
    const collectedValue = context.collectedValues[context.currentRequirement.id];
    if (collectedValue) {
      parts.push(`Previously collected value: ${JSON.stringify(collectedValue)}`);
    }
    
    parts.push(''); // Empty line
  }
  
  return parts.join('\n');
};

/**
 * Builds a summary of completed requirements.
 * Useful for showing progress to the candidate.
 * 
 * @param context - The conversation context
 * @returns Formatted summary string
 */
export const buildRequirementsSummary = (context: ConversationContext): string => {
  const completed = Object.entries(context.requirementStatuses)
    .filter(([_, status]) => status === RequirementStatus.MET || status === RequirementStatus.NOT_MET)
    .map(([reqId, status]) => {
      const req = context.requirements.find(r => r.id === reqId);
      if (!req) return null;
      return `- ${req.requirementType}: ${status}`;
    })
    .filter(Boolean)
    .join('\n');
  
  if (!completed) {
    return 'No requirements completed yet.';
  }
  
  return `## Completed Requirements\n${completed}`;
};

