import { WebSocket } from 'ws';
import { GreetingResponseHandler } from '../../llm/greeting/response-handler';
import { ConversationStatus, ScreeningDecision } from '../../../entities';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';
import { Pool } from 'pg';

export interface PendingHandlerDependencies {
  greetingResponseHandler: GreetingResponseHandler;
  conversationRepo: ConversationRepository;
}

export interface PendingHandlerResult {
  newStatus: ConversationStatus;
  message: string;
}

/**
 * Pending Handler - handles user response to initial greeting (yes/no)
 * - If Yes: Ask first requirement, move to ON_REQ
 * - If No: Set DENIED, send good luck message, close chat (DONE)
 */
export const handlePendingResponse = async (
  ws: WebSocket,
  conversationId: string,
  userMessage: string,
  deps: PendingHandlerDependencies
): Promise<PendingHandlerResult> => {
  // Build stream options for message
  const streamOptionsBuilder = buildStreamOptionsForActiveStream(ws);
  const streamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.MESSAGE);

  // Handle greeting response (yes/no)
  const result = await deps.greetingResponseHandler.handleResponse(
    conversationId,
    userMessage,
    streamOptions
  );

  // Map handler result to conversation status
  if (result.status === 'DENIED') {
    // User declined - set to DENIED and DONE
    await deps.conversationRepo.update(conversationId, {
      conversation_status: ConversationStatus.DONE,
      screening_decision: ScreeningDecision.USER_CANCELED,
      is_active: false,
    });
    
    return {
      newStatus: ConversationStatus.DONE,
      message: result.assistantMessage,
    };
  } else {
    // User accepted - move directly to ON_REQ (first requirement will be asked)
    return {
      newStatus: ConversationStatus.ON_REQ,
      message: result.assistantMessage,
    };
  }
};
