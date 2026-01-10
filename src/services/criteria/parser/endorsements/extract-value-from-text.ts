import {EndorsementsValue} from "../../criteria-types";

const extractValueFromText = (content: string): EndorsementsValue | null => {
    // Try to extract from natural language
    const upperContent = content.toUpperCase();
    const hazmat = upperContent.includes('HAZMAT') || upperContent.includes('H');
    const tanker = upperContent.includes('TANKER') || upperContent.includes('T');
    const doublesTriples = upperContent.includes('DOUBLES') || upperContent.includes('TRIPLES') || upperContent.includes('DOUBLE/TRIPLE');
    
    if (hazmat || tanker || doublesTriples) {
        return {
            hazmat: hazmat ? true : undefined,
            tanker: tanker ? true : undefined,
            doubles_triples: doublesTriples ? true : undefined,
            endorsements_confirmed: true,
        };
    }
    
    return null;
};

export default extractValueFromText;


