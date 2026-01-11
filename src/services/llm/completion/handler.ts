import { Pool } from 'pg';
import { LLMClient, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { JobFactRepository } from '../../../entities/job-fact/repository';
import { createProcessor, Processor } from '../processor';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { ConversationStatus } from '../../../entities';
import { MessageRole, ChatMessage } from '../client';
import { ConversationJobRequirement } from '../../../entities/conversation-job-requirement/domain';

/**
 * Completion Handler - sends final completion message when conversation is DONE.
 * 
 * This handler:
 * 1. Builds conversation context for DONE status (can't use ConversationContextService.loadFullContext
 *    because it requires getNextPending, which fails for DONE conversations)
 * 2. Generates final completion/summary message using completion prompt
 * 3. Saves the completion message
 */
export class CompletionHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;
  private jobRequirementRepo: JobRequirementRepository;
  private jobFactRepo: JobFactRepository;
  private readonly processor: Processor;

  constructor(client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
    this.jobRequirementRepo = new JobRequirementRepository(client);
    this.jobFactRepo = new JobFactRepository(client);
    this.processor = createProcessor({ llmClient });
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

    // 2. Build conversation context for DONE status
    const context = await this.buildDoneContext(conversationId);

    // 3. Generate completion message using processor
    const processorResponse = await this.processor({
      userMessage: '',
      context,
      isInitialMessage: false,
      streamOptions,
    });

    const completionMessage = processorResponse.assistantMessage;

    // 4. Save completion message
    await this.saveCompletionMessage(conversationId, completionMessage);

    return completionMessage;
  }

  /**
   * Private helper: Builds conversation context for DONE status.
   * Similar to ConversationContextService.loadFullContext but handles DONE status
   * (can't use getNextPending since all requirements are completed).
   */
  private async buildDoneContext(conversationId: string): Promise<ConversationContext> {
    // Get conversation context (user, job info)
    const repoContext = await this.conversationRepo.getContext(conversationId);
    if (!repoContext) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get all job requirements
    const requirements = await this.jobRequirementRepo.getByJobId(repoContext.job_id);

    // Get conversation requirements
    const conversationRequirements = await this.conversationJobRequirementRepo.getConversationRequirements(conversationId);

    // Get job facts
    const jobFacts = await this.jobFactRepo.getByJobId(repoContext.job_id);

    // Get message history
    const messages = await this.messageRepo.getByConversationId(conversationId);
    const messageHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.sender === 'USER' ? MessageRole.USER :
            msg.sender === 'ASSISTANT' ? MessageRole.ASSISTANT :
            MessageRole.SYSTEM,
      content: msg.content,
    }));

    // Map conversation requirements
    const mappedRequirements: ConversationJobRequirement[] = conversationRequirements.map(cr => ({
      id: cr.conversation_job_requirement_id,
      conversation_id: conversationId,
      job_requirement_id: cr.job_requirement_id,
      status: cr.status,
      extracted_value: cr.extracted_value,
      evaluated_at: cr.evaluated_at,
      message_id: cr.message_id,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // For DONE status, we need a current_requirement for the context structure
    // Use the last requirement or first one as placeholder (won't be used by buildCompleteSystemPrompt)
    const currentRequirement = requirements[requirements.length - 1] || requirements[0];
    if (!currentRequirement) {
      throw new Error(`No requirements found for conversation ${conversationId}`);
    }

    return {
      user_first_name: repoContext.user_first_name,
      job_title: repoContext.job_title,
      job_facts: jobFacts,
      message_history: messageHistory,
      requirements: requirements,
      conversation_requirements: mappedRequirements,
      current_requirement: currentRequirement,
      status: ConversationStatus.DONE,
    };
  }

  /**
   * Private helper: Saves completion message.
   */
  private async saveCompletionMessage(conversationId: string, completionMessage: string): Promise<string> {
    return await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: completionMessage,
    });
  }
}
