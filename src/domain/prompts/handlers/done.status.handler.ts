import { WebSocket } from 'ws';
import { sendCompletionMessage, CompletionHandlerDependencies } from '../../llm/completion';
import { ConversationStatus } from '../../../entities';

export interface DoneHandlerDependencies extends CompletionHandlerDependencies {}

export interface DoneHandlerResult {
  newStatus: ConversationStatus;
  message: string;
}

/**
 * Done Handler - handles conversation completion
 * Sends final summary and determines if applicant meets qualifications
 * 
 * Note: Completion message is sent non-streaming to ensure the full message
 * is available before sending to the client.
 * 
 * @param _ws - WebSocket (unused, kept for consistency with StatusHandler type)
 * @param conversationId - The conversation ID
 * @param _userMessage - User message (unused for DONE status)
 * @param deps - Handler dependencies
 */
export const handleDoneConversation = async (
  _ws: WebSocket,
  conversationId: string,
  _userMessage: string,
  deps: DoneHandlerDependencies
): Promise<DoneHandlerResult> => {
  // Generate completion message (non-streaming) to get the full message
  const completionMessage = await sendCompletionMessage(
    conversationId,
    undefined, // Don't stream - we'll send the complete message at once
    deps
  );

  return {
    newStatus: ConversationStatus.DONE,
    message: completionMessage,
  };
};
