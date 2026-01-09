/**
 * System prompt templates for the LLM chatbot.
 * These define the role, tone, and behavior of the assistant.
 */

import { SystemPromptWithRequirementParams } from './types';
import { buildSystemPromptMessage, buildSystemPromptWithRequirementMessage } from './message-builders';

/**
 * Builds the system prompt for the LLM chatbot.
 * Each conversation is job-specific - the user has already selected this job before starting the chat.
 * 
 * @param jobTitle - The title of the job being applied for
 * @param jobLocation - The location of the job (optional)
 * @returns The system prompt string
 */
export const buildSystemPrompt = (
  jobTitle: string,
): string => {
  return buildSystemPromptMessage(jobTitle);
};

/**
 * Builds a system prompt with current requirement context.
 * Used for subsequent messages when evaluating a specific requirement.
 * 
 * @param params - Parameters for building the system prompt with requirement context
 * @returns The system prompt string with requirement context
 */
export const buildSystemPromptWithRequirement = (
  params: SystemPromptWithRequirementParams
): string => {
  const { jobTitle, requirementType, requirementDescription, criteria, isRequired } = params;
  const requirementStatus = isRequired ? 'required' : 'preferred';
  
  return buildSystemPromptWithRequirementMessage(
    jobTitle,
    requirementDescription,
    requirementStatus,
    requirementType,
    criteria
  );
};

