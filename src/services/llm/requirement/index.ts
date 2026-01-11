/**
 * Requirement handler module.
 * 
 * Handles processing user responses during ON_REQ status:
 * - Parses LLM responses to extract requirement values
 * - Evaluates requirements against criteria
 * - Updates conversation_job_requirement status
 * - Handles status transitions (next requirement, all met, not met)
 */

export { RequirementHandler } from './handler';
