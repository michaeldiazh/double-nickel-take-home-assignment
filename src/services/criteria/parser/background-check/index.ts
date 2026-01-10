import {ParserContext} from "../types";
import {BackgroundCheckValue, backgroundCheckValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const BackgroundCheckParserContext: ParserContext<BackgroundCheckValue> = {
    notParsableErrorMessage: "The response did not contain a valid background check requirement.",
    valueSchema: backgroundCheckValueSchema,
    extractValueFromText
}

export default BackgroundCheckParserContext;