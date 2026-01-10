/**
 * Generates JSON structure descriptions for LLM prompts.
 * These help the LLM understand the exact format expected for responses.
 */

import { JobRequirementType } from './criteria-types';
/**
 * Gets a human-readable JSON structure description for a requirement type.
 * This tells the LLM exactly what format to return.
 * 
 * @param requirementType - The requirement type
 * @returns A string describing the expected JSON structure
 */
export const getResponseFormatDescription = (requirementType: string): string => {
  const normalizedType = requirementType.toUpperCase() as JobRequirementType;
  
  switch (normalizedType) {
    case JobRequirementType.CDL_CLASS:
      return `{
  "cdl_class": "A" | "B" | "C",
  "confirmed": boolean
}`;
    
    case JobRequirementType.YEARS_EXPERIENCE:
      return `{
  "years_experience": number (integer, >= 0),
  "meets_requirement": boolean,
  "exceeds_requirement": boolean (optional)
}`;
    
    case JobRequirementType.DRIVING_RECORD:
      return `{
  "violations": number (integer, >= 0),
  "accidents": number (integer, >= 0),
  "clean_record": boolean
}`;
    
    case JobRequirementType.ENDORSEMENTS:
      return `{
  "hazmat": boolean (optional),
  "tanker": boolean (optional),
  "doubles_triples": boolean (optional),
  "endorsements_confirmed": boolean
}`;
    
    case JobRequirementType.AGE_REQUIREMENT:
      return `{
  "age": number (integer, >= 18),
  "meets_requirement": boolean
}`;
    
    case JobRequirementType.PHYSICAL_EXAM:
      return `{
  "has_current_dot_physical": boolean,
  "confirmed": boolean
}`;
    
    case JobRequirementType.DRUG_TEST:
      return `{
  "agrees_to_pre_employment": boolean,
  "agrees_to_random_testing": boolean (optional),
  "confirmed": boolean
}`;
    
    case JobRequirementType.BACKGROUND_CHECK:
      return `{
  "agrees_to_background_check": boolean,
  "confirmed": boolean
}`;
    
    case JobRequirementType.GEOGRAPHIC_RESTRICTION:
      return `{
  "location": string,
  "state": string (2-letter state code, optional),
  "meets_requirement": boolean
}`;
    
    default:
      return 'JSON object matching the requirement criteria';
  }
};

