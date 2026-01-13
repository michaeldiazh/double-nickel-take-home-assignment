/**
 * Generates JSON structure descriptions for LLM prompts.
 * These help the LLM understand the exact format expected for responses.
 */

import { JobRequirementType } from './types';

/**
 * Formats a single JSON field description for LLM prompts.
 * Creates a consistent format: `  "field_name": type (optional)`
 * 
 * @param name - The JSON field name (e.g., "cdl_class", "years_experience")
 * @param type - The field type description (e.g., "boolean", '"A" | "B" | "C"')
 * @param optional - Whether the field is optional (default: false)
 * @returns Formatted string for use in JSON structure descriptions
 */
const formatField = (name: string, type: string, optional: boolean = false): string => {
  return `  "${name}": ${type}${optional ? ' (optional)' : ''}`;
};

/**
 * Gets the value-specific JSON structure description for a requirement type.
 * This describes only the requirement-specific fields (not assessment/confidence).
 * 
 * @param requirementType - The requirement type
 * @returns A string describing the requirement-specific JSON structure
 */
const getRequirementSpecificFormat = (requirementType: string): string => {
  const normalizedType = requirementType.toUpperCase() as JobRequirementType;
  
  switch (normalizedType) {
    case JobRequirementType.CDL_CLASS:
      return [
        formatField('cdl_class', '"A" | "B" | "C"'),
        formatField('confirmed', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.YEARS_EXPERIENCE:
      return [
        formatField('years_experience', 'number (integer, >= 0)'),
        formatField('meets_requirement', 'boolean'),
        formatField('exceeds_requirement', 'boolean', true),
      ].join(',\n');
    
    case JobRequirementType.DRIVING_RECORD:
      return [
        formatField('violations', 'number (integer, >= 0)'),
        formatField('accidents', 'number (integer, >= 0)'),
        formatField('clean_record', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.ENDORSEMENTS:
      return [
        formatField('hazmat', 'boolean', true),
        formatField('tanker', 'boolean', true),
        formatField('doubles_triples', 'boolean', true),
        formatField('endorsements_confirmed', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.AGE_REQUIREMENT:
      return [
        formatField('age', 'number (integer, >= 18)'),
        formatField('meets_requirement', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.PHYSICAL_EXAM:
      return [
        formatField('has_current_dot_physical', 'boolean'),
        formatField('confirmed', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.DRUG_TEST:
      return [
        formatField('agrees_to_pre_employment', 'boolean'),
        formatField('agrees_to_random_testing', 'boolean', true),
        formatField('confirmed', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.BACKGROUND_CHECK:
      return [
        formatField('agrees_to_background_check', 'boolean'),
        formatField('confirmed', 'boolean'),
      ].join(',\n');
    
    case JobRequirementType.GEOGRAPHIC_RESTRICTION:
      return [
        formatField('location', 'string'),
        formatField('state', 'string (2-letter state code)', true),
        formatField('meets_requirement', 'boolean'),
      ].join(',\n');
    
    default: {
      // Exhaustiveness check: if a new requirement type is added, TypeScript will error here
      const _exhaustive: never = normalizedType;
      throw new Error(`Unsupported requirement type: ${requirementType}`);
    }
  }
};

/**
 * Gets a human-readable JSON structure description for a requirement type.
 * This tells the LLM exactly what format to return, including assessment and confidence.
 * 
 * @param requirementType - The requirement type
 * @returns A string describing the expected JSON structure
 */
export const getResponseFormatDescription = (requirementType: string): string => {
  const requirementFields = getRequirementSpecificFormat(requirementType);
  
  return `{
${requirementFields},
  "assessment": "MET" | "NOT_MET" | "PENDING" (your assessment of whether the candidate meets this requirement),
  "confidence": number (0.0 to 1.0, optional, representing your confidence level in the assessment),
  "message": string (the conversational message to send to the candidate - friendly, professional, and clear)
  "needs_clarification" : boolean (set to true if you need more information from the candidate to make a determination)
}`;
};
