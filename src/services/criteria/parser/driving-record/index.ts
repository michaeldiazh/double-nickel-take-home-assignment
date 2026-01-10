import {ParserContext} from "../types";
import {DrivingRecordValue, drivingRecordValueSchema} from "../../criteria-types";
import extractValueFromText from "./extract-value-from-text";

const DrivingRecordParserContext: ParserContext<DrivingRecordValue> = {
    notParsableErrorMessage: "The response did not contain a valid driving record requirement.",
    valueSchema: drivingRecordValueSchema,
    extractValueFromText
}

export default DrivingRecordParserContext;