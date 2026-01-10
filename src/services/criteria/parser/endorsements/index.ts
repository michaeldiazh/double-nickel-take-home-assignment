import {ParserContext} from "../types";
import {EndorsementsValue, endorsementsValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const EndorsementsParserContext: ParserContext<EndorsementsValue> = {
    notParsableErrorMessage: "The response did not contain a valid endorsements requirement.",
    valueSchema: endorsementsValueSchema,
    extractValueFromText
}

export default EndorsementsParserContext;


