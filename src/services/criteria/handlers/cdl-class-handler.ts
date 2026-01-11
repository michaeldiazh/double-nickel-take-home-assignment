import {
  CDLClassCriteria,
  cdlClassValueSchema,
  isCDLClassCriteria,
  CDLClass,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';
import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';

/**
 * CDL Class hierarchy: A > B > C (A can drive everything, B can drive B and C, C can only drive C)
 */
const classHierarchy: Record<CDLClass, number> = { [CDLClass.A]: 3, [CDLClass.B]: 2, [CDLClass.C]: 1 };

/**
 * Checks if user's CDL class meets the requirement criteria.
 * 
 * @param userCDLClass - User's CDL class
 * @param requiredCDLClass - Required CDL class
 * @returns MET if user's class level >= required level, NOT_MET otherwise
 */
const meetsCDLClassRequirement = (
  userCDLClass: CDLClass,
  requiredCDLClass: CDLClass
): RequirementStatus => {
  const requiredLevel = classHierarchy[requiredCDLClass];
  const userLevel = classHierarchy[userCDLClass];

  if (userLevel >= requiredLevel) {
    return RequirementStatus.MET;
  }

  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if a CDL class requirement is met based on the user's response.
 * 
 * @param criteria - CDL class requirement criteria
 * @param value - User's CDL class response (unknown | null, validated with Zod schema)
 * @returns MET if user has the required CDL class, NOT_MET if they don't, PENDING if not answered
 */
export const handleCDLClass: CriteriaHandler<CDLClassCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  }

  const validationResult = cdlClassValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }

  return meetsCDLClassRequirement(validationResult.data.cdl_class, criteria.cdl_class);
};

/**
 * Type guard to check if criteria is CDL class criteria and route to handler.
 */
export const evaluateCDLClass = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isCDLClassCriteria(criteria)) {
    throw new Error('Invalid CDL class criteria');
  }

  return handleCDLClass(criteria, value);
};

