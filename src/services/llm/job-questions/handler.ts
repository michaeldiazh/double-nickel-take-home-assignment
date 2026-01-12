import { Pool } from 'pg';
import { LLMClient, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { createProcessor, Processor } from '../processor';
import { ConversationContextService } from '../../conversation-context/service';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { ConversationStatus } from '../../../entities/conversation/domain';
import { extractJSONObject, removeJSONFromText } from '../../criteria/parser/utils';

/**
 * Job Questions Handler - processes user questions during ON_JOB_QUESTIONS status.
 * 
 * This handler:
 * 1. Loads conversation context with job facts
 * 2. Sends user message to LLM with job facts prompt
 * 3. Returns assistant response (no parsing/evaluation needed)
 * 4. Handles status transitions (DONE when user is satisfied)
 */
export class JobQuestionsHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private contextService: ConversationContextService;
  private processor: Processor;

  constructor(client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
    this.contextService = new ConversationContextService(client);
    this.processor = createProcessor({ llmClient });
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
    try {
      // 1. Save user message
      await this.saveUserMessage(conversationId, userMessage);

      // 2. Load conversation context and validate status
      const context = await this.loadAndValidateContext(conversationId);

      // 3. Process user question through LLM with job facts (get raw response with JSON)
      // NOTE: We don't stream here - we'll get the full response, clean it, then stream the clean version
      const processorResponse = await this.processor({
        userMessage,
        context,
        isInitialMessage: false,
        // Don't pass streamOptions - we'll stream the cleaned message manually
      });

      const rawAssistantMessage = processorResponse.assistantMessage;

      // 4. Parse JSON response from LLM
      const parseResult = this.parseJobQuestionResponse(rawAssistantMessage);
      
      // Extract message from JSON if available, otherwise use raw message
      // Clean the message to remove any JSON that might be included
      let assistantMessage = parseResult.message || rawAssistantMessage;
      
      // Clean JSON from the message (in case JSON parsing failed but JSON is still in the message)
      assistantMessage = removeJSONFromText(assistantMessage);
      
      // If we have streamOptions, stream the cleaned message
      if (streamOptions && assistantMessage) {
        // Stream the clean message character by character
        for (const char of assistantMessage) {
          streamOptions.onChunk(char);
        }
        streamOptions.onComplete?.();
      }
      
      // 5. Save the clean message (without JSON) to the database
      await this.saveAssistantMessage(conversationId, assistantMessage);
      
      // Check if user wants to continue or is done
      const continueWithQuestion = parseResult.continueWithQuestion ?? true; // Default to true if parsing failed

      // 6. Handle status transitions
      if (!continueWithQuestion) {
        // User is done - transition to DONE status
        await this.conversationRepo.update(conversationId, {
          conversation_status: ConversationStatus.DONE,
        });
        
        return {
          assistantMessage,
          newStatus: ConversationStatus.DONE,
        };
      }

      // User wants to continue - stay in ON_JOB_QUESTIONS
      return {
        assistantMessage,
        newStatus: ConversationStatus.ON_JOB_QUESTIONS,
      };
    } catch (error) {
      console.error(`Error in handleJobQuestion for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper: Loads conversation context and validates it's in ON_JOB_QUESTIONS status.
   */
  private async loadAndValidateContext(conversationId: string): Promise<ConversationContext> {
    const context = await this.contextService.loadFullContext(conversationId);
    
    if (context.status !== ConversationStatus.ON_JOB_QUESTIONS) {
      throw new Error(`Conversation ${conversationId} is not in ON_JOB_QUESTIONS status`);
    }
    
    return context;
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
   * Private helper: Parses JSON response from LLM for job questions.
   * Extracts continueWithQuestion and assistantMessage fields.
   * Falls back to null if JSON parsing fails (will use raw message and default to continuing).
   */
  private parseJobQuestionResponse(response: string): {
    continueWithQuestion: boolean | null;
    message: string | null;
  } {
    // Try to extract JSON from response
    const jsonObject = extractJSONObject(response);
    
    if (jsonObject && typeof jsonObject === 'object') {
      const continueWithQuestion = typeof jsonObject.continueWithQuestion === 'boolean' 
        ? jsonObject.continueWithQuestion 
        : null;
      const message = typeof jsonObject.assistantMessage === 'string'
        ? jsonObject.assistantMessage
        : null;
      
      return { continueWithQuestion, message };
    }
    
    // If JSON parsing failed, return null (will use raw message and default to continuing)
    return { continueWithQuestion: null, message: null };
  }
}
