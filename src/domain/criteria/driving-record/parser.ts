import {ParserContext} from '../parser-types';
import {DrivingRecordValue, drivingRecordValueSchema} from './types';

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

/**
 * Extracts driving record value from natural language text.
 * 
 * @param text - The text content to parse
 * @returns Driving record value if found, null otherwise
 */
export const extractValueFromText = (text: string): DrivingRecordValue | null => {
    const counts = extractViolationAccidentCountFromText(text);
    if (isNaN(counts.violations) || isNaN(counts.accidents)) {
        return null;
    }
    const clean_record = counts.violations === 0 && counts.accidents === 0;
    return {violations: counts.violations, accidents: counts.accidents, clean_record};
}

/**
 * Parser context for driving record requirements.
 */
export const drivingRecordParserContext: ParserContext<DrivingRecordValue> = {
    notParsableErrorMessage: "The response did not contain a valid driving record requirement.",
    valueSchema: drivingRecordValueSchema,
    extractValueFromText
};
