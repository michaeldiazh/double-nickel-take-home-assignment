import { ConversationContext, buildConversationContextMessage } from './prompt-context';
import { buildSystemPrompt } from './system-prompt';
import { ChatMessage, MessageRole } from '../../client/types';
import { buildSystemMessageWithRequirement } from './message-builders';

/**
 * Gets a human-readable description for a requirement type.
 * Uses the requirementDescription from the job requirement type, with a fallback.
 * 
 * @param requirementType - The SimplifiedJobRequirementType object
 * @returns Human-readable description
 */
export const getRequirementDescription = (
  requirementType: { requirementDescription: string; requirementType: string }
): string => {
  return requirementType.requirementDescription || requirementType.requirementType.toLowerCase().replace(/_/g, ' ');
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
  jobLocation: string | undefined
): ChatMessage[] => {
  const systemPrompt = buildSystemPrompt(jobTitle);
  // Build assistant greeting that introduces the process and asks first question
  // Match the challenge example tone: "Hi, I'm the Happy Hauler recruiting assistant..."
  const assistantGreeting = `Hi, I'm the ${COMPANY_NAME} recruiting assistant. Thanks for your interest in our ${jobTitle} position. Can I ask you a few quick questions about your qualifications for this position?`;
  
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
  
  // Build system prompt with current requirement context
  // currentRequirement should always be present when continuing a conversation
  if (!context.currentRequirement) {
    throw new Error('currentRequirement is required when building a conversation prompt');
  }
  
  const systemMessage = buildSystemMessageWithRequirement(jobTitle, context.currentRequirement);
  messages.push(systemMessage);
  
  // Add conversation context
  const contextString = buildConversationContextMessage(context);
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

