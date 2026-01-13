/**
 * Parser for extracting structured data from LLM responses.
 *
 * Routes to the appropriate parser based on requirement type.
 */

import {ConversationRequirementValue, JobRequirementType} from './types';
import {RequirementParseResult, ParserContext} from './parser-types';
import { cdlClassParserContext } from './cdl-class/parser';
import { yearsExperienceParserContext } from './years-experience/parser';
import { drivingRecordParserContext } from './driving-record/parser';
import { endorsementsParserContext } from './endorsements/parser';
import { ageRequirementParserContext } from './age-requirement/parser';
import { physicalExamParserContext } from './physical-exam/parser';
import { drugTestParserContext } from './drug-test/parser';
import { backgroundCheckParserContext } from './background-check/parser';
import { geographicRestrictionParserContext } from './geographic-restriction/parser';
import {buildFailureParseResult, buildSuccessParseResult, extractValueFromPayload, extractAssessmentAndConfidence, removeJSONFromText} from "./utils";

/**
 * Map of requirement types to their parser contexts.
 */
const parserContextMap: Record<JobRequirementType, ParserContext<any>> = {
    [JobRequirementType.CDL_CLASS]: cdlClassParserContext,
    [JobRequirementType.YEARS_EXPERIENCE]: yearsExperienceParserContext,
    [JobRequirementType.DRIVING_RECORD]: drivingRecordParserContext,
    [JobRequirementType.ENDORSEMENTS]: endorsementsParserContext,
    [JobRequirementType.AGE_REQUIREMENT]: ageRequirementParserContext,
    [JobRequirementType.PHYSICAL_EXAM]: physicalExamParserContext,
    [JobRequirementType.DRUG_TEST]: drugTestParserContext,
    [JobRequirementType.BACKGROUND_CHECK]: backgroundCheckParserContext,
    [JobRequirementType.GEOGRAPHIC_RESTRICTION]: geographicRestrictionParserContext,
};

/**
 * Extracts a value, assessment, and confidence from content using a parser context.
 * Tries JSON extraction first (preferred), then falls back to text extraction.
 * JSON extraction is always attempted and preferred if available (more structured/validated).
 * Assessment and confidence are extracted from both JSON and text responses.
 */
const extractValue = <T extends ConversationRequirementValue>(content: string, parserContext: ParserContext<T>): RequirementParseResult<T> => {
    const {valueSchema} = parserContext;
    
    // Extract assessment, confidence, and message from content (may be in JSON or text)
    const {assessment, confidence, message} = extractAssessmentAndConfidence(content);
    
    // Clean the message to remove any embedded JSON (parser's responsibility)
    const cleanedMessage = message ? removeJSONFromText(message) : null;
    console.log(`[extractValue] cleanedMessage: ${cleanedMessage}`);
    // Always try to extract from JSON payload first (more structured and validated)
    const jsonResult = extractValueFromPayload(content, valueSchema);
    if (jsonResult) {
        if(jsonResult.needs_clarification) {
            return {
                success: false,
                value: null as never,
                error: parserContext.notParsableErrorMessage,
                needsClarification: true,
                assessment: assessment ?? null,
                confidence: confidence ?? null,
                message: cleanedMessage || null,
            };
        } 
        return buildSuccessParseResult(jsonResult, assessment, confidence, cleanedMessage);
    }
    
    // Try to extract from natural language text as fallback
    const textResult = parserContext.extractValueFromText(content);
    if (textResult) {
        // If no message was extracted from JSON, use cleaned raw content as fallback
        const fallbackMessage = cleanedMessage || removeJSONFromText(content);
        return buildSuccessParseResult(textResult, assessment, confidence, fallbackMessage);
    }

    // Both methods failed - but we should still try to return a cleaned message
    // The parser should always attempt to clean the content, even if parsing fails
    const fallbackCleanedMessage = removeJSONFromText(content);
    return {
        success: false,
        value: null as never,
        error: parserContext.notParsableErrorMessage,
        needsClarification: true,
        assessment: assessment ?? null,
        confidence: confidence ?? null,
        message: fallbackCleanedMessage || null, // Always return cleaned message, even on failure
    };
};

/**
 * Parses an LLM response to extract structured data based on the requirement type.
 *
 * @param requirementType - The type of requirement being evaluated
 * @param content - The LLM response content (may be natural language or JSON)
 * @returns RequirementParseResult with the parsed and validated value
 */
export const parseLLMResponse = <T extends ConversationRequirementValue>(
    requirementType: JobRequirementType,
    content: string
): RequirementParseResult<T> => {
    console.log(`[parseLLMResponse] content: ${content}`);
    const parserContext = parserContextMap[requirementType];
    if (!parserContext) {
        // Even for unsupported types, try to clean the content
        const cleanedMessage = removeJSONFromText(content);
        return {
            success: false,
            value: null,
            error: `Unsupported requirement type: ${requirementType}`,
            needsClarification: true,
            assessment: null,
            confidence: null,
            message: cleanedMessage || null,
        };
    }

    return extractValue(content, parserContext);
};

export type {RequirementParseResult, ParseResult} from './parser-types';
