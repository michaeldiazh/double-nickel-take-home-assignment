import {DrugTestValue} from "../../criteria-types";

const extractValueFromText = (content: string): DrugTestValue | null => {
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

export default extractValueFromText;


