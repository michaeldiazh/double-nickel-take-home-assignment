import {z} from 'zod';
import {requirementStatusSchema} from '../enums';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema, numberFilterOperatorsSchema, booleanFilterOperatorsSchema} from '../../database/types';
import {
    conversationRequirementsShape,
    conversationRequirementsFilterShape,
    conversationRequirementsFilterSchema,
    conversationRequirementsSchema
} from '../conversation-requirements';

/**
 * LLMEvaluationAudit shape - base fields for simplified LLMEvaluationAudit objects
 * Excludes metadata timestamps
 * Uses conversationRequirementId reference instead of full object to avoid infinite nesting
 */
export const llmEvaluationAuditShape = {
    id: z.uuidv4(),
    conversationRequirementId: z.uuidv4(),
    requirementType: z.string().max(50),
    llmValue: z.record(z.string(), z.unknown()),
    llmAssessmentResult: requirementStatusSchema.nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    criteria: z.record(z.string(), z.unknown()),
    actualResult: requirementStatusSchema,
    modelName: z.string().max(50),
    discrepancy: z.boolean(),
};

/**
 * Simplified LLMEvaluationAudit object
 * Used when embedding LLM evaluation audit information in other entities
 * Contains only essential fields (excludes timestamps)
 */
export const simplifiedLlmEvaluationAuditSchema = z.object(llmEvaluationAuditShape);

export type SimplifiedLlmEvaluationAudit = z.infer<typeof simplifiedLlmEvaluationAuditSchema>;

/**
 * Zod schema for LLMEvaluationAudit entity
 * Use this for validating unknown data from the database
 * Uses simplified conversationRequirement object (with ID references, not full nested objects)
 * Extends llmEvaluationAuditShape and replaces conversationRequirementId with full object
 */
export const llmEvaluationAuditSchema = z.object(llmEvaluationAuditShape).extend({
    conversationRequirement: z.object(conversationRequirementsShape),
    createdAt: z.date(),
    updatedAt: z.date(),
}).omit({conversationRequirementId: true});

/**
 * LLM Evaluation Audit Entity
 *
 * This table logs LLM responses and compares them against actual evaluation results.
 * Used for auditing, quality metrics, model comparison, and future RAG implementation.
 *
 * Purpose:
 * - Tracks what the LLM parsed from user responses (llm_value)
 * - Records the LLM's assessment of whether the requirement was met (llm_assessment_result)
 * - Stores confidence scores from the LLM (if provided)
 * - Compares LLM assessment vs actual evaluation result (discrepancy flag)
 * - Links to the specific conversation_requirement being evaluated
 *
 * Important Notes:
 * - llm_assessment_result is optional and represents what the LLM thinks (MET/NOT_MET/PENDING)
 * - actual_result is what we calculate using criteria handlers (always present)
 * - discrepancy is true when llm_assessment_result differs from actual_result
 * - confidence is optional (0.0 to 1.0, representing 0% to 100% confidence)
 */
export type LLMEvaluationAudit = z.infer<typeof llmEvaluationAuditSchema>;

export const llmEvaluationAuditFilterShape = {
    id: stringFilterOperatorsSchema,
    conversationRequirementId: stringFilterOperatorsSchema,
    requirementType: stringFilterOperatorsSchema,
    llmAssessmentResult: stringFilterOperatorsSchema,
    confidence: numberFilterOperatorsSchema,
    actualResult: stringFilterOperatorsSchema,
    modelName: stringFilterOperatorsSchema,
    discrepancy: booleanFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
    conversationRequirement: z.object(conversationRequirementsFilterShape).partial(),
};

export const llmEvaluationAuditFilterSchema: z.ZodObject = z.object(llmEvaluationAuditFilterShape).partial();

export const llmEvaluationAuditKeySchema = llmEvaluationAuditSchema.keyof();
export type LLMEvaluationAuditKey = z.infer<typeof llmEvaluationAuditKeySchema>;

