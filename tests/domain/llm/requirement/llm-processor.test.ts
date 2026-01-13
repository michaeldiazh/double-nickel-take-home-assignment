/**
 * Tests for llm-processor module
 */

import { processRequirementWithLLM } from '../../../../src/domain/llm/requirement/llm-processor';
import { ConversationStatus } from '../../../../src/entities/conversation/domain';
import { JobRequirementType } from '../../../../src/domain/criteria';

describe('processRequirementWithLLM', () => {
  let mockLLMClient: any;
  let deps: any;
  let mockContext: any;
  let mockRequirement: any;

  beforeEach(() => {
    mockLLMClient = {
      sendMessage: jest.fn(),
    };

    deps = {
      llmClient: mockLLMClient,
    };

    mockContext = {
      status: ConversationStatus.ON_REQ,
      user: { id: 'user-1', name: 'John' },
      job: { id: 'job-1', title: 'Truck Driver' },
    };

    mockRequirement = {
      id: 'req-1',
      requirement_type: JobRequirementType.CDL_CLASS,
      requirement_description: 'Class A CDL license',
      criteria: {
        required: true,
        class: 'A',
      },
    };
  });

  it('should send message to LLM and parse response', async () => {
    const userMessage = 'Yes, I have a Class A CDL';
    const rawLLMResponse = 'Great! Here is the assessment: {"assessment": "MET", "confidence": 0.95, "message": "Thank you for confirming your Class A CDL license."}';

    mockLLMClient.sendMessage.mockResolvedValue({
      content: rawLLMResponse,
    });

    const result = await processRequirementWithLLM(userMessage, mockContext, mockRequirement, deps);

    expect(mockLLMClient.sendMessage).toHaveBeenCalled();
    expect(result.rawAssistantMessage).toBe(rawLLMResponse);
    expect(result.parseResult).toBeDefined();
    expect(result.cleanedMessage).toBeDefined();
    expect(result.cleanedMessage).not.toContain('{');
    expect(result.cleanedMessage).not.toContain('}');
  });

  it('should handle empty message and use fallback', async () => {
    const userMessage = 'Yes';
    const rawLLMResponse = '{"assessment": "MET"}'; // No message field

    mockLLMClient.sendMessage.mockResolvedValue({
      content: rawLLMResponse,
    });

    // Mock parseLLMResponse to return empty message
    jest.mock('../../../../src/domain/criteria/parser', () => ({
      parseLLMResponse: jest.fn(() => ({
        success: true,
        value: { class: 'A' },
        assessment: 'MET',
        message: '', // Empty message
        needsClarification: false,
      })),
    }));

    const result = await processRequirementWithLLM(userMessage, mockContext, mockRequirement, deps);

    // Should use fallback message
    expect(result.cleanedMessage).toBe("Thank you for that information.");
  });

  it('should clean JSON from message', async () => {
    const userMessage = 'Yes';
    const rawLLMResponse = 'Here is the assessment: ```json\n{"assessment": "MET", "message": "Great!"}\n```';

    mockLLMClient.sendMessage.mockResolvedValue({
      content: rawLLMResponse,
    });

    const result = await processRequirementWithLLM(userMessage, mockContext, mockRequirement, deps);

    // Message should be cleaned (no JSON)
    expect(result.cleanedMessage).not.toContain('```json');
    expect(result.cleanedMessage).not.toContain('{');
    expect(result.cleanedMessage).not.toContain('}');
  });
});
