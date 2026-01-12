/**
 * Main LLM Processor module.
 * Orchestrates prompt building, LLM interactions, and response handling.
 */
import {ChatMessage, LLMResponse, MessageRole, StreamOptions} from '../client';
import {ProcessorConfig, ProcessorRequest, ProcessorResponse} from './types';
import {buildConversationPrompt, ConversationContext} from './prompts';
import { JobRequirement } from '../../../entities/job-requirement';
import { buildAnswerCriteriaSystemPrompt } from './prompts/message-builders/requirements';
import { buildSystemMessage } from './prompts/message-builders/message';

export const buildAnswerCriteriaSystemMessage = (userMessage: string, requirement: JobRequirement): ChatMessage[] => 
    [buildSystemMessage(buildAnswerCriteriaSystemPrompt(userMessage, requirement))];

/**
 * Builds the complete message list to send to the LLM.
 * Handles both initial messages and continuing conversations.
 *
 * @param userMessage - The user's message
 * @param context - The conversation context
 * @returns Array of ChatMessage objects ready for the LLM
 */
const buildMessagesForLLM = (
    context: ConversationContext,
    userMessage?: string,
): ChatMessage[] => {
    const conversationMessages = buildConversationPrompt(context);
    if (userMessage) return [...conversationMessages, {role: MessageRole.USER, content: userMessage,}];
    return conversationMessages;
};


/**
 * Builds the complete message list including user and assistant messages for tracking.
 * This represents the full conversation history after processing a message.
 *
 * Note: The messagesSentToLLM array already includes the user message (from buildMessagesForLLM),
 * so we only need to add the assistant message here.
 *
 * @param messagesSentToLLM - Messages that were sent to the LLM (already includes user message)
 * @param assistantMessage - The assistant's response content
 * @returns Complete array of ChatMessage objects including user and assistant messages
 */
const buildCompleteMessages = (
    messagesSentToLLM: ChatMessage[],
    assistantMessage: string
): ChatMessage[] => ([...messagesSentToLLM, {role: MessageRole.ASSISTANT, content: assistantMessage}]);

/**
 * Creates a new LLM processor instance.
 *
 * @param config - Configuration for the processor (includes LLM client)
 * @returns Processor instance
 */
export const createProcessor = (config: ProcessorConfig) => {
    const {llmClient} = config;
    const {model} = llmClient;


    const handleStream = async (messages: ChatMessage[], streamOptions: StreamOptions) => {
        let assistantMessage: string = '';
        const {onChunk, onComplete, onError} = streamOptions;
        const wrappedOnChunk = (chunk: string) => {
            assistantMessage += chunk;
            onChunk(chunk);
        };
        await llmClient.streamMessage(messages, {...streamOptions, onChunk: wrappedOnChunk, onComplete, onError});
        const llmResponse: LLMResponse = {content: assistantMessage, model, metadata: {streaming: true}};
        const completeMessages = buildCompleteMessages(messages, assistantMessage);
        return {assistantMessage, messages: completeMessages, llmResponse,};
    }

    const handleNonStream = async (messages: ChatMessage[]): Promise<ProcessorResponse> => {
        const modelResponse = await llmClient.sendMessage(messages);
        const assistantMessage = modelResponse.content;
        const llmResponse: LLMResponse = {content: assistantMessage, model};
        const completeMessages = buildCompleteMessages(messages, assistantMessage);
        return {assistantMessage, messages: completeMessages, llmResponse,};
    }

    return async (request: ProcessorRequest): Promise<ProcessorResponse> => {
        const {context, userMessage, streamOptions} = request;
        const messages = buildMessagesForLLM(context, userMessage);
        console.log(`number of messages we are sending to the LLM: ${messages.length}`);
        messages.forEach(message => console.log(`[Processor]: Sending the following message to the LLM: ${message.role}: ${message.content}`));
        if (streamOptions) return handleStream(messages, streamOptions);
        return handleNonStream(messages);
    }
};


/**
 * Type for the processor instance returned by createProcessor.
 */
export type Processor = ReturnType<typeof createProcessor>;

// Re-export types
export type {ProcessorRequest, ProcessorResponse, ProcessorConfig} from './types';

