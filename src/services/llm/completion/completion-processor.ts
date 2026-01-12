import { LLMClient, StreamOptions } from '../client';
import { Processor, createProcessor } from '../processor';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { buildCompleteSystemPrompt } from '../processor/prompts/question-prompt';

/**
 * Dependencies for processing completion message.
 */
export interface CompletionProcessorDependencies {
  llmClient: LLMClient;
}

/**
 * Result of processing completion message.
 */
export interface CompletionProcessorResult {
  completionMessage: string;
}

/**
 * Processes completion message with LLM for DONE status.
 * 
 * @param context - The conversation context for DONE status
 * @param streamOptions - Optional streaming options for real-time chunk delivery
 * @param deps - Dependencies for processing
 * @returns The completion message
 */
export const processCompletionMessage = async (
  context: ConversationContext,
  streamOptions: StreamOptions | undefined,
  deps: CompletionProcessorDependencies
): Promise<CompletionProcessorResult> => {
  const processor: Processor = createProcessor({ llmClient: deps.llmClient });
  const completeSystemPrompt = buildCompleteSystemPrompt(context);
  const processorResponse = await processor({
    context,
    isInitialMessage: false,
    streamOptions,
  }, completeSystemPrompt);
  const completionMessage = processorResponse.assistantMessage;

  return { completionMessage };
};
