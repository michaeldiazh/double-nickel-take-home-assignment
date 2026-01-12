import { WebSocket } from 'ws';
import { RequirementHandler } from '../../llm/requirement/handler';
import { ConversationStatus, ScreeningDecision } from '../../../entities';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { ServerStreamEvent } from '../../../server/types';
import { buildStreamOptionsForActiveStream } from '../../../server/builder/stream-option.builder';
import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';

export interface RequirementsHandlerDependencies {
  requirementHandler: RequirementHandler;
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

  // Check if any requirement was NOT_MET -> DENIED
  if (result.requirementMet === false) {
    const conversationRequirements = await deps.conversationJobRequirementRepo.getConversationRequirements(conversationId);
    const hasNotMet = conversationRequirements.some(cr => cr.status === RequirementStatus.NOT_MET);
    
    if (hasNotMet) {
      // Any requirement NOT_MET -> set DENIED and close
      await deps.conversationRepo.update(conversationId, {
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.DENIED,
        is_active: false,
      });
      
      return {
        newStatus: ConversationStatus.DONE,
        message: result.assistantMessage,
      };
    }
  }

  // Return result (could be ON_REQ if more requirements, or ON_JOB_QUESTIONS if all met)
  return {
    newStatus: result.newStatus,
    message: result.assistantMessage,
  };
};
