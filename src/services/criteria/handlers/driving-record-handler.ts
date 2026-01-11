import { RequirementStatus } from '../../../entities/conversation-job-requirement/domain';
import {
  DrivingRecordCriteria,
  drivingRecordValueSchema,
  isDrivingRecordCriteria,
} from '../criteria-types';
import { CriteriaHandler, RequirementEvaluationResult } from './types';

/**
 * Checks if user's driving record meets the requirement criteria.
 * 
 * @param violations - User's number of violations
 * @param accidents - User's number of accidents
 * @param criteria - Driving record requirement criteria
 * @returns MET if user's record meets requirements, NOT_MET otherwise
 */
const meetsDrivingRecordRequirement = (
  violations: number,
  accidents: number,
  criteria: DrivingRecordCriteria
): RequirementStatus => {
  const violationsWithinLimit = violations <= criteria.max_violations;
  const accidentsWithinLimit = accidents <= criteria.max_accidents;

  if (violationsWithinLimit && accidentsWithinLimit) {
    return RequirementStatus.MET;
  }
  return RequirementStatus.NOT_MET;
};

/**
 * Evaluates if a driving record requirement is met based on the user's response.
 * 
 * @param criteria - Driving record requirement criteria
 * @param value - User's driving record response (unknown | null, validated with Zod schema)
 * @returns MET if user's record meets requirements, NOT_MET if it doesn't, PENDING if not answered
 */
export const handleDrivingRecord: CriteriaHandler<DrivingRecordCriteria> = (
  criteria,
  value
): RequirementStatus => {
  if (value === null) {
    return RequirementStatus.PENDING;
  }

  const validationResult = drivingRecordValueSchema.safeParse(value);
  if (!validationResult.success) {
    return RequirementStatus.NOT_MET;
  }

  return meetsDrivingRecordRequirement(
    validationResult.data.violations,
    validationResult.data.accidents,
    criteria
  );
};

/**
 * Type guard to check if criteria is driving record criteria and route to handler.
 */
export const evaluateDrivingRecord = (
  criteria: unknown,
  value: unknown
): RequirementStatus => {
  if (!isDrivingRecordCriteria(criteria)) {
    throw new Error('Invalid driving record criteria');
  }

  return handleDrivingRecord(criteria, value);
};

