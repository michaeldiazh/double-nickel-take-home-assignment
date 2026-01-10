/**
 * Utility functions for parsing LLM responses.
 */

import {ConversationRequirementValue} from "../criteria-types";
import {ParseResult} from "./types";
import {RequirementStatus, requirementStatusSchema} from "../../../entities/enums";
import {z} from "zod";

/**
 * Attempts to extract JSON from a string that may contain JSON.
 * Handles cases where JSON is embedded in text or wrapped in markdown code blocks.
 *
 * @param text - The text that may contain JSON
 * @returns The extracted JSON value, or null if no valid JSON found
 */
export const extractJSON = (text: string): unknown | null => {
    // Try to find JSON in markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch {
            // Continue to other methods
        }
    }

    // Try to find JSON object in the text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
        try {
            return JSON.parse(jsonObjectMatch[0]);
        } catch {
            // Continue to other methods
        }
    }

    // Try parsing the entire text as JSON
    try {
        return JSON.parse(text.trim());
    } catch {
        return null;
    }
};

/**
 * Extracts and validates a JSON object from text.
 * Returns a properly typed object (not null, not array) or null if invalid.
 *
 * @param text - The text that may contain a JSON object
 * @returns The extracted JSON object as a Record, or null if invalid/not an object
 */
export const extractJSONObject = (text: string): Record<string, unknown> | null => {
    const json = extractJSON(text);
    if (!json || typeof json !== 'object' || json === null || Array.isArray(json)) {
        return null;
    }
    return json as Record<string, unknown>;
};

/**
 * Schema for validating the assessment field from LLM response.
 * Validates that the value is one of the RequirementStatus enum values.
 */
const assessmentSchema = requirementStatusSchema.nullable().optional().transform((val) => {
    if (val === null || val === undefined) return null;
    return val as RequirementStatus;
});

/**
 * Schema for validating the confidence field from LLM response.
 * Must be between 0.0 and 1.0 if present.
 */
const confidenceSchema = z.number().min(0).max(1).nullable().optional();

/**
 * Extracts the requirement-specific value from the full JSON response.
 * This strips out assessment and confidence fields, leaving only the requirement-specific data.
 * 
 * @param context - The LLM response content
 * @param valueSchema - Schema for validating the requirement-specific value
 * @returns The parsed value, or null if parsing fails
 */
export const extractValueFromPayload = <T extends ConversationRequirementValue>(context: string, valueSchema: z.ZodType<T>): T | null => {
    const jsonObject = extractJSONObject(context);
    if (!jsonObject) return null;
    
    // Remove assessment and confidence fields before validating with value schema
    // The value schema should only contain requirement-specific fields
    // We explicitly exclude these fields to avoid any potential schema validation issues
    const { assessment: _assessment, confidence: _confidence, ...valueFields } = jsonObject;
    
    const result = valueSchema.safeParse(valueFields);
    if (result.success) return result.data;
    return null;
};

/**
 * Extracts assessment and confidence from the full JSON response.
 * These fields are separate from the requirement-specific value.
 * 
 * @param context - The LLM response content
 * @returns Object with assessment and confidence, or null values if not present/invalid
 */
export const extractAssessmentAndConfidence = (context: string): { assessment: RequirementStatus | null; confidence: number | null } => {
    const jsonObject = extractJSONObject(context);
    if (!jsonObject) {
        return { assessment: null, confidence: null };
    }
    
    const assessmentResult = assessmentSchema.safeParse(jsonObject.assessment);
    const confidenceResult = confidenceSchema.safeParse(jsonObject.confidence);
    
    return {
        assessment: assessmentResult.success && assessmentResult.data !== null && assessmentResult.data !== undefined 
            ? (assessmentResult.data as RequirementStatus) 
            : null,
        confidence: confidenceResult.success && confidenceResult.data !== null && confidenceResult.data !== undefined 
            ? confidenceResult.data 
            : null,
    };
};

/**
 * Builds a successful parse result with the extracted value, assessment, and confidence.
 * 
 * @param value - The parsed requirement-specific value
 * @param assessment - The LLM's assessment (optional)
 * @param confidence - The LLM's confidence level (optional)
 * @returns ParseResult with all extracted fields
 */
export const buildSuccessParseResult = <T extends ConversationRequirementValue>(
    value: T,
    assessment?: RequirementStatus | null,
    confidence?: number | null
): ParseResult<T> => ({
    success: true,
    value,
    needsClarification: false,
    assessment: assessment ?? null,
    confidence: confidence ?? null,
});

/**
 * Builds a failed parse result with an error message.
 * 
 * @param error - The error message describing why parsing failed
 * @returns ParseResult indicating failure
 */
export const buildFailureParseResult = (error: string): ParseResult<never> => ({
    success: false,
    value: null as never,
    error,
    needsClarification: true,
    assessment: null,
    confidence: null,
});