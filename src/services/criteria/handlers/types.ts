import { RequirementStatus } from "../../../entities/conversation-job-requirement/domain";

/**
 * Result of evaluating a requirement against a user's response.
 */
export enum RequirementEvaluationResult {
  MET = 'MET',
  NOT_MET = 'NOT_MET',
  PENDING = 'PENDING',
}

/**
 * Handler function type for evaluating a requirement.
 * Takes the criteria (requirement definition) and value (user's response) and returns whether it's met.
 * 
 * The value is typed as `unknown | null` because it comes from JSONB in the database and needs
 * runtime validation via Zod schemas. Handlers should validate the value before using it.
 * 
 * @param criteria - The requirement criteria from job_requirements.criteria
 * @param value - The user's response from conversation_requirements.value (unknown | null, needs Zod validation)
 * @returns RequirementEvaluationResult indicating if the requirement is met, not met, or pending
 */
export type CriteriaHandler<TCriteria> = (
  criteria: TCriteria,
  value: unknown | null
) => RequirementStatus;

