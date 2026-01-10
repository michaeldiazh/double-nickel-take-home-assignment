/**
 * Utility functions for parsing LLM responses.
 */

import {ConversationRequirementValue} from "../criteria-types";
import {ParseResult} from "./types";
import {z} from "zod";

/**
 * Attempts to extract JSON from a string that may contain JSON.
 * Handles cases where JSON is embedded in text or wrapped in markdown code blocks.
 *
 * @param text - The text that may contain JSON
 * @returns The extracted JSON object, or null if no valid JSON found
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

export const extractValueFromPayload = <T extends ConversationRequirementValue>(context: string, valueSchema: z.ZodType<T>): T | null => {
    const json = extractJSON(context);
    const result = valueSchema.safeParse(json);
    if (result.success) return result.data;
    return null;
}

export const buildSuccessParseResult = <T extends ConversationRequirementValue>(value: T): ParseResult<T> => ({
    success: true,
    value,
    needsClarification: false,
});

export const buildFailureParseResult = (error: string): ParseResult<never> => ({
    success: false,
    value: null as never,
    error,
    needsClarification: true,
});