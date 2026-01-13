import {ParserContext} from '../parser-types';
import {YearsExperienceValue, yearsExperienceValueSchema} from './types';

/**
 * Extracts years of experience value from natural language text.
 * 
 * @param content - The text content to parse
 * @returns Years experience value if found, null otherwise
 */
export const extractValueFromText = (content: string): YearsExperienceValue | null => {
    // Try to extract number from natural language
    const numberMatch = content.match(/(\d+)\s*(?:years?|yrs?)/i);
    if (numberMatch) {
        const years = parseInt(numberMatch[1], 10);
        if (!isNaN(years)) {
            return { years_experience: years, meets_requirement: true };
        }
    }
    
    return null;
};

/**
 * Parser context for years of experience requirements.
 */
export const yearsExperienceParserContext: ParserContext<YearsExperienceValue> = {
    notParsableErrorMessage: "The response did not contain a valid years of experience requirement.",
    valueSchema: yearsExperienceValueSchema,
    extractValueFromText
};
