import {ParserContext} from "../types";
import {AgeRequirementValue, ageRequirementValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";
const AgeRequirementParserContext: ParserContext<AgeRequirementValue> = {
    notParsableErrorMessage: "The response did not contain a valid age requirement.",
    valueSchema: ageRequirementValueSchema,
    extractValueFromText
}

export default AgeRequirementParserContext;