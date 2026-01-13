import { Pool } from 'pg';
import { LLMClient, ChatMessage, MessageRole, StreamOptions } from '../../../domain/llm/client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { ConversationRequirementWithJob } from '../../../entities/conversation-job-requirement/domain';
import { ApplicationRepository } from '../../../entities/application/repository';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { parseYesNoSimple, buildYesNoParsingPrompt, type YesNoParseResult } from './parser';
import { buildPendingGreetingSystemPromptMessage, buildGoodLuckSystemPromptMessage } from '../../../domain/prompts/builders/message-builders/greeting';
import { buildRequirementSystemMessage } from '../../../domain/prompts/builders/message-builders/requirements';
import { JobRequirement } from '../../../entities/job-requirement/domain';
import { ScreeningDecision, ConversationStatus } from '../../../entities/conversation/domain';

/**
 * Greeting handler - handles initial greeting and user responses to greeting.
 * 
 * This handler:
 * 1. Sends initial greeting when conversation is created (PENDING status)
 * 2. Handles user's yes/no response to the initial greeting
 *    - If "no": Updates conversation to DENIED, sends good luck message
 *    - If "yes": Creates requirements, sends first requirement question, updates to ON_REQ
 */
export class GreetingHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;
  private applicationRepo: ApplicationRepository;
  private jobRequirementRepo: JobRequirementRepository;

  constructor(private client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
    this.applicationRepo = new ApplicationRepository(client);
    this.jobRequirementRepo = new JobRequirementRepository(client);
  }

  /**
   * Send initial greeting to user asking if they want to continue with pre-approval.
   * 
   * The conversation should have status PENDING when this is called.
   * 
   * @param conversationId - The conversation ID (should have PENDING status)
   * @param streamOptions - Optional streaming options for real-time chunk delivery (for WebSocket)
   * @returns The complete greeting message from the assistant
   */
  async sendInitialGreeting(
    conversationId: string,
    streamOptions?: StreamOptions
  ): Promise<string> {
    // 1. Load conversation context (user, job info)
    const context = await this.conversationRepo.getContext(conversationId);
    
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Build system prompt using the prompt builder
    const systemPrompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: context.user_first_name,
      job_title: context.job_title,
    });
    
    // 3. Create messages for LLM
    const messages: ChatMessage[] = [
      {
        role: MessageRole.SYSTEM,
        content: systemPrompt,
      },
    ];

    // 4. Get LLM response (streaming or non-streaming)
    const assistantMessage = await this.getLLMResponse(messages, streamOptions);

    // 5. Validate that we received a message
    if (!assistantMessage || assistantMessage.trim().length === 0) {
      throw new Error('Received empty response from LLM');
    }

    // 6. Save complete assistant message to database
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: assistantMessage,
    });

    // 7. Return complete greeting message
    return assistantMessage;
  }

  /**
   * Handle user's response to the initial greeting.
   * 
   * @param conversationId - The conversation ID (should have PENDING status)
   * @param userMessage - The user's yes/no response
   * @param streamOptions - Optional streaming options for real-time chunk delivery (for WebSocket)
   * @returns Result with the assistant's response and new status
   */
  async handleResponse(
    conversationId: string,
    userMessage: string,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
    status: 'DENIED' | 'START';
  }> {
    // 1. Save user message
    await this.saveUserMessage(conversationId, userMessage);

    // 2. Parse yes/no response
    const parseResult = await this.parseYesNoResponse(userMessage);

    // Validate parse result - throw if ambiguous
    this.validateParseResult(parseResult);

    // 3. Handle based on response
    if (!parseResult.wantsToContinue) {
      // User declined - set to DENIED and send good luck message
      return await this.handleDecline(conversationId, streamOptions);
    } else {
      // User accepted - create requirements and send greeting
      return await this.handleAccept(conversationId, streamOptions);
    }
  }

  /**
   * Parse yes/no response using simple keyword parser or LLM-assisted parsing.
   */
  private async parseYesNoResponse(userMessage: string): Promise<YesNoParseResult> {
    // Try simple parser first
    const simpleResult = parseYesNoSimple(userMessage);
    
    if (simpleResult.success) {
      return simpleResult;
    }

    // If ambiguous, use LLM-assisted parsing
    return await this.parseYesNoWithLLM(userMessage);
  }

  /**
   * Parse yes/no using LLM when simple parsing is ambiguous.
   */
  private async parseYesNoWithLLM(userMessage: string): Promise<YesNoParseResult> {
    const prompt = buildYesNoParsingPrompt(userMessage);
    
    const messages: ChatMessage[] = [
      {
        role: MessageRole.SYSTEM,
        content: prompt,
      },
    ];

    const llmResponse = await this.llmClient.sendMessage(messages);
    const responseText = llmResponse.content;

    return this.parseYesNoWithLLMResponse(responseText);
  }

  /**
   * Parse yes/no response using LLM.
   * 
   * @param responseText - The response text from the LLM
   * @returns The parsed yes/no response
   */
  private parseYesNoWithLLMResponse(responseText: string): YesNoParseResult {
    try {
      const json = JSON.parse(responseText);
      return {
        success: true,
        wantsToContinue: json.wants_to_continue === true,
        confidence: json.confidence || 0.8,
        needsClarification: false,
      };
    } catch (error) {
      return {
        success: false,
        wantsToContinue: null,
        confidence: 0.5,
        needsClarification: true,
        error: 'Failed to parse LLM response',
      };
    }
  }

  /**
   * Handle user declining (no).
   * Updates conversation to DENIED and sends good luck message.
   */
  private async handleDecline(
    conversationId: string,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
    status: 'DENIED';
  }> {
    // Update conversation - user canceled, set to DONE
    await this.conversationRepo.update(conversationId, {
      screening_decision: ScreeningDecision.USER_CANCELED,
      conversation_status: ConversationStatus.DONE,
      is_active: false,
    });

    // Load context for good luck message
    const context = await this.conversationRepo.getContext(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Build good luck message prompt
    const goodLuckPrompt = buildGoodLuckSystemPromptMessage({
      user_first_name: context.user_first_name,
      job_title: context.job_title,
    });

    const messages: ChatMessage[] = [{ role: MessageRole.SYSTEM, content: goodLuckPrompt }];

    // Get LLM response (streaming or non-streaming)
    const assistantMessage = await this.getLLMResponse(messages, streamOptions);

    // Save assistant message
    await this.saveAssistantMessage(conversationId, assistantMessage);

    return {assistantMessage, status: 'DENIED'};
  }

  /**
   * Handle user accepting (yes).
   * Creates requirements, sends greeting, updates to ON_REQ.
   */
  private async handleAccept(
    conversationId: string,
    streamOptions?: StreamOptions
  ): Promise<{
    assistantMessage: string;
    status: 'START';
  }> {
    // Ensure requirements are created and get the first pending requirement
    const { jobRequirement, jobTitle } = await this.ensureRequirementsCreatedAndGetFirst(conversationId);

    // Build requirement prompt (first requirement question)
    const greetingPrompt = buildRequirementSystemMessage(
      jobTitle,
      jobRequirement
    );

    const messages: ChatMessage[] = [
      {
        role: MessageRole.SYSTEM,
        content: greetingPrompt,
      },
    ];

    // Get LLM response (streaming or non-streaming)
    const assistantMessage = await this.getLLMResponse(messages, streamOptions);

    // Save assistant message
    await this.saveAssistantMessage(conversationId, assistantMessage);

    // Update conversation - user accepted, requirements created, move directly to ON_REQ
    await this.conversationRepo.update(conversationId, {
      conversation_status: ConversationStatus.ON_REQ,
    });

    return {
      assistantMessage,
      status: 'START',
    };
  }

  /**
   * Private helper: Ensures conversation job requirements are created and returns the first pending requirement.
   * 
   * @param conversationId - The conversation ID
   * @returns The first pending JobRequirement and job title
   */
  private async ensureRequirementsCreatedAndGetFirst(conversationId: string): Promise<{
    jobRequirement: JobRequirement;
    jobTitle: string;
  }> {
    // Get conversation to find application
    const conversation = await this.conversationRepo.getById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get application to find job_id
    const application = await this.applicationRepo.getById(conversation.application_id);
    if (!application) {
      throw new Error(`Application ${conversation.application_id} not found`);
    }

    // Create conversation job requirements (top 3)
    await this.conversationJobRequirementRepo.createForConversation(
      conversationId,
      application.job_id
    );

    // Get the first pending requirement
    const nextRequirement = await this.getFirstPendingRequirement(conversationId);

    // Get the actual JobRequirement entity
    const jobRequirement = await this.jobRequirementRepo.getById(nextRequirement.job_requirement_id);
    if (!jobRequirement) {
      throw new Error(`Job requirement ${nextRequirement.job_requirement_id} not found`);
    }

    // Load context for job title
    const context = await this.conversationRepo.getContext(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return {
      jobRequirement,
      jobTitle: context.job_title,
    };
  }

  /**
   * Private helper: Validates parse result and throws if ambiguous.
   * 
   * @param parseResult - The parse result to validate
   * @throws Error if the parse result is ambiguous or invalid
   */
  private validateParseResult(parseResult: YesNoParseResult): void {
    if (!parseResult.success || parseResult.wantsToContinue === null) {
      // Ambiguous - ask for clarification
      throw new Error('Ambiguous response - need clarification');
    }
  }

  /**
   * Private helper: Gets the first pending conversation job requirement.
   * 
   * @param conversationId - The conversation ID
   * @returns The first pending ConversationRequirementWithJob
   */
  private async getFirstPendingRequirement(conversationId: string): Promise<ConversationRequirementWithJob> {
    const nextRequirement = await this.conversationJobRequirementRepo.getNextPending(conversationId);
    if (!nextRequirement) {
      throw new Error(`No pending requirements found for conversation ${conversationId}`);
    }
    return nextRequirement;
  }

  /**
   * Private helper: Gets LLM response (streaming or non-streaming).
   * Chooses appropriate method based on streamOptions.
   */
  private async getLLMResponse(
    messages: ChatMessage[],
    streamOptions?: StreamOptions
  ): Promise<string> {
    return streamOptions
      ? await this.streamAndAccumulateMessage(messages, streamOptions)
      : await this.sendMessage(messages);
  }

  /**
   * Private helper: Streams message from LLM and accumulates the complete response.
   * Accumulates chunks while forwarding them via the onChunk callback.
   */
  private async streamAndAccumulateMessage(
    messages: ChatMessage[],
    streamOptions: StreamOptions
  ): Promise<string> {
    let assistantMessage = '';
    let streamingError: Error | null = null;
    const {onChunk, onComplete, onError} = streamOptions;
    
    const wrappedOnChunk = (chunk: string) => {
      assistantMessage += chunk;
      onChunk(chunk);
    };
    
    const wrappedOnError = (error: Error) => {
      streamingError = error;
      onError?.(error);
    };
    
    await this.llmClient.streamMessage(messages, {
      onChunk: wrappedOnChunk,
      onComplete,
      onError: wrappedOnError,
    });
    
    // If an error occurred during streaming, throw it
    if (streamingError) {
      throw streamingError;
    }
    
    return assistantMessage;
  }

  /**
   * Private helper: Sends non-streaming message to LLM and returns the complete response.
   */
  private async sendMessage(messages: ChatMessage[]): Promise<string> {
    const llmResponse = await this.llmClient.sendMessage(messages);
    return llmResponse.content;
  }

  private async saveUserMessage(conversationId: string, userMessage: string): Promise<void> {
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'USER',
      content: userMessage,
    });
  }

  private async saveAssistantMessage(conversationId: string, assistantMessage: string): Promise<void> {
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',
      content: assistantMessage,
    });
  }
}
