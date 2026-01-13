/**
 * Requirement Message Receiver Module
 * 
 * Responsibility: Receive and validate user input for requirement processing
 * - Validates conversation state
 * - Loads conversation context
 * - Gets current requirement
 * - Saves user message
 */
import { ConversationContextService } from '../../conversation-context/service';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationContext } from '../../../domain/prompts/builders/types';
import { JobRequirement } from '../../../entities/job-requirement/domain';
import { ConversationJobRequirement } from '../../../entities/conversation-job-requirement/domain';
import { ConversationStatus } from '../../../entities/conversation/domain';

export interface MessageReceiverDependencies {
  messageRepo: MessageRepository;
  contextService: ConversationContextService;
}

export interface MessageReceiverResult {
  context: ConversationContext;
  currentRequirement: JobRequirement;
  conversationRequirement: ConversationJobRequirement;
  userMessageId: string;
}

/**
 * Checks if a conversation status is valid for requirement processing.
 * 
 * @param status - The conversation status to check
 * @returns true if status is START or ON_REQ, false otherwise
 */
export const isValidRequirementStatus = (status: ConversationStatus | 'NEED_FOLLOW_UP'): boolean => {
  return status === ConversationStatus.START || status === ConversationStatus.ON_REQ;
}

/**
 * Receives and validates user message for requirement processing.
 * 
 * @param conversationId - The conversation ID
 * @param userMessage - The user's message
 * @param deps - Dependencies (messageRepo, contextService)
 * @returns Context, current requirement, and user message ID
 * @throws Error if conversation is not in valid state or requirement not found
 */
export const receiveRequirementMessage = async (
  conversationId: string,
  userMessage: string,
  deps: MessageReceiverDependencies
): Promise<MessageReceiverResult> => {
  // 1. Save user message
  const userMessageId = await deps.messageRepo.create({
    conversation_id: conversationId,
    sender: 'USER',
    content: userMessage,
  });

  // 2. Load conversation context and validate status
  const context = await deps.contextService.loadFullContext(conversationId);
  
  if (!isValidRequirementStatus(context.status)) {
    throw new Error(`Conversation ${conversationId} is not in START or ON_REQ status (current: ${context.status})`);
  }

  // 3. Get current conversation requirement
  const currentRequirement = context.current_requirement;
  if (!currentRequirement) {
    throw new Error('current_requirement is required for requirement handler');
  }
  
  const conversationRequirement = context.conversation_requirements.find(
    (cr: ConversationJobRequirement) => cr.job_requirement_id === currentRequirement.id
  );
  
  if (!conversationRequirement) {
    throw new Error(`Conversation requirement not found for requirement ${currentRequirement.id}`);
  }

  return { context, currentRequirement, conversationRequirement, userMessageId};
};
