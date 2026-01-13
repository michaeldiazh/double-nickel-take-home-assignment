import {ParserContext} from '../parser-types';
import {BackgroundCheckValue, backgroundCheckValueSchema} from './types';

const AGREE_PHRASES = ['YES', 'AGREE', 'OKAY', 'SURE', 'FINE', 'ALRIGHT', 'AFFIRMATIVE'];
const DISAGREE_PHRASES = ['NO', 'DON\'T', 'NOT', 'DECLINE', 'REFUSE', 'NEGATIVE'];

const containsAgreePhrase = (text: string): boolean => AGREE_PHRASES.some(phrase => text.includes(phrase));
const containsDisagreePhrase = (text: string): boolean => DISAGREE_PHRASES.some(phrase => text.includes(phrase));

/**
 * Extracts background check value from natural language text.
 * 
 * @param content - The text content to parse
 * @returns Background check value if found, null otherwise
 */
export const extractValueFromText = (content: string): BackgroundCheckValue | null => {
    const upperContent = content.toUpperCase();
    const agrees = containsAgreePhrase(upperContent);
    const disagrees = containsDisagreePhrase(upperContent);
    if (agrees && !disagrees) return {agrees_to_background_check: true, confirmed: true}
    if (disagrees) return {agrees_to_background_check: false, confirmed: true}
    return null;
};

/**
 * Parser context for background check requirements.
 */
export const backgroundCheckParserContext: ParserContext<BackgroundCheckValue> = {
    notParsableErrorMessage: "The response did not contain a valid background check requirement.",
    valueSchema: backgroundCheckValueSchema,
    extractValueFromText
};
