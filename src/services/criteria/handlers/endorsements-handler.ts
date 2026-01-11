import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import {
  EndorsementsCriteria,
  EndorsementsValue,
  endorsementsValueSchema,
  isEndorsementsCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if an endorsement requirement is met when the user hasn't provided the endorsement value.
 * 
 * @param criteriaValue - The endorsement requirement from criteria (true = required, 'preferred' = preferred, false/undefined = not needed)
 * @returns true if acceptable when user value is missing, false if required
 */
const checkEndorsementWhenMissing = (
  criteriaValue: boolean | 'preferred' | undefined
): boolean => {
  const isPreferred = criteriaValue === 'preferred';
  const isNotNeeded = criteriaValue === false;
  return isPreferred || isNotNeeded;
};

/**
 * Checks if an endorsement requirement is met when the user has provided the endorsement value.
 * 
 * @param criteriaValue - The endorsement requirement from criteria (true = required, 'preferred' = preferred, false/undefined = not needed)
 * @param userValue - The user's endorsement value (true = has it, false = doesn't have it)
 * @returns true if the endorsement requirement is met, false otherwise
 */
const checkEndorsementWhenProvided = (
  criteriaValue: boolean | 'preferred' | undefined,
  userValue: boolean
): boolean => {
  const isRequired = criteriaValue === true;
  const isPreferred = criteriaValue === 'preferred';
  const isNotNeeded = criteriaValue === false || criteriaValue === undefined;
  const userHasEndorsement = userValue === true;
  const isRequiredAndUserHasEndorsement = isRequired && userHasEndorsement;
  return isRequiredAndUserHasEndorsement || isPreferred || isNotNeeded;
};

/**
 * Checks if a single endorsement requirement is met.
 * 
 * @param criteriaValue - The endorsement requirement from criteria (true = required, 'preferred' = preferred, false/undefined = not needed)
 * @param userValue - The user's endorsement value (true = has it, false/undefined = doesn't have it)
 * @returns true if the endorsement requirement is met, false otherwise
 */
const checkEndorsement = (
  criteriaValue: boolean | 'preferred' | undefined,
  userValue: boolean | undefined
): boolean => {
  if (criteriaValue === undefined) {
    return true;
  }
  if (userValue === undefined) {
    return checkEndorsementWhenMissing(criteriaValue);
  }

  return checkEndorsementWhenProvided(criteriaValue, userValue);
};

/**
 * Builds an array of boolean values representing the endorsement results.
 * 
 * @param criteria - Endorsements requirement criteria
 * @param value - User's validated endorsements value
 * @returns an array of boolean values representing the endorsement results
 */
const buildEndorsementResults = (
  criteria: EndorsementsCriteria,
  value: EndorsementsValue
): boolean[] =>( [
    checkEndorsement(criteria.hazmat, value.hazmat),
    checkEndorsement(criteria.tanker, value.tanker),
    checkEndorsement(criteria.doubles_triples, value.doubles_triples),
  ]);

/**
 * Checks if all endorsement requirements are met.
 * 
 * @param criteria - Endorsements requirement criteria
 * @param value - User's validated endorsements value
 * @returns true if all endorsements are met, false otherwise
 */
const checkAllEndorsements = (
  criteria: EndorsementsCriteria,
  value: EndorsementsValue
): RequirementStatus => {
  const endorsementResults = buildEndorsementResults(criteria, value);
  if(endorsementResults.every((result) => result)){
    return RequirementStatus.MET;
  }
  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if an endorsements requirement is met based on the user's response.
 * 
 * @param criteria - Endorsements requirement criteria
 * @param value - User's endorsements response (unknown | null, validated with Zod schema)
 * @returns MET if user has required endorsements, NOT_MET if they don't, PENDING if not answered
 */
export const handleEndorsements: CriteriaHandler<EndorsementsCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  }
  const validationResult = endorsementsValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }
  return checkAllEndorsements(criteria, validationResult.data);
};

/**
 * Type guard to check if criteria is endorsements criteria and route to handler.
 */
export const evaluateEndorsements = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isEndorsementsCriteria(criteria)) {
    throw new Error('Invalid endorsements criteria');
  }

  return handleEndorsements(criteria, value);
};

