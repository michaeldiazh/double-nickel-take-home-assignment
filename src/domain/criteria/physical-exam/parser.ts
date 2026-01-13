import {ParserContext} from '../parser-types';
import {PhysicalExamValue, physicalExamValueSchema} from './types';

/**
 * Extracts physical exam value from natural language text.
 * 
 * @param content - The text content to parse
 * @returns Physical exam value if found, null otherwise
 */
export const extractValueFromText = (content: string): PhysicalExamValue | null => {
    // Try to extract from natural language
    const upperContent = content.toUpperCase();
    const hasPhysical = upperContent.includes('YES') || upperContent.includes('HAVE') || upperContent.includes('CURRENT');
    const noPhysical = upperContent.includes('NO') || upperContent.includes('DON\'T') || upperContent.includes('NOT');
    
    if (hasPhysical && !noPhysical) {
        return { has_current_dot_physical: true, confirmed: true };
    }
    
    if (noPhysical) {
        return { has_current_dot_physical: false, confirmed: true };
    }
    
    return null;
};

/**
 * Parser context for physical exam requirements.
 */
export const physicalExamParserContext: ParserContext<PhysicalExamValue> = {
    notParsableErrorMessage: "The response did not contain a valid physical exam requirement.",
    valueSchema: physicalExamValueSchema,
    extractValueFromText
};
