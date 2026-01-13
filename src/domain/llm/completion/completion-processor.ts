import { LLMClient, StreamOptions, MessageRole } from '../client';
import { Processor, createProcessor } from '../../../processor';
import { ConversationContext } from '../../../domain/prompts/builders/types';
import { buildCompleteSystemPrompt } from '../../../domain/prompts/builders/question-prompt';
import { ScreeningDecision } from '../../../entities';  

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
 * Always generates the full completion summary using LLM, regardless of screening_decision.
 * The LLM prompt already handles both APPROVED and DENIED cases by checking which requirements were met/not met.
 * 
 * @param context - The conversation context for DONE status
 * @param screeningDecision - The screening decision (DENIED, APPROVED, etc.) - used for context but doesn't change behavior
 * @param streamOptions - Optional streaming options for real-time chunk delivery
 * @param deps - Dependencies for processing
 * @returns The completion message
 */
export const processCompletionMessage = async (
  context: ConversationContext,
  screeningDecision: ScreeningDecision,
  streamOptions: StreamOptions | undefined,
  deps: CompletionProcessorDependencies
): Promise<CompletionProcessorResult> => {
  // Always use LLM to generate the full completion summary
  // Pass the screening decision to the prompt so it can explicitly state DENIED/APPROVED
  const processor: Processor = createProcessor({ llmClient: deps.llmClient });
  const completeSystemPrompt = buildCompleteSystemPrompt(context, screeningDecision);
  const processorResponse = await processor({
    context,
    isInitialMessage: false,
    streamOptions,
  }, completeSystemPrompt);
  const completionMessage = processorResponse.assistantMessage;

  return { completionMessage };
};
