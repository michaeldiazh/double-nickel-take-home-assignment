import {ParserContext} from "../types";
import {DrugTestValue, drugTestValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const DrugTestParserContext: ParserContext<DrugTestValue> = {
    notParsableErrorMessage: "The response did not contain a valid drug test requirement.",
    valueSchema: drugTestValueSchema,
    extractValueFromText
}

export default DrugTestParserContext;


