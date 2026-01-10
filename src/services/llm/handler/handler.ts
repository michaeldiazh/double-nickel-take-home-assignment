/**
 * Main LLM Handler implementation.
 * Orchestrates the complete flow: starting conversations, processing messages, and managing context.
 */

import { createProcessor, Processor } from '../processor';
import type { 
  HandlerRequest, 
  HandlerResponse, 
  HandlerConfig, 
  StartConversationRequest,
  StartConversationResponse 
} from './types';
import { getCachedContext, cacheContext } from './context-cache';
import { loadFullContextFromConversationId } from './loaders';
import { startNewConversationContext } from './context-loader';
import { createMessage, MessageSender } from '../../../entities';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { MessageRole } from '../client';

/**
 * Helper function to get context from cache or load from database.
 * Checks cache first, and if not found, loads from database and caches it.
 * 
 * @param conversationId - The conversation ID to get context for
 * @returns Promise resolving to ConversationContext
 * @throws Error if conversation not found
 */
const getContext = async (conversationId: string): Promise<ConversationContext> => {
  // Check cache first
  const cachedContext = getCachedContext(conversationId);
  if (cachedContext) {
    return cachedContext;
  }
  
  // Cache miss - load full context from database
  const context = await loadFullContextFromConversationId(conversationId);
  
  if (!context) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  // Cache the loaded context
  cacheContext(conversationId, context);
  
  return context;
};

/**
 * Creates a new LLM handler instance.
 * 
 * @param config - Configuration for the handler (includes LLM client and database pool)
 * @returns Handler instance with handleMessage and startConversation methods
 */
export const createHandler = (config: HandlerConfig) => {
  const { llmClient, dbPool } = config;
  
  // Create processor
  const processor: Processor = createProcessor({ llmClient });
  
  /**
   * Handles processing a user message in an existing conversation.
   * 
   * @param request - Request to process a user message
   * @returns Promise resolving to HandlerResponse
   */
  const handleMessage = async (request: HandlerRequest): Promise<HandlerResponse> => {
    const { userMessage, conversationId } = request;
    
    // Step 1: Get context from cache or load from database
    const context = await getContext(conversationId);
    
    // Step 2: Save user message to database
    await createMessage(dbPool, conversationId, MessageSender.USER, userMessage);
    
    // Step 3: Process message through LLM processor
    const processorResponse = await processor({
      userMessage,
      context,
      isInitialMessage: context.status === 'START',
    });
    
    const { assistantMessage } = processorResponse;
    
    // Step 4: Save assistant message to database
    await createMessage(dbPool, conversationId, MessageSender.ASSISTANT, assistantMessage);
    
    // Step 5: Update context with new messages
    const updatedContext: ConversationContext = {
      ...context,
      messageHistory: [
        ...context.messageHistory,
        { role: MessageRole.USER, content: userMessage },
        { role: MessageRole.ASSISTANT, content: assistantMessage },
      ],
    };
    
    // Step 6: Update cache with new context
    cacheContext(conversationId, updatedContext);
    
    // Step 7: Determine if conversation is complete
    // For now, we'll determine this based on status
    // (We'll add more logic later when we implement requirement evaluation)
    const isComplete = updatedContext.status === 'DONE';
    
    // Step 8: Return response
    return {
      assistantMessage,
      isComplete,
      context: updatedContext,
    };
  };
  
  /**
   * Starts a new conversation by creating conversation context and generating initial greeting.
   * 
   * This function:
   * 1. Creates conversation and conversation requirements (via startNewConversationContext)
   * 2. Generates initial greeting via LLM using processor (which routes to START prompt based on context status)
   * 3. Saves the assistant greeting message to database
   * 4. Updates context with message history and caches it
   * 5. Returns the conversation ID, greeting, and context
   * 
   * @param request - Request to start a new conversation
   * @returns Promise resolving to StartConversationResponse
   */
  const startConversation = async (
    request: StartConversationRequest
  ): Promise<StartConversationResponse> => {
    const { applicationId } = request;
    
    // Step 1: Create conversation and conversation requirements
    const { conversationId, context } = await startNewConversationContext(
      dbPool,
      applicationId
    );
    
    // Step 2: Generate initial greeting via LLM using processor
    // Processor will use buildConversationPrompt which routes to buildInitialPrompt for START status
    // We pass an empty user message since this is the initial greeting
    const processorResponse = await processor({
      userMessage: '',
      context,
      isInitialMessage: true,
    });
    
    const { assistantMessage: greetingMessage } = processorResponse;
    
    // Step 3: Save assistant greeting message to database
    await createMessage(dbPool, conversationId, MessageSender.ASSISTANT, greetingMessage);
    
    // Step 4: Update context with the greeting message and cache it
    const updatedContext: ConversationContext = {
      ...context,
      messageHistory: [
        { role: MessageRole.ASSISTANT, content: greetingMessage },
      ],
    };
    
    cacheContext(conversationId, updatedContext);
    
    // Step 5: Return response
    return {
      conversationId,
      greetingMessage,
      context: updatedContext,
    };
  };
  
  return {
    handleMessage,
    startConversation,
  };
};

/**
 * Handler type - the return type of createHandler
 */
export type Handler = ReturnType<typeof createHandler>;

