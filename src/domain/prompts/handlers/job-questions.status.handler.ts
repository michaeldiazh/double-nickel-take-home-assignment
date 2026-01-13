import { WebSocket } from 'ws';
import { JobQuestionsHandler } from '../../../domain/llm/job-questions/handler';
import { sendCompletionMessage, CompletionHandlerDependencies } from '../../llm/completion';
import { ConversationStatus, ScreeningDecision } from '../../../entities';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';

export interface JobQuestionsHandlerDependencies extends CompletionHandlerDependencies {
  jobQuestionsHandler: JobQuestionsHandler;
  conversationRepo: ConversationRepository;
}

export interface JobQuestionsHandlerResult {
  newStatus: ConversationStatus;
  message: string;
}

/**
 * Job Questions Handler - handles user questions about the job
 * When user says they're done -> send summary, set APPROVED, close chat (DONE)
 */
export const handleJobQuestionsResponse = async (
  ws: WebSocket,
  conversationId: string,
  userMessage: string,
  deps: JobQuestionsHandlerDependencies
): Promise<JobQuestionsHandlerResult> => {
  // Build stream options for message
  const streamOptionsBuilder = buildStreamOptionsForActiveStream(ws);
  const streamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.MESSAGE);

  // Handle job question
  const result = await deps.jobQuestionsHandler.handleJobQuestion(
    conversationId,
    userMessage,
    streamOptions
  );

  // If conversation is done (user said they're done), set APPROVED and generate completion summary
  if (result.newStatus === ConversationStatus.DONE) {
    // Update conversation to DONE with APPROVED decision
    await deps.conversationRepo.update(conversationId, {
      conversation_status: ConversationStatus.DONE,
      screening_decision: ScreeningDecision.APPROVED,
      is_active: false,
    });

    // Generate completion summary first (non-streaming) to get the full message
    const completionMessage = await sendCompletionMessage(
      conversationId,
      undefined, // Don't stream - we'll send the complete message at once
      deps
    );
    
    // Send the complete message as a single message (not token by token)
    const completionStreamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.CONVERSATION_END);
    if (completionStreamOptions && completionMessage) {
      completionStreamOptions.onChunk(completionMessage);
      completionStreamOptions.onComplete?.();
    }

    return {
      newStatus: ConversationStatus.DONE,
      message: completionMessage, // Return the completion summary instead of the simple goodbye
    };
  }

  return {
    newStatus: result.newStatus,
    message: result.assistantMessage,
  };
};
