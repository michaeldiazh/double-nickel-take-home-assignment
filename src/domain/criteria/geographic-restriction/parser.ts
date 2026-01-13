import {ParserContext} from '../parser-types';
import {GeographicRestrictionValue, geographicRestrictionValueSchema} from './types';

/**
 * Extracts geographic restriction value from natural language text.
 * 
 * @param content - The text content to parse
 * @returns Geographic restriction value if found, null otherwise
 */
export const extractValueFromText = (content: string): GeographicRestrictionValue | null => {
    // Try to extract state code from natural language
    // US state codes are 2 letters
    const stateCodeMatch = content.match(/\b([A-Z]{2})\b/);
    if (stateCodeMatch) {
        const state = stateCodeMatch[1];
        return { location: state, state, meets_requirement: true }; // Will be evaluated against criteria
    }
    
    return null;
};

/**
 * Parser context for geographic restriction requirements.
 */
export const geographicRestrictionParserContext: ParserContext<GeographicRestrictionValue> = {
    notParsableErrorMessage: "The response did not contain a valid geographic restriction requirement.",
    valueSchema: geographicRestrictionValueSchema,
    extractValueFromText
};
