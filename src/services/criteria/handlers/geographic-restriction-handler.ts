import {
  GeographicRestrictionCriteria,
  geographicRestrictionValueSchema,
  isGeographicRestrictionCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's location meets the geographic restriction criteria.
 * Returns PENDING if the location is ambiguous and needs follow-up questions.
 * 
 * @param userState - User's state code (2-letter, e.g., "NY")
 * @param criteria - Geographic restriction requirement criteria
 * @returns MET if user meets requirement, NOT_MET if clearly doesn't meet, PENDING if ambiguous
 */
const meetsGeographicRestrictionRequirement = (
  userState: string | undefined,
  criteria: GeographicRestrictionCriteria
): RequirementEvaluationResult => {
  if (!criteria.required) {
    return RequirementEvaluationResult.MET;
  }

  const hasAllowedStates = criteria.allowed_states && criteria.allowed_states.length > 0;
  const hasAllowedRegions = criteria.allowed_regions && criteria.allowed_regions.length > 0;

  if (!hasAllowedStates && !hasAllowedRegions) {
    return RequirementEvaluationResult.MET;
  }

  if (!userState) {
    return RequirementEvaluationResult.PENDING;
  }

  const userStateInAllowedStates = hasAllowedStates && criteria.allowed_states!.includes(userState);
  
  // If we only have regions (no states), and user provided a state code,
  // we can't definitively determine if the state is in the region without a mapping.
  // Return PENDING so LLM can ask follow-up questions.
  if (hasAllowedRegions && !hasAllowedStates) {
    // Only check if the state code happens to match a region name exactly
    const userStateInAllowedRegions = criteria.allowed_regions!.includes(userState);
    if (userStateInAllowedRegions) {
      return RequirementEvaluationResult.MET;
    }
    // Ambiguous: state code vs region name - need more info
    return RequirementEvaluationResult.PENDING;
  }

  // If we have allowed_states, check against them
  if (hasAllowedStates) {
    if (userStateInAllowedStates) {
      return RequirementEvaluationResult.MET;
    }
    // If we also have regions, check if state matches a region name
    if (hasAllowedRegions && criteria.allowed_regions!.includes(userState)) {
      return RequirementEvaluationResult.MET;
    }
    return RequirementEvaluationResult.NOT_MET;
  }

  return RequirementEvaluationResult.NOT_MET;
};

/**
 * Evaluates if a geographic restriction requirement is met based on the user's response.
 * 
 * @param criteria - Geographic restriction requirement criteria
 * @param value - User's location response (unknown | null, validated with Zod schema)
 * @returns MET if user's location meets restrictions, NOT_MET if it doesn't, PENDING if not answered or ambiguous
 */
export const handleGeographicRestriction: CriteriaHandler<GeographicRestrictionCriteria> = (
  criteria,
  value
): RequirementEvaluationResult => {
  if (value === null) {
    return RequirementEvaluationResult.PENDING;
  }

  const validationResult = geographicRestrictionValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementEvaluationResult.NOT_MET;
  }

  return meetsGeographicRestrictionRequirement(validationResult.data.state, criteria);
};

/**
 * Type guard to check if criteria is geographic restriction criteria and route to handler.
 */
export const evaluateGeographicRestriction = (
  criteria: unknown,
  value: unknown
): RequirementEvaluationResult => {
  if (!isGeographicRestrictionCriteria(criteria)) {
    throw new Error('Invalid geographic restriction criteria');
  }

  return handleGeographicRestriction(criteria, value);
};

