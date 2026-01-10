import {ParserContext} from "../types";
import {YearsExperienceValue, yearsExperienceValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const YearsExperienceParserContext: ParserContext<YearsExperienceValue> = {
    notParsableErrorMessage: "The response did not contain a valid years of experience requirement.",
    valueSchema: yearsExperienceValueSchema,
    extractValueFromText
}

export default YearsExperienceParserContext;


