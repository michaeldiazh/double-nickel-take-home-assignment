import { Pool } from 'pg';
import { LLMClient, ChatMessage, MessageRole, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { buildPendingGreetingSystemPromptMessage } from './prompt-builder';

/**
 * Greeting initial handler - sends initial greeting to user when conversation is created (PENDING status).
 * 
 * This handler:
 * 1. Loads conversation context (user, job info)
 * 2. Builds a system prompt asking if user wants to continue with pre-approval (yes/no)
 * 3. Streams response from LLM
 * 4. Saves the assistant message to database
 * 5. Returns the greeting message
 */
export class GreetingInitialHandler {
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;

  constructor(private client: Pool, private llmClient: LLMClient) {
    this.conversationRepo = new ConversationRepository(client);
    this.messageRepo = new MessageRepository(client);
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

    // 2. Build system prompt using the prompt builder (follows same pattern as introduction.ts)
    const systemPrompt = buildPendingGreetingSystemPromptMessage({
      user_first_name: context.user_first_name,
      job_title: context.job_title,
    });
    
    // 3. Create messages for LLM (using ChatMessage for now - will refactor later)
    const messages: ChatMessage[] = [
      {
        role: MessageRole.SYSTEM,
        content: systemPrompt,
      },
    ];

    // 4. Get LLM response (streaming or non-streaming)
    const assistantMessage = await this.getLLMResponse(messages, streamOptions);

    // 5. Validate that we received a message (should never be empty, but handle gracefully)
    if (!assistantMessage || assistantMessage.trim().length === 0) {
      throw new Error('Received empty response from LLM');
    }

    // 6. Save complete assistant message to database
    await this.messageRepo.create({
      conversation_id: conversationId,
      sender: 'ASSISTANT',  // Direct string literal - MessageSender is just a type
      content: assistantMessage,
    });

    // 7. Return complete greeting message
    return assistantMessage;
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
   * Throws error if streaming fails or if no chunks are received.
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
}
