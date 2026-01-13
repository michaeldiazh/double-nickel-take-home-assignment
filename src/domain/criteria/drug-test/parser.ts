import {ParserContext} from '../parser-types';
import {DrugTestValue, drugTestValueSchema} from './types';

/**
 * Extracts drug test value from natural language text.
 * 
 * @param content - The text content to parse
 * @returns Drug test value if found, null otherwise
 */
export const extractValueFromText = (content: string): DrugTestValue | null => {
    // Try to extract from natural language
    const upperContent = content.toUpperCase();
    const agrees = upperContent.includes('YES') || upperContent.includes('AGREE') || upperContent.includes('OKAY');
    const disagrees = upperContent.includes('NO') || upperContent.includes('DON\'T') || upperContent.includes('NOT');
    
    if (agrees && !disagrees) {
        return {
            agrees_to_pre_employment: true,
            agrees_to_random_testing: true,
            confirmed: true,
        };
    }
    
    if (disagrees) {
        return {
            agrees_to_pre_employment: false,
            agrees_to_random_testing: false,
            confirmed: true,
        };
    }
    
    return null;
};

/**
 * Parser context for drug test requirements.
 */
export const drugTestParserContext: ParserContext<DrugTestValue> = {
    notParsableErrorMessage: "The response did not contain a valid drug test requirement.",
    valueSchema: drugTestValueSchema,
    extractValueFromText
};
