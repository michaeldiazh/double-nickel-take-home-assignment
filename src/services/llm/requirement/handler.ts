import { Pool } from 'pg';
import { LLMClient, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { ConversationJobRequirement, UpdateConversationJobRequirement } from '../../../entities/conversation-job-requirement/domain';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { JobRequirement } from '../../../entities/job-requirement/domain';
import { createProcessor, Processor } from '../processor';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { ConversationContextService } from '../../conversation-context/service';
import { parseLLMResponse, ParseResult } from '../../criteria/parser';
import { removeJSONFromText, extractJSONObject } from '../../criteria/parser/utils';
import { evaluateRequirement } from '../../criteria/handlers/router';
import { ConversationStatus, ScreeningDecision } from '../../../entities/conversation/domain';
import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import { ConversationRequirementValue, JobRequirementCriteria, JobRequirementType, isJobRequirementType } from '../../criteria/criteria-types';

/**
 * Requirement handler - processes user responses during ON_REQ status.
 * 
 * This handler:
 * 1. Loads conversation context with current requirement
 * 2. Sends user message to LLM with requirement prompt
 * 3. Parses LLM response to extract value and assessment
 * 4. Evaluates requirement against criteria
 * 5. Updates conversation_job_requirement with status and value
 * 6. Handles status transitions (next requirement, all met, not met)
 */
export class RequirementHandler {
  /**
   * Maximum number of follow-up questions we'll ask before giving up.
   * After this many clarifications, we mark the requirement as NOT_MET.
   */
  private static readonly MAX_FOLLOW_UPS = 2;
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;
  private jobRequirementRepo: JobRequirementRepository;
  private contextService: ConversationContextService;
  private processor: Processor;

  constructor(client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
    this.jobRequirementRepo = new JobRequirementRepository(client);
    this.contextService = new ConversationContextService(client);
    this.processor = createProcessor({ llmClient });
  }

  /**
   * Process user's response to a requirement question.
   * 
   * @param conversationId - The conversation ID
   * @param userMessage - The user's response
   * @param streamOptions - Optional streaming options for real-time chunk delivery
   * @returns Result with assistant message and updated status
   */
  async handleRequirementResponse(
    conversationId: string,
    userMessage: string,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
    newStatus: ConversationStatus;
    requirementMet: boolean | null; // null if still pending
  }> {
    // 1. Save user message
    await this.saveUserMessage(conversationId, userMessage);

    // 2. Load conversation context and validate status
    const context = await this.loadAndValidateContext(conversationId);

    // 3. Get current conversation requirement
    const { currentRequirement } = this.getCurrentConversationRequirement(context);

    // 4. Process user response through LLM (get raw response with JSON)
    const { assistantMessage: rawAssistantMessage } = await this.processUserResponse(
      conversationId,
      userMessage,
      context,
      streamOptions
    );
    
    // 5. Parse LLM response to extract value, assessment, and message
    const parseResult = parseLLMResponse(currentRequirement.requirement_type, rawAssistantMessage);
    
    // Extract message from JSON if available, otherwise fall back to raw message (for backward compatibility)
    // Clean the message to remove any JSON that might have been included in the message field
    const extractedMessage = parseResult.message || rawAssistantMessage;
    const assistantMessage = parseResult.message ? removeJSONFromText(extractedMessage) : extractedMessage;
    
    // 5a. Save the clean message (without JSON) to the database
    const messageId = await this.saveAssistantMessage(conversationId, assistantMessage);

    // 5a. Check if clarification is needed
    // If parsing failed, the assistantMessage IS already the follow-up question asking the user to clarify
    if (parseResult.needsClarification) {
      return await this.handleFollowUpClarification(
        conversationId,
        currentRequirement.id,
        assistantMessage,
        messageId
      );
    }

    // 6. Evaluate requirement against criteria
    const evaluationResult = this.runCriteriaEvaluation(
      parseResult,
      currentRequirement.requirement_type,
      currentRequirement.criteria
    );

    // 7. Update conversation_job_requirement
    await this.updateConversationRequirement(
      conversationId,
      currentRequirement.id,
      {
        extracted_value: parseResult.value ?? null,
        status: evaluationResult ?? RequirementStatus.PENDING,
        evaluated_at: evaluationResult ? new Date() : null,
        message_id: messageId,
      }
    );

    // 8. Handle status transitions (check before saving confirmation message)
    const newStatus = await this.handleStatusTransition(
      conversationId,
      currentRequirement.id,
      evaluationResult
    );

    // 9. Handle transitions after requirement is met
    if (evaluationResult === RequirementStatus.MET) {
      if (newStatus === ConversationStatus.ON_REQ) {
        // More requirements to ask - generate next question (skip confirmation)
        const updatedContext = await this.contextService.loadFullContext(conversationId);
        const nextRequirement = await this.conversationJobRequirementRepo.getNextPending(conversationId);
        
        if (nextRequirement) {
          // Generate the next requirement question
          // Don't stream automatic transitions - send complete message at once
          const nextRequirementObj = await this.jobRequirementRepo.getById(nextRequirement.job_requirement_id);
          if (nextRequirementObj) {
            const nextQuestionMessage = await this.generateNextRequirementQuestion(
              conversationId,
              updatedContext,
              nextRequirementObj,
              undefined // No streaming for automatic transitions
            );
            
            return {
              assistantMessage: nextQuestionMessage,
              newStatus,
              requirementMet: true,
            };
          }
        }
      } else if (newStatus === ConversationStatus.ON_JOB_QUESTIONS) {
        // All requirements met - generate initial job questions message (skip confirmation)
        // Don't stream automatic transitions - send complete message at once
        const updatedContext = await this.contextService.loadFullContext(conversationId);
        const jobQuestionsMessage = await this.generateInitialJobQuestionsMessage(
          conversationId,
          updatedContext,
          undefined // No streaming for automatic transitions
        );
        
        return {
          assistantMessage: jobQuestionsMessage,
          newStatus,
          requirementMet: true,
        };
      }
    }

    // Return confirmation message (only if we're not transitioning)
    return {
      assistantMessage,
      newStatus,
      requirementMet: evaluationResult === 'MET' ? true : 
                      evaluationResult === 'NOT_MET' ? false : null,
    };
  }

  /**
   * Private helper: Loads conversation context and validates it's in START or ON_REQ status.
   * START is a transient state after user accepts greeting, before moving to ON_REQ.
   */
  private async loadAndValidateContext(conversationId: string): Promise<ConversationContext> {
    const context = await this.contextService.loadFullContext(conversationId);
    
    if (context.status !== ConversationStatus.START && context.status !== ConversationStatus.ON_REQ) {
      throw new Error(`Conversation ${conversationId} is not in START or ON_REQ status (current: ${context.status})`);
    }
    
    return context;
  }

  /**
   * Private helper: Gets the current requirement and conversation requirement from context.
   */
  private getCurrentConversationRequirement(context: ConversationContext): {
    currentRequirement: JobRequirement;
    conversationRequirement: ConversationJobRequirement;
  } {
    const currentRequirement = context.current_requirement;
    if (!currentRequirement) {
      throw new Error('current_requirement is required for requirement handler');
    }
    const conversationRequirement = context.conversation_requirements.find(
      cr => cr.job_requirement_id === currentRequirement.id
    );
    
    if (!conversationRequirement) {
      throw new Error(`Conversation requirement not found for requirement ${currentRequirement.id}`);
    }
    
    return { currentRequirement, conversationRequirement };
  }

  /**
   * Private helper: Processes user response through LLM and returns raw assistant message.
   * Note: Does NOT save to database - caller will parse JSON and save clean message.
   */
  private async processUserResponse(
    conversationId: string,
    userMessage: string,
    context: ConversationContext,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
  }> {
    const processorResponse = await this.processor({
      userMessage,
      context,
      isInitialMessage: false,
      streamOptions,
    });

    const assistantMessage = processorResponse.assistantMessage;

    return { assistantMessage };
  }

  /**
   * Private helper: Runs criteria evaluation on parsed LLM response.
   */
  private runCriteriaEvaluation(
    parseResult: ParseResult<ConversationRequirementValue>,
    requirementType: JobRequirementType,
    criteria: JobRequirementCriteria
  ): RequirementStatus | null {
    if (parseResult.success && parseResult.value) {
    return evaluateRequirement( requirementType, criteria, parseResult.value );
    } else if (parseResult.assessment) {
      // Use LLM's assessment if parsing failed but assessment is available
      return parseResult.assessment as RequirementStatus;
    }
    return null;
  }



  /**
   * Private helper: Handles follow-up clarification logic.
   * 
   * Checks if we've exceeded the follow-up threshold. If so, marks requirement as NOT_MET.
   * Otherwise, returns the follow-up question to the user.
   */
  private async handleFollowUpClarification(
    conversationId: string,
    jobRequirementId: string,
    assistantMessage: string,
    messageId: string
  ): Promise<{
    assistantMessage: string;
    newStatus: ConversationStatus;
    requirementMet: boolean | null;
  }> {
    // Check if we've exceeded the follow-up threshold
    const followUpCount = await this.countFollowUpsForRequirement(conversationId, jobRequirementId);
    
    if (followUpCount >= RequirementHandler.MAX_FOLLOW_UPS) {
      // Exceeded threshold - mark as NOT_MET and update requirement
      await this.updateConversationRequirement(
        conversationId,
        jobRequirementId,
        {
          status: RequirementStatus.NOT_MET,
          extracted_value: null,
          evaluated_at: new Date(),
          message_id: messageId,
        }
      );

      // Handle status transition (NOT_MET might mean DENIED if required)
      const newStatus = await this.handleStatusTransition(
        conversationId,
        jobRequirementId,
        RequirementStatus.NOT_MET
      );

      return {
        assistantMessage,
        newStatus,
        requirementMet: false,
      };
    }

    // The assistant message has already been saved (messageId from step 4)
    // Just return it - it's the follow-up question asking the user for clarification
    return {
      assistantMessage,
      newStatus: ConversationStatus.ON_REQ,
      requirementMet: null,
    };
  }

  /**
   * Private helper: Counts how many times we've asked for clarification for this requirement.
   * 
   * Simple heuristic: If status is PENDING and message_id is set, we've asked at least once before.
   * Since we don't have a direct follow-up counter in the database, we use:
   * - If status is PENDING and message_id is set, we've asked once (this would be attempt #2)
   * - Return 1 in that case, so 1 >= 2 is false, allowing one more attempt
   * - After that, the pattern repeats, but since MAX_FOLLOW_UPS = 2, we allow:
   *   - First follow-up attempt (count = 0)
   *   - Second follow-up attempt (count = 1, since message_id is set from first attempt)
   *   - Third attempt would hit threshold (count = 1 >= 2? no, but we're on attempt #2 already...)
   * 
   * Actually, let's simplify: if message_id is set, we've asked once. This is attempt #2.
   * So we should check: if message_id is set AND we're about to ask again, that's attempt #2.
   * After MAX_FOLLOW_UPS attempts, we stop.
   * 
   * For simplicity: count = 1 if message_id is set (meaning we've asked before)
   * Current attempt would be attempt #(count + 1), so if count = 1, this is attempt #2
   * If count + 1 >= MAX_FOLLOW_UPS, stop (i.e., if count >= MAX_FOLLOW_UPS - 1)
   */
  private async countFollowUpsForRequirement(
    conversationId: string,
    jobRequirementId: string
  ): Promise<number> {
    // Get the conversation requirement to check current status
    const conversationRequirements = await this.conversationJobRequirementRepo.getConversationRequirements(conversationId);
    const conversationRequirement = conversationRequirements.find(
      cr => cr.job_requirement_id === jobRequirementId
    );

    if (!conversationRequirement) {
      return 0;
    }

    // Simple heuristic: if message_id is set, we've asked at least once before
    // This is a simplification - ideally we'd track follow-up count explicitly
    // For take-home, this prevents infinite loops: if we've asked once (message_id set),
    // this is attempt #2, so we allow it. After that, the check above will stop us.
    if (conversationRequirement.status === RequirementStatus.PENDING && conversationRequirement.message_id) {
      // We've asked once before - this would be attempt #2
      // Return 2 so that 2 >= MAX_FOLLOW_UPS (2) is true, stopping further attempts
      return RequirementHandler.MAX_FOLLOW_UPS; // This will trigger the threshold check
    }

    return 0; // First follow-up attempt
  }

  /**
   * Private helper: Parses LLM response for requirement evaluation.
   */
  private async parseRequirementResponse(
    requirementType: JobRequirementType,
    content: string
  ) {
    return parseLLMResponse(requirementType, content);
  }

  /**
   * Private helper: Updates conversation job requirement.
   */
  private async updateConversationRequirement(
    conversationId: string,
    jobRequirementId: string,
    data: UpdateConversationJobRequirement
  ): Promise<void> {
    await this.conversationJobRequirementRepo.update(conversationId, jobRequirementId, data);
  }

  /**
   * Private helper: Handles status transitions based on requirement evaluation.
   */
  private async handleStatusTransition(
    conversationId: string,
    currentJobRequirementId: string,
    evaluationResult: RequirementStatus | null
  ): Promise<ConversationStatus> {
    // If still pending, stay in ON_REQ
    if (!evaluationResult || evaluationResult === 'PENDING') {
      return ConversationStatus.ON_REQ;
    }

    // If not met and required, set to DENIED
    if (evaluationResult === 'NOT_MET') {
      // Check if requirement is required (from criteria)
      const conversationRequirement = await this.conversationJobRequirementRepo.getConversationRequirements(conversationId);
      const currentReq = conversationRequirement.find(cr => cr.job_requirement_id === currentJobRequirementId);
      
      if (currentReq) {
        // Get the job requirement to check if it's required
        const jobReq = await this.jobRequirementRepo.getById(currentJobRequirementId);
        if (jobReq) {
          if (jobReq.criteria.required) {
            // Required requirement not met - deny
            await this.conversationRepo.update(conversationId, {
              conversation_status: ConversationStatus.DONE,
              screening_decision: ScreeningDecision.DENIED,
              is_active: false,
            });
            return ConversationStatus.DONE;
          }
        }
      }
    }

    // Check if all requirements are completed
    const allCompleted = await this.conversationJobRequirementRepo.areAllCompleted(conversationId);
    
    if (allCompleted) {
      // All requirements met - move to job questions
      await this.conversationRepo.update(conversationId, {
        conversation_status: ConversationStatus.ON_JOB_QUESTIONS,
      });
      return ConversationStatus.ON_JOB_QUESTIONS;
    }

    // Still have more requirements - stay in ON_REQ
    return ConversationStatus.ON_REQ;
  }

  /**
   * Private helper: Saves user message and returns message ID.
   */
  private async saveUserMessage(conversationId: string, userMessage: string): Promise<string> {
    return await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'USER',
      content: userMessage,
    });
  }

  /**
   * Private helper: Saves assistant message and returns message ID.
   */
  private async saveAssistantMessage(conversationId: string, assistantMessage: string): Promise<string> {
    return await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: assistantMessage,
    });
  }

  /**
   * Private helper: Generates the next requirement question after a requirement is met.
   * Reloads context to get the next requirement and generates a question using the processor.
   */
  private async generateNextRequirementQuestion(
    conversationId: string,
    context: ConversationContext,
    nextRequirement: JobRequirement,
    streamOptions?: StreamOptions
  ): Promise<string> {
    // Build context with the next requirement
    const nextContext: ConversationContext = {
      ...context,
      current_requirement: nextRequirement,
    };

    // Use processor to generate the next requirement question
    // Pass empty user message since we're asking the next question
    const processorResponse = await this.processor({
      userMessage: '',
      context: nextContext,
      isInitialMessage: false,
      streamOptions,
    });

    const assistantMessage = processorResponse.assistantMessage;
    
    // Parse JSON if present and extract message
    const parseResult = parseLLMResponse(nextRequirement.requirement_type, assistantMessage);
    const cleanMessage = parseResult.message || assistantMessage;
    
    // Save the next question message
    await this.saveAssistantMessage(conversationId, cleanMessage);
    
    return cleanMessage;
  }

  /**
   * Private helper: Generates the initial job questions message when all requirements are met.
   * Uses the processor to generate a message based on job facts.
   */
  private async generateInitialJobQuestionsMessage(
    conversationId: string,
    context: ConversationContext,
    streamOptions?: StreamOptions
  ): Promise<string> {
    // Use processor to generate the initial job questions message
    // Pass empty user message since we're asking the first job question
    const processorResponse = await this.processor({
      userMessage: '',
      context,
      isInitialMessage: false,
      streamOptions,
    });

    const rawAssistantMessage = processorResponse.assistantMessage;
    
    // Parse JSON if present and extract message (for job questions, it should have continueWithQuestion and assistantMessage)
    const jsonObject = extractJSONObject(rawAssistantMessage);
    let cleanMessage = rawAssistantMessage;
    if (jsonObject && typeof jsonObject.assistantMessage === 'string') {
      cleanMessage = jsonObject.assistantMessage;
    }
    
    // Clean any remaining JSON that might be in the message
    cleanMessage = removeJSONFromText(cleanMessage);
    
    // Save the clean job questions message
    await this.saveAssistantMessage(conversationId, cleanMessage);
    
    return cleanMessage;
  }
}
