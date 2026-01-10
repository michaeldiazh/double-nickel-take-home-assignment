import {PhysicalExamValue} from "../../criteria-types";

const extractValueFromText = (content: string): PhysicalExamValue | null => {
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

export default extractValueFromText;


