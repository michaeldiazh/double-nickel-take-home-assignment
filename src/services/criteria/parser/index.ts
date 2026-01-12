/**
 * Parser for extracting structured data from LLM responses.
 *
 * Routes to the appropriate parser based on requirement type.
 */

import {ConversationRequirementValue, JobRequirementType} from '../criteria-types';
import {ParseResult, ParserContext} from './types';
import CDLClassParserContext from './cdl-class/';
import YearsExperienceParserContext from './years-experience/';
import DrivingRecordParserContext from './driving-record/';
import EndorsementsParserContext from './endorsements/';
import AgeRequirementParserContext from './age-requirement/';
import PhysicalExamParserContext from './physical-exam/';
import DrugTestParserContext from './drug-test/';
import BackgroundCheckParserContext from './background-check/';
import GeographicRestrictionParserContext from './geographic-restriction/';
import {buildFailureParseResult, buildSuccessParseResult, extractValueFromPayload, extractAssessmentAndConfidence, removeJSONFromText} from "./utils";

/**
 * Map of requirement types to their parser contexts.
 */
const parserContextMap: Record<JobRequirementType, ParserContext<any>> = {
    [JobRequirementType.CDL_CLASS]: CDLClassParserContext,
    [JobRequirementType.YEARS_EXPERIENCE]: YearsExperienceParserContext,
    [JobRequirementType.DRIVING_RECORD]: DrivingRecordParserContext,
    [JobRequirementType.ENDORSEMENTS]: EndorsementsParserContext,
    [JobRequirementType.AGE_REQUIREMENT]: AgeRequirementParserContext,
    [JobRequirementType.PHYSICAL_EXAM]: PhysicalExamParserContext,
    [JobRequirementType.DRUG_TEST]: DrugTestParserContext,
    [JobRequirementType.BACKGROUND_CHECK]: BackgroundCheckParserContext,
    [JobRequirementType.GEOGRAPHIC_RESTRICTION]: GeographicRestrictionParserContext,
};

/**
 * Extracts a value, assessment, and confidence from content using a parser context.
 * Tries JSON extraction first (preferred), then falls back to text extraction.
 * JSON extraction is always attempted and preferred if available (more structured/validated).
 * Assessment and confidence are extracted from both JSON and text responses.
 */
const extractValue = <T extends ConversationRequirementValue>(content: string, parserContext: ParserContext<T>): ParseResult<T> => {
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
 * @returns ParseResult with the parsed and validated value
 */
export const parseLLMResponse = <T extends ConversationRequirementValue>(
    requirementType: JobRequirementType,
    content: string
): ParseResult<T> => {
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

export type {ParseResult} from './types';

