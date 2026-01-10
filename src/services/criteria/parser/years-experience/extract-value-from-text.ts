import {YearsExperienceValue} from "../../criteria-types";

const extractValueFromText = (content: string): YearsExperienceValue | null => {
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

export default extractValueFromText;


