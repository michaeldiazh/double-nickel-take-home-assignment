/**
 * Job Questions Message Receiver Module
 * 
 * Responsibility: Receive and validate user input for job questions processing
 * - Validates conversation state (ON_JOB_QUESTIONS)
 * - Loads conversation context
 * - Saves user message
 */
import { ConversationContextService } from '../../conversation-context/service';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationContext } from '../../llm/processor/prompts/prompt-context';
import { ConversationStatus } from '../../../entities/conversation/domain';

export interface MessageReceiverDependencies {
  messageRepo: MessageRepository;
  contextService: ConversationContextService;
}

export interface MessageReceiverResult {
  context: ConversationContext;
  userMessageId: string;
}

/**
 * Checks if a conversation status is valid for job questions processing.
 * 
 * @param status - The conversation status to check
 * @returns true if status is ON_JOB_QUESTIONS, false otherwise
 */
export const isValidJobQuestionsStatus = (status: ConversationStatus): boolean => {
  return status === ConversationStatus.ON_JOB_QUESTIONS;
};

/**
 * Receives and validates user message for job questions processing.
 * 
 * @param conversationId - The conversation ID
 * @param userMessage - The user's message
 * @param deps - Dependencies (messageRepo, contextService)
 * @returns Context and user message ID
 * @throws Error if conversation is not in ON_JOB_QUESTIONS status
 */
export const receiveJobQuestionMessage = async (
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
  
  // Check if status is a ConversationStatus (not "NEED_FOLLOW_UP") and is ON_JOB_QUESTIONS
  if (context.status !== ConversationStatus.ON_JOB_QUESTIONS) {
    throw new Error(`Conversation ${conversationId} is not in ON_JOB_QUESTIONS status (current: ${context.status})`);
  }

  return { context, userMessageId };
};
