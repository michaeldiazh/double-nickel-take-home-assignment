import {ParserContext} from "../types";
import {CDLClassValue, cdlClassValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const CDLParserContext: ParserContext<CDLClassValue> = {
    notParsableErrorMessage: "The response did not contain a valid CDL class.",
    valueSchema: cdlClassValueSchema,
    extractValueFromText
}

export default CDLParserContext;