import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { JobFactRepository } from '../../../entities/job-fact/repository';
import { ConversationContext } from '../../../domain/prompts/builders/types';
import { ConversationStatus, ScreeningDecision } from '../../../entities';
import { MessageRole, ChatMessage } from '../../../domain/llm/client';
import { ConversationJobRequirement } from '../../../entities/conversation-job-requirement/domain';

/**
 * Dependencies for building completion context.
 */
export interface ContextBuilderDependencies {
  conversationRepo: ConversationRepository;
  messageRepo: MessageRepository;
  conversationJobRequirementRepo: ConversationJobRequirementRepository;
  jobRequirementRepo: JobRequirementRepository;
  jobFactRepo: JobFactRepository;
}

/**
 * Result of building completion context.
 */
export interface ContextBuilderResult {
  context: ConversationContext;
  screeningDecision: ScreeningDecision;
}

/**
 * Builds conversation context for DONE status.
 * Similar to ConversationContextService.loadFullContext but handles DONE status
 * (can't use getNextPending since all requirements are completed).
 * 
 * @param conversationId - The conversation ID (should be in DONE status)
 * @param deps - Dependencies for building context
 * @returns The conversation context for DONE status
 */
export const buildDoneContext = async (
  conversationId: string,
  deps: ContextBuilderDependencies
): Promise<ContextBuilderResult> => {
  const {
    conversationRepo,
    messageRepo,
    conversationJobRequirementRepo,
    jobRequirementRepo,
    jobFactRepo,
  } = deps;

  // Get conversation context (user, job info)
  const repoContext = await conversationRepo.getContext(conversationId);
  if (!repoContext) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // Get all job requirements
  const requirements = await jobRequirementRepo.getByJobId(repoContext.job_id);

  // Get conversation requirements
  const conversationRequirements = await conversationJobRequirementRepo.getConversationRequirements(conversationId);

  // Get job facts
  const jobFacts = await jobFactRepo.getByJobId(repoContext.job_id);

  // Get message history
  const messages = await messageRepo.getByConversationId(conversationId);
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

  const context: ConversationContext = {
    conversation_id: conversationId,
    user_first_name: repoContext.user_first_name,
    job_title: repoContext.job_title,
    job_facts: jobFacts,
    message_history: messageHistory,
    requirements: requirements,
    conversation_requirements: mappedRequirements,
    current_requirement: currentRequirement,
    status: ConversationStatus.DONE,
  };

  return { 
    context,
    screeningDecision: repoContext.screening_decision,
  };
};
