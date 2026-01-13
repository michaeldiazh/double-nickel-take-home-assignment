/**
 * Requirement LLM Processor Module
 * 
 * Responsibility: Send user message to LLM with criteria and parse response
 * - Builds prompt with criteria
 * - Sends to LLM
 * - Parses LLM response (extract value, assessment, message)
 * - Cleans message (remove JSON)
 */

import { LLMClient } from '../client';
import { ConversationContext } from '../../prompts/builders/types';
import { JobRequirement } from '../../../entities/job-requirement/domain';
import { parseLLMResponse, RequirementParseResult } from '../../criteria/parser';
import { ConversationRequirementValue } from '../../criteria/types';
import { buildAnswerCriteriaSystemMessage } from '../../../processor';

export interface LLMProcessorDependencies {
  llmClient: LLMClient;
}

export interface LLMProcessorResult {
  parseResult: RequirementParseResult<ConversationRequirementValue>;
  cleanedMessage: string;
  rawAssistantMessage: string;
  /**
   * Whether the user's message was ambiguous and needs clarification.
   * Determined by the parser based on whether it could successfully extract a value.
   */
  needsClarification: boolean;
}

/**
 * Gets criteria results from LLM by sending user message with requirement criteria.
 * 
 * @param userMessage - The user's message
 * @param currentRequirement - The current requirement being evaluated
 * @param llmClient - The LLM client to send the message to
 * @returns The raw assistant message from the LLM
 */
const getCriteriaResultsFromLLM = async (
  userMessage: string,
  currentRequirement: JobRequirement,
  llmClient: LLMClient
): Promise<string> => {
  console.log(`[RequirementLLMProcessor] getCriteriaResultsFromLLM called with userMessage: "${userMessage}", requirement: ${currentRequirement.id} (${currentRequirement.requirement_type})`);
  const answerCriteriaSystemMessage = buildAnswerCriteriaSystemMessage(userMessage, currentRequirement);
  console.log(`[RequirementLLMProcessor] Sending to LLM: ${JSON.stringify(answerCriteriaSystemMessage)}`);
  const llmResponse = await llmClient.sendMessage(answerCriteriaSystemMessage);
  console.log(`[RequirementLLMProcessor] LLM response: ${llmResponse.content}`);
  return llmResponse.content;
};

/**
 * Processes user message through LLM with criteria and parses the response.
 * 
 * @param userMessage - The user's message
 * @param context - The conversation context
 * @param currentRequirement - The current requirement being evaluated
 * @param deps - Dependencies (llmClient)
 * @returns Parsed result and cleaned message
 */
export const processRequirementWithLLM = async (
  userMessage: string,
  context: ConversationContext,
  currentRequirement: JobRequirement,
  deps: LLMProcessorDependencies
): Promise<LLMProcessorResult> => {
  console.log(`[RequirementLLMProcessor] processRequirementWithLLM called with userMessage: "${userMessage}", requirement: ${currentRequirement.id}`);
  // Get criteria results from LLM
  const raw_llm_response = await getCriteriaResultsFromLLM(userMessage, currentRequirement, deps.llmClient);
  
  console.log(`[RequirementLLMProcessor] processRequirementWithLLM - raw_llm_response received: ${raw_llm_response.substring(0, 200)}...`);
  
  // Parse LLM response to extract value, assessment, and message
  const parse_result = parseLLMResponse(currentRequirement.requirement_type, raw_llm_response);
  
  // Get cleaned message (parser always returns a cleaned message)
  let cleaned_message = parse_result.message;
  
  // Handle empty message scenarios - minimal fallback only
  // The parser should always provide a message, especially for clarification cases
  // Business logic (routing, next questions) is handled by the state-router
  if (!cleaned_message || cleaned_message.trim().length === 0) {
    console.warn(`[RequirementLLMProcessor] Warning: Message is empty after parsing, using minimal fallback`);
    cleaned_message = "Thank you for that information.";
  }

  return {
    parseResult: parse_result,
    cleanedMessage: cleaned_message,
    rawAssistantMessage: raw_llm_response,
    needsClarification: parse_result.needsClarification,
  };
}
