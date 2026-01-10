import {ParserContext} from "../types";
import {PhysicalExamValue, physicalExamValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const PhysicalExamParserContext: ParserContext<PhysicalExamValue> = {
    notParsableErrorMessage: "The response did not contain a valid physical exam requirement.",
    valueSchema: physicalExamValueSchema,
    extractValueFromText
}

export default PhysicalExamParserContext;


