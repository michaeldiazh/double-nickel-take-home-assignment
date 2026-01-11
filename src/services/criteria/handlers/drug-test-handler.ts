import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import {
  DrugTestCriteria,
  drugTestValueSchema,
  isDrugTestCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's drug test agreement meets the requirement criteria.
 * 
 * @param userAgreesToPreEmployment - Whether user agrees to pre-employment drug test
 * @param userAgreesToRandomTesting - Whether user agrees to random drug testing (optional)
 * @param criteria - Drug test requirement criteria
 * @returns MET if user meets requirement, NOT_MET otherwise
 */
const meetsDrugTestRequirement = (
  userAgreesToPreEmployment: boolean,
  userAgreesToRandomTesting: boolean | undefined,
  criteria: DrugTestCriteria
): RequirementStatus => {
  const preEmploymentMet = !criteria.pre_employment || userAgreesToPreEmployment;
  const randomTestingMet = !criteria.random_testing || userAgreesToRandomTesting === true;

  if (preEmploymentMet && randomTestingMet) {
    return RequirementStatus.MET;
  }

  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if a drug test requirement is met based on the user's response.
 * 
 * @param criteria - Drug test requirement criteria
 * @param value - User's drug test response (unknown | null, validated with Zod schema)
 * @returns MET if user agrees to required drug tests, NOT_MET if they don't, PENDING if not answered
 */
export const handleDrugTest: CriteriaHandler<DrugTestCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  }

  const validationResult = drugTestValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }

  return meetsDrugTestRequirement(
    validationResult.data.agrees_to_pre_employment,
    validationResult.data.agrees_to_random_testing,
    criteria
  );
};

/**
 * Type guard to check if criteria is drug test criteria and route to handler.
 */
export const evaluateDrugTest = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isDrugTestCriteria(criteria)) {
    throw new Error('Invalid drug test criteria');
  }

  return handleDrugTest(criteria, value);
};

