import { LLMClient, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { JobFactRepository } from '../../../entities/job-fact/repository';
import { ConversationStatus } from '../../../entities';
import {
  buildDoneContext,
  processCompletionMessage,
  truncateScreeningSummary,
  ContextBuilderDependencies,
  CompletionProcessorDependencies,
  SummaryTruncatorDependencies,
} from './index';

/**
 * Dependencies for the completion handler.
 */
export interface CompletionHandlerDependencies {
  conversationRepo: ConversationRepository;
  messageRepo: MessageRepository;
  conversationJobRequirementRepo: ConversationJobRequirementRepository;
  jobRequirementRepo: JobRequirementRepository;
  jobFactRepo: JobFactRepository;
  llmClient: LLMClient;
}

/**
 * Send final completion message for a completed conversation.
 * 
 * This functional handler:
 * 1. Validates conversation is in DONE status
 * 2. Builds conversation context for DONE status
 * 3. Processes completion message with LLM
 * 4. Saves the completion message
 * 5. Truncates summary for screening_summary field
 * 
 * @param conversationId - The conversation ID (should be in DONE status)
 * @param streamOptions - Optional streaming options for real-time chunk delivery
 * @param deps - Handler dependencies
 * @returns The completion message
 */
export const sendCompletionMessage = async (
  conversationId: string,
  streamOptions: StreamOptions | undefined,
  deps: CompletionHandlerDependencies
): Promise<string> => {
  // 1. Validate conversation is in DONE status
  const conversation = await deps.conversationRepo.getById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  if (conversation.conversation_status !== ConversationStatus.DONE) {
    throw new Error(`Conversation ${conversationId} is not in DONE status`);
  }

  // 2. Build dependencies for functional modules
  const contextBuilderDeps: ContextBuilderDependencies = {
    conversationRepo: deps.conversationRepo,
    messageRepo: deps.messageRepo,
    conversationJobRequirementRepo: deps.conversationJobRequirementRepo,
    jobRequirementRepo: deps.jobRequirementRepo,
    jobFactRepo: deps.jobFactRepo,
  };

  const completionProcessorDeps: CompletionProcessorDependencies = {
    llmClient: deps.llmClient,
  };

  // 3. Build conversation context for DONE status
  const { context } = await buildDoneContext(conversationId, contextBuilderDeps);

  // 4. Process completion message with LLM (or generate rejection if DENIED)
  const { completionMessage } = await processCompletionMessage(
    context,
    conversation.screening_decision,
    streamOptions,
    completionProcessorDeps
  );

  // 5. Save completion message to messages table (full version)
  await deps.messageRepo.create({
    conversation_id: conversationId,
    sender: 'ASSISTANT',
    content: completionMessage,
  });

  // 6. Truncate/condense summary if needed for screening_summary field
  const summaryTruncatorDeps: SummaryTruncatorDependencies = {
    llmClient: deps.llmClient,
  };
  const { truncatedSummary } = await truncateScreeningSummary(
    completionMessage,
    context,
    summaryTruncatorDeps
  );

  // 7. Save truncated/condensed summary to conversation's screening_summary
  await deps.conversationRepo.update(conversationId, {
    screening_summary: truncatedSummary,
  });

  return completionMessage;
};
