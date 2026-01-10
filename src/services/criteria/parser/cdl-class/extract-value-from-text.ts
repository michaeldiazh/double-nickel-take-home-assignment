import {CDLClass, CDLClassValue} from "../../criteria-types";

type CDLClassKeyword = [CDLClass, string[]];
const CDL_CLASS_KEYWORDS: CDLClassKeyword[] = [
    [CDLClass.A, ['CLASS A', 'CDL A']],
    [CDLClass.B, ['CLASS B', 'CDL B']],
    [CDLClass.C, ['CLASS C', 'CDL C']],
];
const contentParser = (content: string, [cdlClass, keywords]: CDLClassKeyword) => {
    for (const keyword of keywords) {
        if (content.includes(keyword)) return cdlClass;
    }
    return null;
}
const extractValueFromText = (content: string): CDLClassValue | null => {
    const upperContent = content.toUpperCase();
    for (const keywordSet of CDL_CLASS_KEYWORDS) {
        const result = contentParser(upperContent, keywordSet);
        if (result) return {cdl_class: result, confirmed: true};
    }
    return null;
};

export default extractValueFromText;