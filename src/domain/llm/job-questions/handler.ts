import { Pool } from 'pg';
import { LLMClient, StreamOptions } from '../../../domain/llm/client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationContextService } from '../../conversation-context/service';
import { ConversationStatus } from '../../../entities/conversation/domain';
import {
  receiveJobQuestionMessage,
  processJobQuestion,
  routeJobQuestionState,
  MessageReceiverDependencies,
  JobQuestionProcessorDependencies,
  StateRouterDependencies,
} from './index';

/**
 * Job Questions Handler - processes user questions during ON_JOB_QUESTIONS status.
 * 
 * This handler uses functional modules to:
 * 1. Receive and validate user message
 * 2. Process user question with LLM and parse response
 * 3. Route next state based on user's intent to continue
 */
export class JobQuestionsHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private contextService: ConversationContextService;

  constructor(client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.contextService = new ConversationContextService(client);
  }

  /**
   * Process user's question about the job.
   * 
   * @param conversationId - The conversation ID
   * @param userMessage - The user's question
   * @param streamOptions - Optional streaming options for real-time chunk delivery
   * @returns Result with assistant message and updated status
   */
  async handleJobQuestion(
    conversationId: string,
    userMessage: string,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
    newStatus: ConversationStatus;
  }> {
    // Build dependencies for functional modules
    const messageReceiverDeps: MessageReceiverDependencies = {
      messageRepo: this.messageRepo,
      contextService: this.contextService,
    };

    const jobQuestionProcessorDeps: JobQuestionProcessorDependencies = {
      llmClient: this.llmClient,
    };

    const stateRouterDeps: StateRouterDependencies = {
      conversationRepo: this.conversationRepo,
    };

    // Step 1: Receive user message and load context
    const { context } = await receiveJobQuestionMessage(
      conversationId,
      userMessage,
      messageReceiverDeps
    );

    // Step 2: Process user question with LLM and parse response
    const { assistantMessage, continueWithQuestion } = await processJobQuestion(
      userMessage,
      context,
      jobQuestionProcessorDeps
    );

    // Step 3: Stream the cleaned message if needed
    if (streamOptions && assistantMessage) {
      // Stream the clean message character by character
      for (const char of assistantMessage.split('')) {
        streamOptions.onChunk(char);
      }
      streamOptions.onComplete?.();
    }

    // Step 4: Save the clean assistant message
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: assistantMessage,
    });

    // Step 5: Route next state based on user's intent to continue
    const { newStatus } = await routeJobQuestionState(
      conversationId,
      continueWithQuestion,
      stateRouterDeps
    );

    return {
      assistantMessage,
      newStatus,
    };
  }
}
