import { WebSocket } from 'ws';
import { ApplicationService } from '../../application';
import { GreetingInitialHandler } from '../../llm/greeting/initial-handler';
import { ConversationStatus } from '../../../entities';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';

export interface InitialHandlerDependencies {
  applicationService: ApplicationService;
  greetingInitialHandler: GreetingInitialHandler;
}

export interface InitialHandlerResult {
  conversationId: string;
  newStatus: ConversationStatus;
}

/**
 * Initial Handler - handles start_conversation event
 * Creates application/conversation and sends initial greeting asking if user wants to continue
 */
export const handleInitialConversation = async (
  ws: WebSocket,
  userId: string,
  jobId: string,
  deps: InitialHandlerDependencies
): Promise<InitialHandlerResult> => {
  // 1. Create application and conversation
  const { conversationId } = await deps.applicationService.createApplication({
    user_id: userId,
    job_id: jobId,
  });

  // 2. Build stream options for greeting
  const streamOptionsBuilder = buildStreamOptionsForActiveStream(ws);
  const streamOptions = streamOptionsBuilder(conversationId, ServerStreamEvent.GREETING);

  // 3. Send initial greeting (asks if user wants to continue with pre-approval)
  await deps.greetingInitialHandler.sendInitialGreeting(conversationId, streamOptions);

  // 4. Return result - status stays PENDING (waiting for user yes/no response)
  return {
    conversationId,
    newStatus: ConversationStatus.PENDING,
  };
};
