import {GeographicRestrictionValue} from "../../criteria-types";

const extractValueFromText = (content: string): GeographicRestrictionValue | null => {
    // Try to extract state code from natural language
    // US state codes are 2 letters
    const stateCodeMatch = content.match(/\b([A-Z]{2})\b/);
    if (stateCodeMatch) {
        const state = stateCodeMatch[1];
        return { location: state, state, meets_requirement: true }; // Will be evaluated against criteria
    }
    
    return null;
};

export default extractValueFromText;


