import {AgeRequirementValue} from "../../criteria-types";

const AGE_PATTERN = /(\d{1,3})\s*(years?\s*old|age)/i;
const MINIMUM_AGE = 18;

const isValidAge = (age: number): boolean => !isNaN(age) && age >= MINIMUM_AGE;


const extractAgeFromText = (text: string): number | null => {
    const match = text.match(AGE_PATTERN);
    if (match && match[1]) {
        const age = parseInt(match[1], 10);
        if (isValidAge(age)) return age;
    }
    return null;
};
const extractValueFromText = (text: string): AgeRequirementValue | null => {
    const age = extractAgeFromText(text);
    if (age) return {age, meets_requirement: age >= 18};
    return null;
}

export default extractValueFromText;