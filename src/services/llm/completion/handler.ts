import { Pool } from 'pg';
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
 * Completion Handler - sends final completion message when conversation is DONE.
 * 
 * This handler uses functional modules to:
 * 1. Build conversation context for DONE status
 * 2. Process completion message with LLM
 * 3. Save the completion message
 */
export class CompletionHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;
  private jobRequirementRepo: JobRequirementRepository;
  private jobFactRepo: JobFactRepository;

  constructor(client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
    this.jobRequirementRepo = new JobRequirementRepository(client);
    this.jobFactRepo = new JobFactRepository(client);
  }

  /**
   * Send final completion message for a completed conversation.
   * 
   * @param conversationId - The conversation ID (should be in DONE status)
   * @param streamOptions - Optional streaming options for real-time chunk delivery
   * @returns The completion message
   */
  async sendCompletionMessage(
    conversationId: string,
    streamOptions?: StreamOptions
  ): Promise<string> {
    // 1. Validate conversation is in DONE status
    const conversation = await this.conversationRepo.getById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    if (conversation.conversation_status !== ConversationStatus.DONE) {
      throw new Error(`Conversation ${conversationId} is not in DONE status`);
    }

    // 2. Build dependencies for functional modules
    const contextBuilderDeps: ContextBuilderDependencies = {
      conversationRepo: this.conversationRepo,
      messageRepo: this.messageRepo,
      conversationJobRequirementRepo: this.conversationJobRequirementRepo,
      jobRequirementRepo: this.jobRequirementRepo,
      jobFactRepo: this.jobFactRepo,
    };

    const completionProcessorDeps: CompletionProcessorDependencies = {
      llmClient: this.llmClient,
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
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: completionMessage,
    });

    // 6. Truncate/condense summary if needed for screening_summary field
    const summaryTruncatorDeps: SummaryTruncatorDependencies = {
      llmClient: this.llmClient,
    };
    const { truncatedSummary } = await truncateScreeningSummary(
      completionMessage,
      context,
      summaryTruncatorDeps
    );

    // 7. Save truncated/condensed summary to conversation's screening_summary
    await this.conversationRepo.update(conversationId, {
      screening_summary: truncatedSummary,
    });

    return completionMessage;
  }
}
