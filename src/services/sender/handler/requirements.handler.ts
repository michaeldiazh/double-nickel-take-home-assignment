import { WebSocket } from 'ws';
import { RequirementHandler } from '../../llm/requirement/handler';
import { CompletionHandler } from '../../llm/completion/handler';
import { ConversationStatus } from '../../../entities';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';

export interface RequirementsHandlerDependencies {
  requirementHandler: RequirementHandler;
  completionHandler: CompletionHandler;
  conversationRepo: ConversationRepository;
  conversationJobRequirementRepo: ConversationJobRequirementRepository;
}

export interface RequirementsHandlerResult {
  newStatus: ConversationStatus;
  message: string;
}

/**
 * Requirements Handler - handles user responses during requirement questions
 * Tracks top 3 requirements. If any NOT_MET -> DENIED and close chat
 * If all 3 MET -> move to ON_JOB_QUESTIONS
 */
export const handleRequirementsResponse = async (
  ws: WebSocket,
  conversationId: string,
  userMessage: string,
  deps: RequirementsHandlerDependencies
): Promise<RequirementsHandlerResult> => {
  // Build stream options for message
  const streamOptionsBuilder = buildStreamOptionsForActiveStream(ws);
  const streamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.MESSAGE);

  // Handle requirement response
  const result = await deps.requirementHandler.handleRequirementResponse(
    conversationId,
    userMessage,
    streamOptions
  );

  // If conversation is done (either from NOT_MET or state router set it to DONE), generate completion summary
  if (result.newStatus === ConversationStatus.DONE) {
    // Generate completion summary first (non-streaming) to get the full message
    const completionMessage = await deps.completionHandler.sendCompletionMessage(
      conversationId,
      undefined // Don't stream - we'll send the complete message at once
    );
    
    // Send the complete message as a single message (not token by token)
    const completionStreamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.CONVERSATION_END);
    if (completionStreamOptions && completionMessage) {
      completionStreamOptions.onChunk(completionMessage);
      completionStreamOptions.onComplete?.();
    }

    return {
      newStatus: ConversationStatus.DONE,
      message: completionMessage, // Return the completion summary
    };
  }

  // Return result (could be ON_REQ if more requirements, or ON_JOB_QUESTIONS if all met)
  return {
    newStatus: result.newStatus,
    message: result.assistantMessage,
  };
};
