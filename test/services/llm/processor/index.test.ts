import { createProcessor, ProcessorRequest } from '../../../../src/services/llm/processor';
import { LLMClient, ChatMessage, MessageRole, LLMResponse } from '../../../../src/services/llm/client';
import { ConversationContext } from '../../../../src/services/llm/processor/prompts';
import { RequirementStatus, JobRequirements, ConversationRequirements, PaymentType, ApplicationStatus, ScreeningDecision } from '../../../../src/entities';
import { CDLClass } from '../../../../src/services/criteria/criteria-types';

describe('LLM Processor', () => {
    let mockLLMClient: jest.Mocked<LLMClient>;
    let processor: ReturnType<typeof createProcessor>;

    const createMockJobRequirement = (): JobRequirements => ({
        id: '123e4567-e89b-12d3-a456-426614174000',
        job: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Long Haul Truck Driver',
            description: 'Test job',
            paymentType: PaymentType.HOUR,
            hourlyPay: 100,
            milesPay: null,
            salaryPay: null,
            addressId: '123e4567-e89b-12d3-a456-426614174002',
            isActive: true,
        },
        jobRequirementType: {
            id: 1,
            requirementType: 'CDL_CLASS',
            requirementDescription: 'CDL Class',
        },
        criteria: { cdl_class: CDLClass.A, required: true } as unknown as Record<string, unknown>,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const createMockConversationRequirement = (requirement: JobRequirements): ConversationRequirements => ({
        id: '123e4567-e89b-12d3-a456-426614174010',
        conversation: {
            id: '123e4567-e89b-12d3-a456-426614174020',
            application: {
                id: '123e4567-e89b-12d3-a456-426614174040',
                userId: '123e4567-e89b-12d3-a456-426614174030',
                jobId: requirement.job.id,
                appliedOn: new Date(),
                status: ApplicationStatus.IN_PROGRESS,
            },
            isActive: true,
            screeningDecision: ScreeningDecision.PENDING,
            screeningSummary: null,
            screeningReasons: null,
            endedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        jobRequirements: requirement,
        messageId: null,
        status: RequirementStatus.PENDING,
        value: null,
        createdAt: new Date(),
        lastUpdated: new Date(),
    });

    const createMockContext = (): ConversationContext => {
        const requirement = createMockJobRequirement();
        return {
            status: 'ON_REQ',
            userFirstName: 'John',
            jobTitle: 'Long Haul Truck Driver',
            jobFacts: [],
            messageHistory: [],
            requirements: [requirement],
            conversationRequirements: [createMockConversationRequirement(requirement)],
            currentRequirement: requirement,
        };
    };

    beforeEach(() => {
        mockLLMClient = {
            model: 'gpt-4',
            sendMessage: jest.fn(),
            streamMessage: jest.fn(),
        };
        processor = createProcessor({ llmClient: mockLLMClient });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createProcessor', () => {
        it('should create a processor function', () => {
            expect(typeof processor).toBe('function');
        });

        it('should use the provided LLM client model', async () => {
            const context = createMockContext();
            const mockResponse: LLMResponse = {
                content: 'Hello, how can I help?',
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'Hello',
                context,
            };

            const result = await processor(request);

            expect(result.llmResponse.model).toBe('gpt-4');
        });
    });

    describe('processor - non-streaming', () => {
        it('should process a request and return complete response', async () => {
            const context = createMockContext();
            const mockResponse: LLMResponse = {
                content: 'Hello, how can I help you?',
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'Hello',
                context,
            };

            const result = await processor(request);

            expect(result.assistantMessage).toBe('Hello, how can I help you?');
            expect(result.llmResponse).toEqual(mockResponse);
            expect(result.messages).toBeDefined();
            expect(result.messages.length).toBeGreaterThan(0);

            // Verify messages include user message and assistant response
            const userMessages = result.messages.filter(msg => msg.role === MessageRole.USER);
            const assistantMessages = result.messages.filter(msg => msg.role === MessageRole.ASSISTANT);
            expect(userMessages.length).toBeGreaterThan(0);
            expect(assistantMessages.length).toBeGreaterThan(0);
            expect(userMessages[userMessages.length - 1].content).toBe('Hello');
            expect(assistantMessages[assistantMessages.length - 1].content).toBe('Hello, how can I help you?');
        });

        it('should build messages with conversation context', async () => {
            const context = createMockContext();
            context.messageHistory = [
                { role: MessageRole.USER, content: 'Previous message' },
                { role: MessageRole.ASSISTANT, content: 'Previous response' },
            ];

            const mockResponse: LLMResponse = {
                content: 'Response',
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'New message',
                context,
            };

            await processor(request);

            expect(mockLLMClient.sendMessage).toHaveBeenCalledTimes(1);
            const messagesSent = mockLLMClient.sendMessage.mock.calls[0][0];
            
            // Should include previous message history
            const userMessages = messagesSent.filter(msg => msg.role === MessageRole.USER);
            expect(userMessages.length).toBeGreaterThanOrEqual(1);
            
            // Should include the new user message
            const userMessagesInSent = messagesSent.filter(msg => msg.role === MessageRole.USER);
            const lastUserMessage = userMessagesInSent[userMessagesInSent.length - 1];
            expect(lastUserMessage?.content).toBe('New message');
        });

        it('should handle isInitialMessage flag', async () => {
            const context = createMockContext();
            const mockResponse: LLMResponse = {
                content: 'Greeting',
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'Hello',
                context,
                isInitialMessage: true,
            };

            const result = await processor(request);
            expect(result).toBeDefined();
            // isInitialMessage doesn't change behavior in current implementation,
            // but we test it doesn't break
        });
    });

    describe('processor - streaming', () => {
        it('should handle streaming requests', async () => {
            const context = createMockContext();
            const chunks = ['Hello', ', ', 'how ', 'can ', 'I ', 'help?'];
            let chunkIndex = 0;

            mockLLMClient.streamMessage.mockImplementation(async (messages, options) => {
                for (const chunk of chunks) {
                    options.onChunk(chunk);
                }
                if (options.onComplete) {
                    options.onComplete();
                }
            });

            const onChunk = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const request: ProcessorRequest = {
                userMessage: 'Hello',
                context,
                streamOptions: {
                    onChunk,
                    onComplete,
                    onError,
                },
            };

            const result = await processor(request);

            expect(onChunk).toHaveBeenCalledTimes(chunks.length);
            chunks.forEach((chunk, index) => {
                expect(onChunk).toHaveBeenNthCalledWith(index + 1, chunk);
            });
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();

            // Verify accumulated message
            expect(result.assistantMessage).toBe('Hello, how can I help?');
            expect(result.llmResponse.metadata?.streaming).toBe(true);
            expect(result.messages).toBeDefined();

            // Verify assistant message in complete messages
            const assistantMessages = result.messages.filter(msg => msg.role === MessageRole.ASSISTANT);
            expect(assistantMessages.length).toBeGreaterThan(0);
            expect(assistantMessages[assistantMessages.length - 1].content).toBe('Hello, how can I help?');
        });

        it('should handle streaming errors', async () => {
            const context = createMockContext();
            const error = new Error('Stream error');

            mockLLMClient.streamMessage.mockImplementation(async (messages, options) => {
                if (options.onError) {
                    options.onError(error);
                }
                // Make the promise reject when an error occurs
                throw error;
            });

            const onChunk = jest.fn();
            const onComplete = jest.fn();
            const onError = jest.fn();

            const request: ProcessorRequest = {
                userMessage: 'Hello',
                context,
                streamOptions: {
                    onChunk,
                    onComplete,
                    onError,
                },
            };

            await expect(processor(request)).rejects.toThrow('Stream error');
            expect(onError).toHaveBeenCalledWith(error);
        });

        it('should accumulate chunks correctly during streaming', async () => {
            const context = createMockContext();
            const chunks = ['Part ', '1', ' and ', 'Part ', '2'];
            const expectedMessage = 'Part 1 and Part 2';

            mockLLMClient.streamMessage.mockImplementation(async (messages, options) => {
                for (const chunk of chunks) {
                    options.onChunk(chunk);
                }
                if (options.onComplete) {
                    options.onComplete();
                }
            });

            const onChunk = jest.fn();

            const request: ProcessorRequest = {
                userMessage: 'Test',
                context,
                streamOptions: {
                    onChunk,
                },
            };

            const result = await processor(request);

            expect(result.assistantMessage).toBe(expectedMessage);
            const assistantMessagesInResult = result.messages.filter(msg => msg.role === MessageRole.ASSISTANT);
            expect(assistantMessagesInResult[assistantMessagesInResult.length - 1].content).toBe(expectedMessage);
        });
    });

    describe('buildMessagesForLLM', () => {
        it('should include conversation context in messages', async () => {
            const context = createMockContext();
            const mockResponse: LLMResponse = {
                content: 'Response',
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'Test message',
                context,
            };

            await processor(request);

            const messagesSent = mockLLMClient.sendMessage.mock.calls[0][0];
            
            // Should have system messages from context
            const systemMessages = messagesSent.filter(msg => msg.role === MessageRole.SYSTEM);
            expect(systemMessages.length).toBeGreaterThan(0);
            
            // Should have user message
            const userMessages = messagesSent.filter(msg => msg.role === MessageRole.USER);
            expect(userMessages.length).toBeGreaterThan(0);
            expect(userMessages[userMessages.length - 1].content).toBe('Test message');
        });
    });

    describe('buildCompleteMessages', () => {
        it('should include both user and assistant messages in complete response', async () => {
            const context = createMockContext();
            const assistantResponse = 'This is the assistant response';
            const mockResponse: LLMResponse = {
                content: assistantResponse,
                model: 'gpt-4',
            };

            mockLLMClient.sendMessage.mockResolvedValue(mockResponse);

            const request: ProcessorRequest = {
                userMessage: 'User question',
                context,
            };

            const result = await processor(request);

            // Verify complete messages include both user and assistant
            const userMessages = result.messages.filter(msg => msg.role === MessageRole.USER);
            const assistantMessages = result.messages.filter(msg => msg.role === MessageRole.ASSISTANT);
            
            expect(userMessages.length).toBeGreaterThan(0);
            expect(assistantMessages.length).toBeGreaterThan(0);
            expect(userMessages[userMessages.length - 1].content).toBe('User question');
            expect(assistantMessages[assistantMessages.length - 1].content).toBe(assistantResponse);
        });
    });
});
