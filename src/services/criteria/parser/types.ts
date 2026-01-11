/**
 * Types for the parser module.
 */

import type { ConversationRequirementValue } from '../criteria-types';
import { RequirementStatus } from '../../../entities/enums';
import {z} from "zod";

/**
 * Result of parsing an LLM response.
 * Includes the parsed value, LLM's assessment, and confidence level.
 */
export interface ParseResult<T extends ConversationRequirementValue> {
  /**
   * Whether the parsing was successful
   */
  success: boolean;

  /**
   * The parsed and validated value (if successful)
   * Contains only the requirement-specific fields (e.g., cdl_class, years_experience)
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

  /**
   * The LLM's assessment of whether the requirement was met.
   * This is extracted from the "assessment" field in the LLM's JSON response.
   * Optional because older responses or failed parses may not include it.
   */
  assessment?: RequirementStatus | null;

  /**
   * The LLM's confidence level in its assessment (0.0 to 1.0).
   * This is extracted from the "confidence" field in the LLM's JSON response.
   * Optional because the field is optional in the prompt and may not always be present.
   */
  confidence?: number | null;

  /**
   * The conversational message to send to the candidate.
   * This is extracted from the "message" field in the LLM's JSON response.
   * If not present, falls back to the raw response content.
   */
  message?: string | null;
}

export interface ParserContext<T extends ConversationRequirementValue> {
    notParsableErrorMessage: string;
    valueSchema: z.ZodType<T>;
    extractValueFromText: (content: string) => T | null;
}