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
import {buildFailureParseResult, buildSuccessParseResult, extractValueFromPayload, extractAssessmentAndConfidence} from "./utils";

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
    
    // Always try to extract from JSON payload first (more structured and validated)
    const jsonResult = extractValueFromPayload(content, valueSchema);
    if (jsonResult) {
        return buildSuccessParseResult(jsonResult, assessment, confidence, message);
    }
    
    // Try to extract from natural language text as fallback
    const textResult = parserContext.extractValueFromText(content);
    if (textResult) {
        return buildSuccessParseResult(textResult, assessment, confidence, message);
    }

    // Both methods failed
    return buildFailureParseResult(parserContext.notParsableErrorMessage);
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
    const parserContext = parserContextMap[requirementType];
    if (!parserContext) {
        return {
            success: false,
            value: null,
            error: `Unsupported requirement type: ${requirementType}`,
            needsClarification: true,
            assessment: null,
            confidence: null,
        };
    }

    return extractValue(content, parserContext);
};

export type {ParseResult} from './types';

