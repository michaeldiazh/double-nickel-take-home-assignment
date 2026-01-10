/**
 * Types for prompt building functions.
 */

/**
 * Parameters for building a system prompt with requirement context.
 */
export interface SystemPromptWithRequirementParams {
  /**
   * The title of the job
   */
  jobTitle: string;
  
  /**
   * The type of requirement being evaluated (e.g., "CDL_CLASS", "YEARS_EXPERIENCE")
   */
  requirementType: string;
  
  /**
   * Human-readable description of what we're asking about
   */
  requirementDescription: string;
  
  /**
   * The criteria object for this requirement (for context)
   */
  criteria: unknown;
  
  /**
   * Whether this requirement is required or preferred
   */
  isRequired: boolean;
}

