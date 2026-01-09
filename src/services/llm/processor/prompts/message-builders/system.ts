/**
 * System prompt message builders.
 * These build the system role and guidelines for the LLM chatbot.
 */

import { MessageRole, ChatMessage } from '../../../client/types';
import { JobRequirementWithType } from '../../../../criteria/types';
import { isRequiredCriteria } from '../../../../criteria/criteria-types';

/**
 * Company name for Happy Hauler Trucking Co recruitment assistant.
 */
const COMPANY_NAME = 'Happy Hauler Trucking Co';

/**
 * Builds the system prompt message for the LLM chatbot.
 * 
 * @param jobTitle - The title of the job being applied for
 * @param locationText - The location text to append (e.g., " located in New York")
 * @returns The system prompt message string
 */
export const buildSystemPromptMessage = (
  jobTitle: string,
): string => {
  return `
    You are a helpful truck driver recruitment assistant for ${COMPANY_NAME}. Your role is to guide candidates through job qualification questions for a ${jobTitle} position.

    Guidelines:
    - Be friendly, professional, and conversational
    - Ask one question at a time
    - If a candidate's answer is unclear or incomplete, ask a clarifying follow-up question before moving on
    - Be encouraging and supportive
    - Focus on collecting accurate information about the candidate's qualifications for this specific role
    - Once you have enough information to evaluate a requirement, confirm it and move to the next one
    - You can answer questions about ${COMPANY_NAME}, this specific job, pay, benefits, schedule, location, etc.
    - If asked about other positions at ${COMPANY_NAME}, you can mention that ${COMPANY_NAME} has other openings, but redirect focus back to screening for the ${jobTitle} position

    Your goal is to help candidates complete their application screening for the ${jobTitle} position by collecting their qualifications through natural conversation.`;
};

/**
 * Builds the system prompt message with requirement context.
 * 
 * @param jobTitle - The title of the job
 * @param requirementDescription - Human-readable description of what we're asking about
 * @param requirementStatus - Whether the requirement is "required" or "preferred"
 * @param requirementType - The type of requirement being evaluated
 * @param criteria - The criteria object for this requirement
 * @returns The system prompt message string with requirement context
 */
export const buildSystemPromptWithRequirementMessage = (
  jobTitle: string,
  requirementDescription: string,
  requirementStatus: string,
  requirementType: string,
  criteria: unknown
): string => {
  return `
    You are a helpful truck driver recruitment assistant for ${COMPANY_NAME}. Your role is to guide candidates through job qualification questions for a ${jobTitle} position.

    Current Focus:
    - You are currently asking about: ${requirementDescription}
    - This is a ${requirementStatus} requirement
    - Requirement type: ${requirementType}
    - Criteria: ${JSON.stringify(criteria)}

    Guidelines:
    - Be friendly, professional, and conversational
    - Ask one question at a time
    - If a candidate's answer is unclear or incomplete, ask a clarifying follow-up question before moving on
    - Be encouraging and supportive
    - Focus on collecting accurate information about this specific requirement
    - Once you have enough information to evaluate this requirement, confirm it and indicate readiness to move to the next one`;
};

/**
 * Gets a human-readable description for a requirement type.
 * Uses the requirementDescription from the job requirement type, with a fallback.
 * 
 * @param requirementType - The SimplifiedJobRequirementType object
 * @returns Human-readable description
 */
const getRequirementDescription = (
  requirementType: { requirementDescription: string; requirementType: string }
): string => {
  return requirementType.requirementDescription || requirementType.requirementType.toLowerCase().replace(/_/g, ' ');
};

/**
 * Builds a system ChatMessage with requirement context.
 * 
 * @param jobTitle - The title of the job
 * @param currentRequirement - The requirement currently being evaluated
 * @returns A ChatMessage with SYSTEM role containing the prompt with requirement context
 */
export const buildSystemMessageWithRequirement = (
  jobTitle: string,
  currentRequirement: JobRequirementWithType
): ChatMessage => {
  const isRequired = isRequiredCriteria(currentRequirement.criteria);
  const requirementStatus = isRequired ? 'required' : 'preferred';
  const systemPrompt = buildSystemPromptWithRequirementMessage(
    jobTitle,
    getRequirementDescription(currentRequirement.requirementType),
    requirementStatus,
    currentRequirement.requirementType.requirementType,
    currentRequirement.criteria
  );
  
  return {
    role: MessageRole.SYSTEM,
    content: systemPrompt,
  };
};

