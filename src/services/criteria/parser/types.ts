/**
 * Types for the parser module.
 */

import type { ConversationRequirementValue } from '../criteria-types';
import {z} from "zod";

/**
 * Result of parsing an LLM response.
 */
export interface ParseResult<T extends ConversationRequirementValue> {
  /**
   * Whether the parsing was successful
   */
  success: boolean;

  /**
   * The parsed and validated value (if successful)
   */
  value: T | null;

  /**
   * Error message if parsing failed
   */
  error?: string;

  /**
   * Whether the response was ambiguous and needs clarification
   */
  needsClarification: boolean;
}

export interface ParserContext<T extends ConversationRequirementValue> {
    notParsableErrorMessage: string;
    valueSchema: z.ZodType<T>;
    extractValueFromText: (content: string) => T | null;
}