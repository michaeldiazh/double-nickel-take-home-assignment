import { z } from 'zod';
import { requiredCriteriaSchema, optionalRequiredCriteriaSchema } from './base-schemas';

// Re-export base schemas for convenience
export { requiredCriteriaSchema, optionalRequiredCriteriaSchema } from './base-schemas';

// Import requirement-specific types
import type {
  CDLClassCriteria,
  CDLClassValue,
  CDLClass,
} from './cdl-class/types';
import type {
  YearsExperienceCriteria,
  YearsExperienceValue,
} from './years-experience/types';
import type {
  DrivingRecordCriteria,
  DrivingRecordValue,
} from './driving-record/types';
import type {
  EndorsementsCriteria,
  EndorsementsValue,
} from './endorsements/types';
import type {
  AgeRequirementCriteria,
  AgeRequirementValue,
} from './age-requirement/types';
import type {
  PhysicalExamCriteria,
  PhysicalExamValue,
} from './physical-exam/types';
import type {
  DrugTestCriteria,
  DrugTestValue,
} from './drug-test/types';
import type {
  BackgroundCheckCriteria,
  BackgroundCheckValue,
} from './background-check/types';
import type {
  GeographicRestrictionCriteria,
  GeographicRestrictionValue,
} from './geographic-restriction/types';

// Re-export requirement-specific types for convenience
export type {
  CDLClassCriteria,
  CDLClassValue,
} from './cdl-class/types';
export type {
  YearsExperienceCriteria,
  YearsExperienceValue,
} from './years-experience/types';
export type {
  DrivingRecordCriteria,
  DrivingRecordValue,
} from './driving-record/types';
export type {
  EndorsementsCriteria,
  EndorsementsValue,
} from './endorsements/types';
export type {
  AgeRequirementCriteria,
  AgeRequirementValue,
} from './age-requirement/types';
export type {
  PhysicalExamCriteria,
  PhysicalExamValue,
} from './physical-exam/types';
export type {
  DrugTestCriteria,
  DrugTestValue,
} from './drug-test/types';
export type {
  BackgroundCheckCriteria,
  BackgroundCheckValue,
} from './background-check/types';
export type {
  GeographicRestrictionCriteria,
  GeographicRestrictionValue,
} from './geographic-restriction/types';

// Re-export requirement-specific schemas and type guards
export {
  cdlClassCriteriaSchema,
  cdlClassValueSchema,
  isCDLClassCriteria,
  isCDLClassValue,
  CDLClass,
} from './cdl-class/types';
export {
  yearsExperienceCriteriaSchema,
  yearsExperienceValueSchema,
  isYearsExperienceCriteria,
  isYearsExperienceValue,
} from './years-experience/types';
export {
  drivingRecordCriteriaSchema,
  drivingRecordValueSchema,
  isDrivingRecordCriteria,
  isDrivingRecordValue,
} from './driving-record/types';
export {
  endorsementsCriteriaSchema,
  endorsementsValueSchema,
  isEndorsementsCriteria,
  isEndorsementsValue,
} from './endorsements/types';
export {
  ageRequirementCriteriaSchema,
  ageRequirementValueSchema,
  isAgeRequirementCriteria,
  isAgeRequirementValue,
} from './age-requirement/types';
export {
  physicalExamCriteriaSchema,
  physicalExamValueSchema,
  isPhysicalExamCriteria,
  isPhysicalExamValue,
} from './physical-exam/types';
export {
  drugTestCriteriaSchema,
  drugTestValueSchema,
  isDrugTestCriteria,
  isDrugTestValue,
} from './drug-test/types';
export {
  backgroundCheckCriteriaSchema,
  backgroundCheckValueSchema,
  isBackgroundCheckCriteria,
  isBackgroundCheckValue,
} from './background-check/types';
export {
  geographicRestrictionCriteriaSchema,
  geographicRestrictionValueSchema,
  isGeographicRestrictionCriteria,
  isGeographicRestrictionValue,
} from './geographic-restriction/types';

/**
 * Job Requirement Types as defined in the database.
 * These correspond to the requirement_type values in job_requirement_type table.
 */
export enum JobRequirementType {
  CDL_CLASS = 'CDL_CLASS',
  YEARS_EXPERIENCE = 'YEARS_EXPERIENCE',
  DRIVING_RECORD = 'DRIVING_RECORD',
  ENDORSEMENTS = 'ENDORSEMENTS',
  AGE_REQUIREMENT = 'AGE_REQUIREMENT',
  PHYSICAL_EXAM = 'PHYSICAL_EXAM',
  DRUG_TEST = 'DRUG_TEST',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  GEOGRAPHIC_RESTRICTION = 'GEOGRAPHIC_RESTRICTION',
}

export const isJobRequirementType = (value: any): value is JobRequirementType => {
  return Object.values(JobRequirementType).includes(value);
};


/**
 * Union type for all job requirement criteria.
 * This represents the structure stored in job_requirements.criteria (JSONB column).
 */
export type JobRequirementCriteria =
  | CDLClassCriteria
  | YearsExperienceCriteria
  | DrivingRecordCriteria
  | EndorsementsCriteria
  | AgeRequirementCriteria
  | PhysicalExamCriteria
  | DrugTestCriteria
  | BackgroundCheckCriteria
  | GeographicRestrictionCriteria;

/**
 * Union type for all conversation requirement values.
 * This represents the structure stored in conversation_requirements.value (JSONB column).
 */
export type ConversationRequirementValue =
  | CDLClassValue
  | YearsExperienceValue
  | DrivingRecordValue
  | EndorsementsValue
  | AgeRequirementValue
  | PhysicalExamValue
  | DrugTestValue
  | BackgroundCheckValue
  | GeographicRestrictionValue;

/**
 * Criteria that has a required field indicating whether the requirement is mandatory.
 * This is a common pattern across many criteria types.
 */
export type RequiredCriteria = z.infer<typeof requiredCriteriaSchema>;

/**
 * Type guard to check if criteria has a required field.
 * 
 * @param criteria - The criteria object to check
 * @returns True if criteria has a required field that is not false
 */
export const isRequiredCriteria = (criteria: unknown): criteria is RequiredCriteria => {
  return requiredCriteriaSchema.safeParse(criteria).success &&
         (criteria as RequiredCriteria).required;
};
