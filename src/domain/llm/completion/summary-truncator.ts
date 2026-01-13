import { LLMClient, MessageRole } from '../../../domain/llm/client';
import { Processor, createProcessor } from '../../../processor';
import { ConversationContext } from '../../../domain/prompts/builders/types';

/**
 * Maximum length for screening summary (in characters).
 * PostgreSQL TEXT can be very large, but we set a practical limit for UI/API purposes.
 */
const MAX_SUMMARY_LENGTH = 300; // 10,000 characters should be sufficient for most summaries

/**
 * Dependencies for truncating/condensing summary.
 */
export interface SummaryTruncatorDependencies {
  llmClient: LLMClient;
}

/**
 * Result of truncating summary.
 */
export interface SummaryTruncatorResult {
  truncatedSummary: string;
  wasTruncated: boolean;
}

/**
 * Truncates or condenses the screening summary if it exceeds the maximum length.
 * If the summary is too long, uses the LLM to generate a condensed version.
 * 
 * @param summary - The original screening summary
 * @param context - The conversation context (for LLM condensation if needed)
 * @param deps - Dependencies for truncation
 * @returns The truncated/condensed summary and whether it was modified
 */
export const truncateScreeningSummary = async (
  summary: string,
  context: ConversationContext,
  deps: SummaryTruncatorDependencies
): Promise<SummaryTruncatorResult> => {
  // If summary is within limit, return as-is
  if (summary.length <= MAX_SUMMARY_LENGTH) {
    return {
      truncatedSummary: summary,
      wasTruncated: false,
    };
  }

  // Summary is too long - use LLM to create a condensed version
  const processor: Processor = createProcessor({ llmClient: deps.llmClient });

  const condensationPrompt = `Please create a condensed version of the following screening summary. 
Keep all critical information (pass/fail status, key qualifications, requirements met/not met) but make it more concise.
Target length: approximately ${MAX_SUMMARY_LENGTH} characters or less.

Original Summary:
${summary}`;

  const condensedResponse = await processor({
    context, // Pass context as-is (already has correct status)
    isInitialMessage: false,
    streamOptions: undefined, // Don't stream for condensation
  }, [{role: MessageRole.SYSTEM, content: condensationPrompt}]);

  const condensedSummary = condensedResponse.assistantMessage;

  // If still too long after condensation, do a hard truncate with ellipsis
  if (condensedSummary.length > MAX_SUMMARY_LENGTH) {
    return {
      truncatedSummary: condensedSummary.substring(0, MAX_SUMMARY_LENGTH - 3) + '...',
      wasTruncated: true,
    };
  }

  return {
    truncatedSummary: condensedSummary,
    wasTruncated: true,
  };
};
