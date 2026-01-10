import {ParserContext} from "../types";
import {GeographicRestrictionValue, geographicRestrictionValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const GeographicRestrictionParserContext: ParserContext<GeographicRestrictionValue> = {
    notParsableErrorMessage: "The response did not contain a valid geographic restriction requirement.",
    valueSchema: geographicRestrictionValueSchema,
    extractValueFromText
}

export default GeographicRestrictionParserContext;


