import {DrivingRecordValue} from "../../criteria-types";

type ViolationAccidentCount = {
    violations: number;
    accidents: number;
}

const VIOLATION_PATTERNS = /(\d+)\s*(?:violations?|tickets?)/i;
const ACCIDENT_PATTERNS = /(\d+)\s*(?:accidents?|crashes?)/i;

const extractViolationAccidentCountFromText = (text: string): ViolationAccidentCount => {
    const violationMatch = text.match(VIOLATION_PATTERNS);
    const accidentMatch = text.match(ACCIDENT_PATTERNS);
    if (violationMatch === null || accidentMatch === null) {
        return {violations: Number.NaN, accidents: Number.NaN};
    }
    const violations = violationMatch && violationMatch[1] ? parseInt(violationMatch[1], 10) : 0;
    const accidents = accidentMatch && accidentMatch[1] ? parseInt(accidentMatch[1], 10) : 0;
    return {violations, accidents};
}

const extractValueFromText = (text: string): DrivingRecordValue | null => {
    const counts = extractViolationAccidentCountFromText(text);
    if (isNaN(counts.violations) || isNaN(counts.accidents)) {
        return null;
    }
    const clean_record = counts.violations === 0 && counts.accidents === 0;
    return {violations: counts.violations, accidents: counts.accidents, clean_record};
}

export default extractValueFromText