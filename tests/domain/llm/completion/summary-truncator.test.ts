/**
 * Tests for summary truncator module
 */

import { truncateScreeningSummary } from '../../../../src/domain/llm/completion/summary-truncator';
import { ConversationStatus } from '../../../../src/entities';
import { MessageRole } from '../../../../src/domain/llm/client';

describe('truncateScreeningSummary', () => {
  let mockLLMClient: any;
  let mockProcessor: any;
  let deps: any;
  let mockContext: any;

  beforeEach(() => {
    mockProcessor = jest.fn();
    mockLLMClient = {};

    deps = {
      llmClient: mockLLMClient,
    };

    mockContext = {
      conversation_id: 'conv-1',
      user_first_name: 'John',
      job_title: 'CDL-A Driver',
      status: ConversationStatus.DONE,
      requirements: [],
      conversation_requirements: [],
      job_facts: [],
      message_history: [],
      current_requirement: { id: 'req-1' },
    };
  });

  it('should return summary as-is if within limit', async () => {
    const shortSummary = 'This is a short summary.';
    const result = await truncateScreeningSummary(shortSummary, mockContext, deps);

    expect(result.truncatedSummary).toBe(shortSummary);
    expect(result.wasTruncated).toBe(false);
  });

  it('should return summary as-is if exactly at limit', async () => {
    const summary = 'a'.repeat(10000);
    const result = await truncateScreeningSummary(summary, mockContext, deps);

    expect(result.truncatedSummary).toBe(summary);
    expect(result.wasTruncated).toBe(false);
  });

  it('should condense summary if exceeds limit', async () => {
    const longSummary = 'a'.repeat(15000);
    const condensedSummary = 'a'.repeat(5000);

    // Mock createProcessor to return a processor function
    const processorModule = require('../../../../src/processor');
    const originalCreateProcessor = processorModule.createProcessor;
    
    const mockProcessor = jest.fn().mockResolvedValue({
      assistantMessage: condensedSummary,
    });

    processorModule.createProcessor = jest.fn().mockReturnValue(mockProcessor);

    const result = await truncateScreeningSummary(longSummary, mockContext, deps);

    expect(result.wasTruncated).toBe(true);
    expect(result.truncatedSummary.length).toBeLessThanOrEqual(10000);
    expect(mockProcessor).toHaveBeenCalled();
    
    // Restore original
    processorModule.createProcessor = originalCreateProcessor;
  });

  it('should hard truncate with ellipsis if condensed version still too long', async () => {
    const longSummary = 'a'.repeat(15000);
    const stillTooLongSummary = 'a'.repeat(12000); // Still exceeds limit

    const processorModule = require('../../../../src/processor');
    const originalCreateProcessor = processorModule.createProcessor;
    
    const mockProcessor = jest.fn().mockResolvedValue({
      assistantMessage: stillTooLongSummary,
    });

    processorModule.createProcessor = jest.fn().mockReturnValue(mockProcessor);

    const result = await truncateScreeningSummary(longSummary, mockContext, deps);

    expect(result.wasTruncated).toBe(true);
    expect(result.truncatedSummary.length).toBe(10000);
    expect(result.truncatedSummary.endsWith('...')).toBe(true);
    
    // Restore original
    processorModule.createProcessor = originalCreateProcessor;
  });
});
