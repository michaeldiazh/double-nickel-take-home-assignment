/**
 * Job Question Processor Module
 * 
 * Responsibility: Process user questions with LLM and parse response
 * - Sends user message to LLM with job facts context
 * - Parses JSON response (continueWithQuestion, assistantMessage)
 * - Cleans message to remove JSON artifacts
 */
import { LLMClient } from '../client';
import { Processor, createProcessor } from '../processor';
import { ConversationContext } from '../processor/prompts/prompt-context';
import { extractJSONObject, removeJSONFromText } from '../../criteria/parser/utils';

export interface JobQuestionProcessorDependencies {
  llmClient: LLMClient;
}

export interface JobQuestionProcessorResult {
  assistantMessage: string;
  continueWithQuestion: boolean; // Defaults to true if parsing fails
}

/**
 * Extracts the continueWithQuestion boolean value from a JSON object.
 * 
 * @param jsonObject - The JSON object to extract from
 * @returns The boolean value if present and valid, null otherwise
 */
const extractContinueWithQuestion = (jsonObject: unknown): boolean | null => {
  if (jsonObject && typeof jsonObject === 'object' && 'continueWithQuestion' in jsonObject) {
    return typeof jsonObject.continueWithQuestion === 'boolean' 
      ? jsonObject.continueWithQuestion 
      : null;
  }
  return null;
};

/**
 * Extracts the assistant message from a JSON object.
 * 
 * @param jsonObject - The JSON object to extract from
 * @returns The assistant message if present and valid, null otherwise
 */
const extractAssistantMessage = (jsonObject: unknown): string | null => {
  if (jsonObject && typeof jsonObject === 'object' && 'assistantMessage' in jsonObject) {
    return typeof jsonObject.assistantMessage === 'string' 
      ? jsonObject.assistantMessage 
      : null;
  }
  return null;
};

/**
 * Parses JSON response from LLM for job questions.
 * Extracts continueWithQuestion and assistantMessage fields.
 * Falls back to null if JSON parsing fails (will use raw message and default to continuing).
 * 
 * @param response - The raw LLM response
 * @returns Parsed result with continueWithQuestion and message
 */
const parseJobQuestionResponse = (response: string): {
  continueWithQuestion: boolean | null;
  message: string | null;
} => {
  // Try to extract JSON from response
  const jsonObject = extractJSONObject(response);
  
  if (jsonObject && typeof jsonObject === 'object') {
    const continueWithQuestion = extractContinueWithQuestion(jsonObject);
    const assistantMessage = extractAssistantMessage(jsonObject);
    return { continueWithQuestion, message: assistantMessage };
  }
  return { continueWithQuestion: null, message: null };
};

/**
 * Processes user question with LLM for job questions.
 * 
 * @param userMessage - The user's question
 * @param context - The conversation context
 * @param deps - Dependencies for processing
 * @returns Processed result with cleaned message and continue flag
 */
export const processJobQuestion = async (
  userMessage: string,
  context: ConversationContext,
  deps: JobQuestionProcessorDependencies
): Promise<JobQuestionProcessorResult> => {
  const processor: Processor = createProcessor({ llmClient: deps.llmClient });

  // Process user question through LLM with job facts (get raw response with JSON)
  // NOTE: We don't stream here - we'll get the full response, clean it, then stream the clean version
  const processorResponse = await processor({
    userMessage,
    context,
    isInitialMessage: false
  });

  const rawAssistantMessage = processorResponse.assistantMessage;

  // Parse JSON response from LLM
  const parseResult = parseJobQuestionResponse(rawAssistantMessage);
  
  // Extract message from JSON if available, otherwise use raw message
  // Clean the message to remove any JSON that might be included
  let assistantMessage = parseResult.message || rawAssistantMessage;
  
  // Clean JSON from the message (in case JSON parsing failed but JSON is still in the message)
  assistantMessage = removeJSONFromText(assistantMessage);

  // Default to true if parsing failed (user wants to continue)
  const continueWithQuestion = parseResult.continueWithQuestion ?? true;

  return {
    assistantMessage,
    continueWithQuestion,
  };
};
