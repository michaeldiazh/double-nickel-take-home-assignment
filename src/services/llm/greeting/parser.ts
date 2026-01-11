/**
 * Parser for yes/no responses from users.
 * 
 * This parser extracts whether a user wants to continue (yes) or decline (no)
 * from their response to the initial greeting.
 */

export interface YesNoParseResult {
  /**
   * Whether parsing was successful
   */
  success: boolean;

  /**
   * Whether the user wants to continue (true = yes, false = no)
   */
  wantsToContinue: boolean | null;

  /**
   * The message to send back to the user (if any)
   * For "no" responses, this might be a good luck message
   */
  message?: string;

  /**
   * Confidence level (0.0 to 1.0) in the parsing result
   */
  confidence?: number;

  /**
   * Error message if parsing failed
   */
  error?: string;

  /**
   * Whether the response was ambiguous and needs clarification
   */
  needsClarification: boolean;
}

/**
 * Simple keyword-based parser for yes/no responses.
 * Fast and works for most cases.
 * Use this as a first pass, then use LLM parsing if ambiguous.
 * 
 * @param userMessage - The user's response message
 * @returns Parse result indicating yes/no or ambiguous
 */
export function parseYesNoSimple(userMessage: string): YesNoParseResult {
  const normalized = userMessage.toLowerCase().trim();

  // Yes keywords
  const yesKeywords = ['yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'sounds good', 'let\'s go', 'continue', 'proceed'];
  
  // No keywords
  const noKeywords = ['no', 'nope', 'nah', 'not interested', 'decline', 'pass', 'maybe later', 'no thanks', 'no thank you'];

  // Check for yes
  const isYes = yesKeywords.some(keyword => normalized.includes(keyword));
  const isNo = noKeywords.some(keyword => normalized.includes(keyword));

  if (isYes && !isNo) {
    return {
      success: true,
      wantsToContinue: true,
      confidence: 0.9,
      needsClarification: false,
    };
  }

  if (isNo && !isYes) {
    return {
      success: true,
      wantsToContinue: false,
      confidence: 0.9,
      needsClarification: false,
    };
  }

  // Ambiguous or conflicting
  return {
    success: false,
    wantsToContinue: null,
    confidence: 0.5,
    needsClarification: true,
    error: 'Unable to determine yes/no from response',
  };
}

/**
 * Builds a prompt for LLM to parse yes/no responses.
 * Used when simple keyword parsing is ambiguous.
 * 
 * @param userMessage - The user's response message
 * @returns System prompt string for LLM parsing
 */
export function buildYesNoParsingPrompt(userMessage: string): string {
  return `You are a parser that extracts yes/no intent from user messages.

The user was asked if they want to continue with a pre-approval process, and they responded:
"${userMessage}"

Extract whether they want to continue (yes) or decline (no) from their response.

Return your response in the following exact JSON format:
{
  "wants_to_continue": boolean (true if they said yes/want to continue, false if they said no/declined),
  "confidence": number (0.0 to 1.0, representing your confidence in the interpretation),
  "reason": string (brief explanation of why you interpreted it this way)
}

Important: Return ONLY the JSON object, no additional text.`;
}
