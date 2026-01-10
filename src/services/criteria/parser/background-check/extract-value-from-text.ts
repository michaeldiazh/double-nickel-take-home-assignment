import {BackgroundCheckValue} from "../../criteria-types";

const AGREE_PHRASES = ['YES', 'AGREE', 'OKAY', 'SURE', 'FINE', 'ALRIGHT', 'AFFIRMATIVE'];
const DISAGREE_PHRASES = ['NO', 'DON\'T', 'NOT', 'DECLINE', 'REFUSE', 'NEGATIVE'];

const containsAgreePhrase = (text: string): boolean => AGREE_PHRASES.some(phrase => text.includes(phrase));
const containsDisagreePhrase = (text: string): boolean => DISAGREE_PHRASES.some(phrase => text.includes(phrase));


/** Parses a background check value from LLM response.
 *
 * @param content - The LLM response content
 * @returns ParseResult with the parsed background check value
 */
export const extractValueFromText = (content: string): BackgroundCheckValue | null => {
    const upperContent = content.toUpperCase();
    const agrees = containsAgreePhrase(upperContent);
    const disagrees = containsDisagreePhrase(upperContent);
    if (agrees && !disagrees) return {agrees_to_background_check: true, confirmed: true}
    if (disagrees) return {agrees_to_background_check: false, confirmed: true}
    return null;
};

export default extractValueFromText;
