/**
 * Job Questions State Router Module
 * 
 * Responsibility: Route next state based on user's intent to continue
 * - Determines if user wants to continue asking questions or is done
 * - Updates conversation status accordingly
 */
import { ConversationRepository } from '../../../entities/conversation/repository';
import { ConversationStatus } from '../../../entities/conversation/domain';

export interface StateRouterDependencies {
  conversationRepo: ConversationRepository;
}

export interface StateRouterResult {
  newStatus: ConversationStatus;
}

/**
 * Routes the next state based on whether user wants to continue asking questions.
 * 
 * @param conversationId - The conversation ID
 * @param continueWithQuestion - Whether user wants to continue asking questions
 * @param deps - Dependencies for routing
 * @returns The new conversation status
 */
export const routeJobQuestionState = async (
  conversationId: string,
  continueWithQuestion: boolean,
  deps: StateRouterDependencies
): Promise<StateRouterResult> => {
  // Handle status transitions
  if (!continueWithQuestion) {
    // User is done - transition to DONE status
    await deps.conversationRepo.update(conversationId, {
      conversation_status: ConversationStatus.DONE,
    });
    
    return {
      newStatus: ConversationStatus.DONE,
    };
  }

  // User wants to continue - stay in ON_JOB_QUESTIONS
  return {
    newStatus: ConversationStatus.ON_JOB_QUESTIONS,
  };
};
