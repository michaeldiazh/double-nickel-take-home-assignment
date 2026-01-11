import { Pool } from 'pg';
import { ConversationRepository } from '../../entities/conversation/repository';
import { MessageRepository } from '../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../entities/conversation-job-requirement/repository';
import { ConversationRequirementWithJob } from '../../entities/conversation-job-requirement/domain';
import { JobRequirementRepository } from '../../entities/job-requirement/repository';
import { JobRequirement } from '../../entities/job-requirement/domain';
import { JobFactRepository } from '../../entities/job-fact/repository';
import { Message } from '../../entities/message/domain';
import { ConversationStatus } from '../../entities/conversation/domain';
import { ConversationContext } from './types';
import { ChatMessage, MessageRole } from '../llm/client';

/**
 * Conversation Context Service
 * 
 * Handles loading full conversation context with requirements, messages, and job facts.
 * This service combines data from multiple repositories to build the ConversationContext
 * used by the LLM processor.
 */
export class ConversationContextService {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;
  private jobRequirementRepo: JobRequirementRepository;
  private jobFactRepo: JobFactRepository;

  constructor(client: Pool) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
    this.jobRequirementRepo = new JobRequirementRepository(client);
    this.jobFactRepo = new JobFactRepository(client);
  }

  /**
   * Loads full conversation context with requirements and messages.
   * 
   * This method combines data from multiple sources to build the ConversationContext
   * used by the LLM processor. It uses optimized PostgreSQL functions where available.
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to ConversationContext
   * @throws Error if conversation not found or required data is missing
   */
  async loadFullContext(conversationId: string): Promise<ConversationContext> {
    // Get conversation context (user, job info)
    const repoContext = await this.conversationRepo.getContext(conversationId);
    if (!repoContext) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get conversation to check status
    const conversation = await this.conversationRepo.getById(conversationId);
    if (!conversation) {
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
    const messageHistory = this.buildMessageHistory(messages);

    // Get current requirement (next pending)
    // For ON_JOB_QUESTIONS and DONE statuses, there are no pending requirements
    const nextRequirement = await this.conversationJobRequirementRepo.getNextPending(conversationId);
    let currentRequirement: JobRequirement | undefined;
    
    if (nextRequirement) {
      currentRequirement = this.findCurrentRequirement(requirements, nextRequirement);
    } else if (conversation.conversation_status !== ConversationStatus.ON_JOB_QUESTIONS && 
               conversation.conversation_status !== ConversationStatus.DONE) {
      // If no pending requirements and status is not ON_JOB_QUESTIONS or DONE, it's an error
      throw new Error(`No pending requirements found for conversation ${conversationId}`);
    }

    // Build ConversationContext
    // Map PENDING to START (PENDING is initial state, START is when user accepts)
    const status = conversation.conversation_status === ConversationStatus.PENDING
      ? ConversationStatus.START
      : conversation.conversation_status;
    
    // For ON_JOB_QUESTIONS and DONE, current_requirement is undefined
    const context: ConversationContext = {
      user_first_name: repoContext.user_first_name,
      job_title: repoContext.job_title,
      job_facts: jobFacts,
      message_history: messageHistory,
      requirements: requirements,
      conversation_requirements: this.mapConversationRequirements(conversationRequirements, conversationId),
      status,
      ...(currentRequirement && { current_requirement: currentRequirement }),
    } as ConversationContext;
    
    return context;
  }

  /**
   * Private helper: Maps database messages to ChatMessage format for LLM.
   */
  private buildMessageHistory(messages: Message[]): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.sender === 'USER' ? MessageRole.USER :
            msg.sender === 'ASSISTANT' ? MessageRole.ASSISTANT :
            MessageRole.SYSTEM,
      content: msg.content,
    }));
  }

  /**
   * Private helper: Finds the current requirement from requirements list.
   */
  private findCurrentRequirement(
    requirements: JobRequirement[],
    nextRequirement: ConversationRequirementWithJob
  ): JobRequirement {
    const currentRequirement = requirements.find(r => r.id === nextRequirement.job_requirement_id);
    if (!currentRequirement) {
      throw new Error(`Job requirement ${nextRequirement.job_requirement_id} not found`);
    }
    return currentRequirement;
  }

  /**
   * Private helper: Maps ConversationRequirementWithJob to ConversationJobRequirement format.
   */
  private mapConversationRequirements(
    conversationRequirements: ConversationRequirementWithJob[],
    conversationId: string
  ) {
    return conversationRequirements.map(cr => ({
      id: cr.conversation_job_requirement_id,
      conversation_id: conversationId,
      job_requirement_id: cr.job_requirement_id,
      status: cr.status,
      extracted_value: cr.extracted_value,
      evaluated_at: cr.evaluated_at,
      message_id: cr.message_id,
      created_at: new Date(), // ConversationRequirementWithJob doesn't have timestamps
      updated_at: new Date(),
    }));
  }

}
