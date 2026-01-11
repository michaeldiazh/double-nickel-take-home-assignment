import { z } from 'zod';

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
 * Base schema for criteria that has a required field.
 * This is a common pattern across many criteria types.
 * The required field can be required or optional depending on the criteria type.
 */
export const requiredCriteriaSchema = z.object({
  required: z.boolean(),
}).catchall(z.unknown());

/**
 * Base schema for criteria with optional required field.
 * Used for criteria types where required is optional.
 */
export const optionalRequiredCriteriaSchema = z.object({
  required: z.boolean().optional(),
}).catchall(z.unknown());

/**
 * CDL Class values
 */
export enum CDLClass {
  A = 'A',
  B = 'B',
  C = 'C',
}

/**
 * Criteria for CDL_CLASS requirement type.
 * Used in job_requirements.criteria column.
 */
export const cdlClassCriteriaSchema = requiredCriteriaSchema.extend({
  cdl_class: z.enum([CDLClass.A, CDLClass.B, CDLClass.C]),
});

export type CDLClassCriteria = z.infer<typeof cdlClassCriteriaSchema>;

/**
 * Criteria for YEARS_EXPERIENCE requirement type.
 * Used in job_requirements.criteria column.
 */
export const yearsExperienceCriteriaSchema = optionalRequiredCriteriaSchema.extend({
  min_years: z.number().int().positive(),
  preferred: z.boolean().optional(),
});

export type YearsExperienceCriteria = z.infer<typeof yearsExperienceCriteriaSchema>;

/**
 * Criteria for DRIVING_RECORD requirement type.
 * Used in job_requirements.criteria column.
 */
export const drivingRecordCriteriaSchema = requiredCriteriaSchema.extend({
  max_violations: z.number().int().min(0),
  max_accidents: z.number().int().min(0),
});

export type DrivingRecordCriteria = z.infer<typeof drivingRecordCriteriaSchema>;

/**
 * Criteria for ENDORSEMENTS requirement type.
 * Used in job_requirements.criteria column.
 */
export const endorsementsCriteriaSchema = optionalRequiredCriteriaSchema.extend({
  hazmat: z.union([z.boolean(), z.literal('preferred')]).optional(),
  tanker: z.union([z.boolean(), z.literal('preferred')]).optional(),
  doubles_triples: z.union([z.boolean(), z.literal('preferred')]).optional(),
});

export type EndorsementsCriteria = z.infer<typeof endorsementsCriteriaSchema>;

/**
 * Criteria for AGE_REQUIREMENT requirement type.
 * Used in job_requirements.criteria column.
 */
export const ageRequirementCriteriaSchema = requiredCriteriaSchema.extend({
  min_age: z.number().int().positive().min(18),
});

export type AgeRequirementCriteria = z.infer<typeof ageRequirementCriteriaSchema>;

/**
 * Criteria for PHYSICAL_EXAM requirement type.
 * Used in job_requirements.criteria column.
 */
export const physicalExamCriteriaSchema = requiredCriteriaSchema.extend({
  current_dot_physical: z.boolean(),
});

export type PhysicalExamCriteria = z.infer<typeof physicalExamCriteriaSchema>;

/**
 * Criteria for DRUG_TEST requirement type.
 * Used in job_requirements.criteria column.
 */
export const drugTestCriteriaSchema = requiredCriteriaSchema.extend({
  pre_employment: z.boolean(),
  random_testing: z.boolean().optional(),
});

export type DrugTestCriteria = z.infer<typeof drugTestCriteriaSchema>;

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
 * Conversation requirement values - these represent user responses during screening.
 * Used in conversation_requirements.value column.
 */

/**
 * Value for CDL_CLASS conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const cdlClassValueSchema = z.object({
  cdl_class: z.enum([CDLClass.A, CDLClass.B, CDLClass.C]),
  confirmed: z.boolean(),
});

export type CDLClassValue = z.infer<typeof cdlClassValueSchema>;

/**
 * Value for YEARS_EXPERIENCE conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const yearsExperienceValueSchema = z.object({
  years_experience: z.number().int().min(0),
  meets_requirement: z.boolean(),
  exceeds_requirement: z.boolean().optional(),
});

export type YearsExperienceValue = z.infer<typeof yearsExperienceValueSchema>;

/**
 * Value for DRIVING_RECORD conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const drivingRecordValueSchema = z.object({
  violations: z.number().int().min(0),
  accidents: z.number().int().min(0),
  clean_record: z.boolean(),
});

export type DrivingRecordValue = z.infer<typeof drivingRecordValueSchema>;

/**
 * Value for ENDORSEMENTS conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const endorsementsValueSchema = z.object({
  hazmat: z.boolean().optional(),
  tanker: z.boolean().optional(),
  doubles_triples: z.boolean().optional(),
  endorsements_confirmed: z.boolean(),
});

export type EndorsementsValue = z.infer<typeof endorsementsValueSchema>;

/**
 * Value for AGE_REQUIREMENT conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const ageRequirementValueSchema = z.object({
  age: z.number().int().min(18),
  meets_requirement: z.boolean(),
});

export type AgeRequirementValue = z.infer<typeof ageRequirementValueSchema>;

/**
 * Value for PHYSICAL_EXAM conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const physicalExamValueSchema = z.object({
  has_current_dot_physical: z.boolean(),
  confirmed: z.boolean(),
});

export type PhysicalExamValue = z.infer<typeof physicalExamValueSchema>;

/**
 * Value for DRUG_TEST conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const drugTestValueSchema = z.object({
  agrees_to_pre_employment: z.boolean(),
  agrees_to_random_testing: z.boolean().optional(),
  confirmed: z.boolean(),
});

export type DrugTestValue = z.infer<typeof drugTestValueSchema>;

/**
 * Criteria for BACKGROUND_CHECK requirement type.
 * Used in job_requirements.criteria column.
 */
export const backgroundCheckCriteriaSchema = requiredCriteriaSchema.extend({
  // Optional: specific types of background checks
  criminal_check: z.boolean().optional(),
  employment_verification: z.boolean().optional(),
  education_verification: z.boolean().optional(),
});

export type BackgroundCheckCriteria = z.infer<typeof backgroundCheckCriteriaSchema>;

/**
 * Value for BACKGROUND_CHECK conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const backgroundCheckValueSchema = z.object({
  agrees_to_background_check: z.boolean(),
  confirmed: z.boolean(),
});

export type BackgroundCheckValue = z.infer<typeof backgroundCheckValueSchema>;

/**
 * Criteria for GEOGRAPHIC_RESTRICTION requirement type.
 * Used in job_requirements.criteria column.
 */
export const geographicRestrictionCriteriaSchema = requiredCriteriaSchema.extend({
  allowed_states: z.array(z.string().length(2)).optional(), // State codes like ["NY", "NJ", "PA"]
  allowed_regions: z.array(z.string()).optional(), // Regions like ["Northeast", "Mid-Atlantic"]
});

export type GeographicRestrictionCriteria = z.infer<typeof geographicRestrictionCriteriaSchema>;

/**
 * Value for GEOGRAPHIC_RESTRICTION conversation requirement.
 * Used in conversation_requirements.value column.
 */
export const geographicRestrictionValueSchema = z.object({
  location: z.string(), // State code or city
  state: z.string().length(2).optional(), // State code (e.g., "NY")
  meets_requirement: z.boolean(),
});

export type GeographicRestrictionValue = z.infer<typeof geographicRestrictionValueSchema>;

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
 * Type guard functions to check if a value matches a specific criteria type.
 */

/**
 * Type guard for CDL_CLASS criteria
 */
export const isCDLClassCriteria = (criteria: unknown): criteria is CDLClassCriteria => {
  return cdlClassCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for YEARS_EXPERIENCE criteria
 */
export const isYearsExperienceCriteria = (criteria: unknown): criteria is YearsExperienceCriteria => {
  return yearsExperienceCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for DRIVING_RECORD criteria
 */
export const isDrivingRecordCriteria = (criteria: unknown): criteria is DrivingRecordCriteria => {
  return drivingRecordCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for ENDORSEMENTS criteria
 */
export const isEndorsementsCriteria = (criteria: unknown): criteria is EndorsementsCriteria => {
  return endorsementsCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for AGE_REQUIREMENT criteria
 */
export const isAgeRequirementCriteria = (criteria: unknown): criteria is AgeRequirementCriteria => {
  return ageRequirementCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for PHYSICAL_EXAM criteria
 */
export const isPhysicalExamCriteria = (criteria: unknown): criteria is PhysicalExamCriteria => {
  return physicalExamCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for DRUG_TEST criteria
 */
export const isDrugTestCriteria = (criteria: unknown): criteria is DrugTestCriteria => {
  return drugTestCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard functions to check if a value matches a specific conversation requirement value type.
 */

/**
 * Type guard for CDL_CLASS value
 */
export const isCDLClassValue = (value: unknown): value is CDLClassValue => {
  return cdlClassValueSchema.safeParse(value).success;
};

/**
 * Type guard for YEARS_EXPERIENCE value
 */
export const isYearsExperienceValue = (value: unknown): value is YearsExperienceValue => {
  return yearsExperienceValueSchema.safeParse(value).success;
};

/**
 * Type guard for DRIVING_RECORD value
 */
export const isDrivingRecordValue = (value: unknown): value is DrivingRecordValue => {
  return drivingRecordValueSchema.safeParse(value).success;
};

/**
 * Type guard for ENDORSEMENTS value
 */
export const isEndorsementsValue = (value: unknown): value is EndorsementsValue => {
  return endorsementsValueSchema.safeParse(value).success;
};

/**
 * Type guard for AGE_REQUIREMENT value
 */
export const isAgeRequirementValue = (value: unknown): value is AgeRequirementValue => {
  return ageRequirementValueSchema.safeParse(value).success;
};

/**
 * Type guard for PHYSICAL_EXAM value
 */
export const isPhysicalExamValue = (value: unknown): value is PhysicalExamValue => {
  return physicalExamValueSchema.safeParse(value).success;
};

/**
 * Type guard for DRUG_TEST value
 */
export const isDrugTestValue = (value: unknown): value is DrugTestValue => {
  return drugTestValueSchema.safeParse(value).success;
};

/**
 * Type guard for BACKGROUND_CHECK criteria
 */
export const isBackgroundCheckCriteria = (criteria: unknown): criteria is BackgroundCheckCriteria => {
  return backgroundCheckCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for BACKGROUND_CHECK value
 */
export const isBackgroundCheckValue = (value: unknown): value is BackgroundCheckValue => {
  return backgroundCheckValueSchema.safeParse(value).success;
};

/**
 * Type guard for GEOGRAPHIC_RESTRICTION criteria
 */
export const isGeographicRestrictionCriteria = (criteria: unknown): criteria is GeographicRestrictionCriteria => {
  return geographicRestrictionCriteriaSchema.safeParse(criteria).success;
};

/**
 * Type guard for GEOGRAPHIC_RESTRICTION value
 */
export const isGeographicRestrictionValue = (value: unknown): value is GeographicRestrictionValue => {
  return geographicRestrictionValueSchema.safeParse(value).success;
};

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

