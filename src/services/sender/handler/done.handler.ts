import { WebSocket } from 'ws';
import { CompletionHandler } from '../../llm/completion/handler';
import { ConversationStatus } from '../../../entities';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';

export interface DoneHandlerDependencies {
  completionHandler: CompletionHandler;
}

export interface DoneHandlerResult {
  newStatus: ConversationStatus;
  message: string;
}

/**
 * Done Handler - handles conversation completion
 * Sends final summary and determines if applicant meets qualifications
 */
export const handleDoneConversation = async (
  ws: WebSocket,
  conversationId: string,
  deps: DoneHandlerDependencies
): Promise<DoneHandlerResult> => {
  // Generate completion message first (non-streaming) to get the full message
  const completionMessage = await deps.completionHandler.sendCompletionMessage(
    conversationId,
    undefined // Don't stream - we'll send the complete message at once
  );

  return {
    newStatus: ConversationStatus.DONE,
    message: completionMessage,
  };
};
