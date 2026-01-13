/**
 * Utility functions for parsing LLM responses.
 */

import {ConversationRequirementValue} from "./types";
import {RequirementParseResult} from "./parser-types";
import {RequirementStatus, requirementStatusSchema} from "../../entities/enums";
import {z} from "zod";
import {jsonrepair} from "jsonrepair";

/**
 * Attempts to extract JSON from a string that may contain JSON.
 * Handles cases where JSON is embedded in text or wrapped in markdown code blocks.
 *
 * @param text - The text that may contain JSON
 * @returns The extracted JSON value, or null if no valid JSON found
 */
export const extractJSON = (text: string): unknown | null => {
    const candidates = []
    // Try to find JSON in markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch?.[1]) {
        const obj = tryParseObject(jsonBlockMatch[1].trim());
        if (obj) return obj;
    }

    // 2) scan for balanced JSON objects in raw text
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== "{") continue;

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let j = i; j < text.length; j++) {
            const ch = text[j];

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === "\\") {
                    escaped = true;
                } else if (ch === `"`) {
                    inString = false;
                }
                continue;
            }

            if (ch === `"`) inString = true;
            else if (ch === "{") depth++;
            else if (ch === "}") depth--;

            if (depth === 0) {
                candidates.push(text.slice(i, j + 1));
                break;
            }
        }
    }

    for (const c of candidates) {
        const obj = tryParseObject(c);
        if (obj) return obj;
    }
    return null;

};
const tryParseObject = (s: string): Record<string, unknown> | null => {
    try {
        const v = JSON.parse(s);
        return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
        return null;
    }
};
const tryParseJSON = (text: string): unknown | null => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Extracts and validates a JSON object from text.
 * Returns a properly typed object (not null, not array) or null if invalid.
 *
 * @param text - The text that may contain a JSON object
 * @returns The extracted JSON object as a Record, or null if invalid/not an object
 */
export const extractJSONObject = (text: string): Record<string, unknown> | null => {
    const attempts = [text, text.trim()];

    for (const a of attempts) {
        // 1) stricto
        const strict = tryParseObject(a);
        if (strict) return strict;

        // 2) repaired
        try {
            const repaired = jsonrepair(a);
            const repairedObj = tryParseObject(repaired);
            if (repairedObj) return repairedObj;
        } catch {
            // ignore
        }
    }
    return null;
};

/**
 * Schema for validating the assessment field from LLM response.
 * Validates that the value is one of the RequirementStatus enum values.
 */
const assessmentSchema = requirementStatusSchema.nullable().optional().transform((val) => {
    if (val === null || val === undefined) return null;
    return RequirementStatus[val];
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

    // Remove assessment, confidence, and message fields before validating with value schema
    // The value schema should only contain requirement-specific fields
    // We explicitly exclude these fields to avoid any potential schema validation issues
    const {assessment: _assessment, confidence: _confidence, message: _message, ...valueFields} = jsonObject;

    const result = valueSchema.safeParse(valueFields);
    if (result.success) return result.data;
    return null;
};

/**
 * Extracts assessment, confidence, and message from the full JSON response.
 * These fields are separate from the requirement-specific value.
 *
 * @param context - The LLM response content
 * @returns Object with assessment, confidence, and message, or null values if not present/invalid
 */
export const extractAssessmentAndConfidence = (context: string): {
    assessment: RequirementStatus | null;
    confidence: number | null;
    message: string | null;
} => {
    const jsonObject = extractJSONObject(context);
    if (!jsonObject) {
        return {assessment: null, confidence: null, message: null};
    }

    const assessmentResult = assessmentSchema.safeParse(jsonObject.assessment);
    const confidenceResult = confidenceSchema.safeParse(jsonObject.confidence);
    const messageResult = typeof jsonObject.message === 'string' ? jsonObject.message : null;

    return {
        assessment: assessmentResult.success && assessmentResult.data !== null && assessmentResult.data !== undefined
            ? (assessmentResult.data as RequirementStatus)
            : null,
        confidence: confidenceResult.success && confidenceResult.data !== null && confidenceResult.data !== undefined
            ? confidenceResult.data
            : null,
        message: messageResult,
    };
};

/**
 * Builds a successful parse result with the extracted value, assessment, confidence, and message.
 *
 * @param value - The parsed requirement-specific value
 * @param assessment - The LLM's assessment (optional)
 * @param confidence - The LLM's confidence level (optional)
 * @param message - The conversational message to send to the candidate (optional)
 * @returns RequirementParseResult with all extracted fields
 */
export const buildSuccessParseResult = <T extends ConversationRequirementValue>(
    value: T,
    assessment?: RequirementStatus | null,
    confidence?: number | null,
    message?: string | null
): RequirementParseResult<T> => ({
    success: true,
    value,
    needsClarification: false,
    assessment: assessment ?? null,
    confidence: confidence ?? null,
    message: message ?? null,
});

/**
 * Builds a failed parse result with an error message.
 *
 * @param error - The error message describing why parsing failed
 * @returns RequirementParseResult indicating failure
 */
export const buildFailureParseResult = (error: string): RequirementParseResult<never> => ({
    success: false,
    value: null as never,
    error,
    needsClarification: true,
    assessment: null,
    confidence: null,
});

/**
 * Removes JSON objects and JSON code blocks from text, keeping only the conversational content.
 * This is used to clean assistant messages before sending them to users, removing internal evaluation JSON.
 *
 * @param text - The text that may contain JSON
 * @returns The text with JSON removed
 */
export const removeJSONFromText = (text: string): string => {
    let cleaned = text;

    // Remove JSON in markdown code blocks (```json ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '');

    // Remove JSON objects - try to match the largest JSON object (greedy, like extractJSON)
    // Start from the end and work backwards to find complete JSON objects
    // For each potential JSON object, check if it's valid JSON and remove it
    const jsonPattern = /\{[\s\S]*\}/g;
    let match;
    const matches: Array<{ start: number; end: number; text: string }> = [];

    while ((match = jsonPattern.exec(cleaned)) !== null) {
        const jsonCandidate = match[0];
        // Check if this looks like JSON (contains quotes and colons)
        if (jsonCandidate.includes('"') && jsonCandidate.includes(':')) {
            // Try to parse it to verify it's valid JSON
            try {
                JSON.parse(jsonCandidate);
                matches.push({start: match.index, end: match.index + jsonCandidate.length, text: jsonCandidate});
            } catch {
                // Not valid JSON, skip it
            }
        }
    }

    // Remove matches from end to start to preserve indices
    matches.reverse().forEach(({start, end}) => {
        cleaned = cleaned.substring(0, start) + cleaned.substring(end);
    });

    // Remove lines that mention "assessment", "evaluation", or "provide" (intro lines before JSON)
    cleaned = cleaned.replace(/^.*(?:will now provide|assessment|evaluation).*:?\s*$/gmi, '');

    // Clean up multiple consecutive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Remove empty lines at the start/end
    cleaned = cleaned.replace(/^\n+|\n+$/g, '');

    // Trim whitespace
    return cleaned.trim();
};
