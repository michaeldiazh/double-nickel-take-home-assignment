import { ConversationContext, buildConversationContext } from './context-builder';
import { buildSystemPrompt, buildSystemPromptWithRequirement } from './system-prompt';
import { ChatMessage, MessageRole } from '../../client/types';
import { JobRequirementWithType } from '../../../criteria/types';

/**
 * Requirement type descriptions for human-readable prompts.
 */
const REQUIREMENT_DESCRIPTIONS: Record<string, string> = {
  CDL_CLASS: 'Commercial Driver\'s License (CDL) class',
  YEARS_EXPERIENCE: 'years of driving experience',
  DRIVING_RECORD: 'driving record (violations and accidents)',
  ENDORSEMENTS: 'CDL endorsements (Hazmat, Tanker, Doubles/Triples)',
  AGE_REQUIREMENT: 'age requirement',
  PHYSICAL_EXAM: 'DOT physical exam',
  DRUG_TEST: 'drug testing agreement',
  BACKGROUND_CHECK: 'background check agreement',
  GEOGRAPHIC_RESTRICTION: 'geographic location/restrictions',
};

/**
 * Gets a human-readable description for a requirement type.
 * 
 * @param requirementType - The requirement type
 * @returns Human-readable description
 */
export const getRequirementDescription = (requirementType: string): string => {
  return REQUIREMENT_DESCRIPTIONS[requirementType] || requirementType.toLowerCase().replace(/_/g, ' ');
};

/**
 * Builds the initial prompt for a new conversation.
 * This is sent when the conversation is first created (no user message yet).
 * 
 * @param jobTitle - The job title
 * @param companyName - The company name
 * @param jobLocation - Optional job location
 * @param requirements - All job requirements
 * @returns Array of ChatMessage objects (System + Assistant greeting)
 */
const COMPANY_NAME = 'Happy Hauler Trucking Co';

export const buildInitialPrompt = (
  jobTitle: string,
  jobLocation: string | undefined,
  requirements: JobRequirementWithType[]
): ChatMessage[] => {
  const systemPrompt = buildSystemPrompt(jobTitle, jobLocation);
  
  // Helper to check if a requirement is required based on criteria
  const isRequirementRequired = (req: JobRequirementWithType): boolean => {
    return typeof req.criteria === 'object' && 
           req.criteria !== null &&
           'required' in req.criteria &&
           (req.criteria as { required?: boolean }).required !== false;
  };
  
  // Find the first requirement to ask about (prioritize required, then by priority)
  const sortedRequirements = [...requirements].sort((a, b) => {
    const aRequired = isRequirementRequired(a);
    const bRequired = isRequirementRequired(b);
    if (aRequired !== bRequired) {
      return aRequired ? -1 : 1; // Required first
    }
    return a.priority - b.priority; // Lower priority number = higher priority
  });
  
  const firstRequirement = sortedRequirements[0];
  const requirementDesc = firstRequirement 
    ? getRequirementDescription(firstRequirement.requirementType.requirementType)
    : 'your qualifications';
  
  // Build assistant greeting that introduces the process and asks first question
  // Match the challenge example tone: "Hi, I'm the Happy Hauler recruiting assistant..."
  const assistantGreeting = `Hi, I'm the ${COMPANY_NAME} recruiting assistant. Thanks for your interest in our ${jobTitle} position. Can I ask you a few quick questions?`;
  
  // Note: The first question will be asked after the user responds "Yes" or similar
  // This matches the challenge flow where the assistant greets first, then asks questions

  return [
    {
      role: MessageRole.SYSTEM,
      content: systemPrompt,
    },
    {
      role: MessageRole.ASSISTANT,
      content: assistantGreeting,
    },
  ];
};

/**
 * Builds a prompt for continuing an existing conversation.
 * Includes conversation history and current requirement context.
 * 
 * @param jobTitle - The job title
 * @param context - The conversation context (history, requirements, current requirement)
 * @returns Array of ChatMessage objects
 */
export const buildConversationPrompt = (
  jobTitle: string,
  context: ConversationContext
): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  
  // Helper to check if a requirement is required based on criteria
  const isRequirementRequired = (req: JobRequirementWithType): boolean => {
    return typeof req.criteria === 'object' && 
           req.criteria !== null &&
           'required' in req.criteria &&
           (req.criteria as { required?: boolean }).required !== false;
  };
  
  // Build system prompt
  if (context.currentRequirement) {
    const isRequired = isRequirementRequired(context.currentRequirement);
    const systemPrompt = buildSystemPromptWithRequirement(
      jobTitle,
      context.currentRequirement.requirementType.requirementType,
      getRequirementDescription(context.currentRequirement.requirementType.requirementType),
      context.currentRequirement.criteria,
      isRequired
    );
    messages.push({
      role: MessageRole.SYSTEM,
      content: systemPrompt,
    });
  } else {
    // Fallback if no current requirement
    const systemPrompt = buildSystemPrompt(jobTitle);
    messages.push({
      role: MessageRole.SYSTEM,
      content: systemPrompt,
    });
  }
  
  // Add conversation context
  const contextString = buildConversationContext(context);
  if (contextString.trim()) {
    // Add context as a system message or append to existing system message
    messages.push({
      role: MessageRole.SYSTEM,
      content: `\n${contextString}`,
    });
  }
  
  // Add conversation history (user and assistant messages)
  messages.push(...context.messageHistory);
  
  return messages;
};

/**
 * Builds a follow-up question prompt when the user's answer is ambiguous.
 * 
 * @param jobTitle - The job title
 * @param context - The conversation context
 * @param clarificationNeeded - What specific clarification is needed
 * @returns Array of ChatMessage objects with a follow-up question
 */
export const buildFollowUpPrompt = (
  jobTitle: string,
  context: ConversationContext,
  clarificationNeeded: string
): ChatMessage[] => {
  const baseMessages = buildConversationPrompt(jobTitle, context);
  
  // Add a system instruction for the follow-up
  baseMessages.push({
    role: MessageRole.SYSTEM,
    content: `The candidate's last answer was unclear. You need to ask a clarifying question about: ${clarificationNeeded}`,
  });
  
  return baseMessages;
};

