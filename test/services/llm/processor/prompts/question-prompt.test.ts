import {
    buildInitialPrompt,
    buildConversationPrompt,
    buildFollowUpPrompt,
    getRequirementDescription,
} from '../../../../../src/services/llm/processor/prompts';
import {ChatMessage, MessageRole} from '../../../../../src/services/llm/client';
import {ConversationContext} from '../../../../../src/services/llm/processor/prompts';
import {CDLClass} from '../../../../../src/services/criteria/criteria-types';
import {
    SimplifiedJobRequirementType,
    RequirementStatus,
    JobRequirements,
    ConversationRequirements,
    PaymentType,
    ApplicationStatus,
    ScreeningDecision,
} from "../../../../../src/entities";

describe('Question Prompt Builders', () => {
    describe('getRequirementDescription', () => {
        it('should return requirementDescription when provided', () => {
            const requirementType: SimplifiedJobRequirementType = {
                id: 1,
                requirementType: 'CDL_CLASS',
                requirementDescription: 'Commercial Driver License Class',
            };

            const result = getRequirementDescription(requirementType);
            expect(result).toBe('Commercial Driver License Class');
        });

        it('should fallback to formatted requirementType when description is missing', () => {
            const requirementType: SimplifiedJobRequirementType = {
                id: 2,
                requirementType: 'CDL_CLASS',
                requirementDescription: '',
            };

            const result = getRequirementDescription(requirementType);
            expect(result).toBe('cdl class');
        });

        it('should format requirementType with underscores replaced by spaces', () => {
            const requirementType: SimplifiedJobRequirementType = {
                id: 3,
                requirementType: 'YEARS_EXPERIENCE',
                requirementDescription: '',
            };

            const result = getRequirementDescription(requirementType);
            expect(result).toBe('years experience');
        });
    });

    describe('buildInitialPrompt', () => {
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
            criteria: {cdl_class: CDLClass.A, required: true} as unknown as Record<string, unknown>,
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

        it('should build initial prompt with system message', () => {
            const jobTitle = 'Long Haul Truck Driver';
            const currentRequirement = createMockJobRequirement();
            const context: ConversationContext = {
                status: 'START',
                userFirstName: 'John',
                jobTitle,
                jobFacts: [],
                messageHistory: [],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement)],
                currentRequirement,
            };

            const result = buildInitialPrompt(context);

            expect(result).toHaveLength(1);
            expect(result[0].role).toBe(MessageRole.SYSTEM);
            expect(result[0].content).toContain('Happy Hauler Trucking Co');
            expect(result[0].content).toContain(jobTitle);
            expect(result[0].content).toContain('John');
        });

        it('should include company name in system prompt', () => {
            const currentRequirement = createMockJobRequirement();
            const context: ConversationContext = {
                status: 'START',
                userFirstName: 'Jane',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory: [],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement)],
                currentRequirement,
            };

            const result = buildInitialPrompt(context);
            expect(result[0].content).toContain('Happy Hauler Trucking Co');
            expect(result[0].content).toContain('Jane');
        });
    });

    describe('buildConversationPrompt', () => {
        const createMockJobRequirement = (
            requirementType: string = 'CDL_CLASS',
            priority: number = 1,
            criteria: unknown = {cdl_class: CDLClass.A, required: true}
        ): JobRequirements => ({
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
                requirementType,
                requirementDescription: 'CDL Class',
            },
            criteria: criteria as unknown as Record<string, unknown>,
            priority,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const createMockConversationRequirement = (
            requirement: JobRequirements,
            status: RequirementStatus = RequirementStatus.PENDING
        ): ConversationRequirements => ({
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
            status,
            value: null,
            createdAt: new Date(),
            lastUpdated: new Date(),
        });

        it('should build conversation prompt with system message and context for ON_REQ status', () => {
            const jobTitle = 'Long Haul Truck Driver';
            const currentRequirement = createMockJobRequirement('CDL_CLASS', 1);
            const messageHistory: ChatMessage[] = [
                {role: MessageRole.USER, content: 'Hello'},
                {role: MessageRole.ASSISTANT, content: 'Hi there!'},
            ];

            const context: ConversationContext = {
                status: 'ON_REQ',
                userFirstName: 'John',
                jobTitle,
                jobFacts: [],
                messageHistory,
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement, RequirementStatus.PENDING)],
                currentRequirement,
            };

            const result = buildConversationPrompt(context);

            expect(result.length).toBeGreaterThan(1);
            const systemMessages = result.filter(msg => msg.role === MessageRole.SYSTEM);
            expect(systemMessages.length).toBeGreaterThan(0);
            expect(result[0].role).toBe(MessageRole.USER); // messageHistory comes first
        });

        it('should include conversation context as system message', () => {
            const currentRequirement = createMockJobRequirement('CDL_CLASS', 1);
            const context: ConversationContext = {
                status: 'ON_REQ',
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory: [],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement, RequirementStatus.PENDING)],
                currentRequirement,
            };

            const result = buildConversationPrompt(context);

            // Should have system messages for context and requirement
            const systemMessages = result.filter(msg => msg.role === MessageRole.SYSTEM);
            expect(systemMessages.length).toBeGreaterThanOrEqual(1);
        });

        it('should include message history in result', () => {
            const currentRequirement = createMockJobRequirement('CDL_CLASS', 1);
            const messageHistory: ChatMessage[] = [
                {role: MessageRole.USER, content: 'I have a CDL'},
                {role: MessageRole.ASSISTANT, content: 'Great!'},
            ];

            const context: ConversationContext = {
                status: 'ON_REQ',
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory,
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement, RequirementStatus.PENDING)],
                currentRequirement,
            };

            const result = buildConversationPrompt(context);

            // Message history should be included
            const userMessages = result.filter(msg => msg.role === MessageRole.USER);
            const assistantMessages = result.filter(msg => msg.role === MessageRole.ASSISTANT);
            expect(userMessages.length).toBeGreaterThan(0);
            expect(assistantMessages.length).toBeGreaterThan(0);
        });

        it('should handle empty message history', () => {
            const currentRequirement = createMockJobRequirement('CDL_CLASS', 1);
            const context: ConversationContext = {
                status: 'ON_REQ',
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory: [],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement, RequirementStatus.PENDING)],
                currentRequirement,
            };

            const result = buildConversationPrompt(context);

            expect(result.length).toBeGreaterThan(0);
            const systemMessages = result.filter(msg => msg.role === MessageRole.SYSTEM);
            expect(systemMessages.length).toBeGreaterThan(0);
        });

        it('should handle START status', () => {
            const currentRequirement = createMockJobRequirement('CDL_CLASS', 1);
            const context: ConversationContext = {
                status: 'START',
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory: [],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement, RequirementStatus.PENDING)],
                currentRequirement,
            };

            const result = buildConversationPrompt(context);
            expect(result.length).toBe(1);
            expect(result[0].role).toBe(MessageRole.SYSTEM);
        });
    });

    describe('buildFollowUpPrompt', () => {
        const createMockJobRequirement = (): JobRequirements => ({
            id: '123e4567-e89b-12d3-a456-426614174000',
            job: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Driver',
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
            criteria: {cdl_class: CDLClass.A, required: true} as unknown as Record<string, unknown>,
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

        it('should build follow-up prompt with clarification instruction', () => {
            const currentRequirement = createMockJobRequirement();
            const clarificationNeeded = 'exact number of years of experience';
            const context: ConversationContext = {
                status: 'NEED_FOLLOW_UP',
                clarificationNeeded,
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory: [
                    {role: MessageRole.USER, content: 'A while'},
                ],
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement)],
                currentRequirement,
            };

            const result = buildFollowUpPrompt(context, clarificationNeeded);

            // Should include message history plus follow-up instruction
            expect(result.length).toBeGreaterThan(1);

            // Last message should be system message with clarification instruction
            const lastMessage = result[result.length - 1];
            expect(lastMessage.role).toBe(MessageRole.SYSTEM);
            expect(lastMessage.content).toContain(clarificationNeeded);
        });

        it('should include all base conversation messages', () => {
            const currentRequirement = createMockJobRequirement();
            const messageHistory: ChatMessage[] = [
                {role: MessageRole.USER, content: 'Hello'},
                {role: MessageRole.ASSISTANT, content: 'Hi!'},
            ];

            const clarificationNeeded = 'years';
            const context: ConversationContext = {
                status: 'NEED_FOLLOW_UP',
                clarificationNeeded,
                userFirstName: 'John',
                jobTitle: 'Driver',
                jobFacts: [],
                messageHistory,
                requirements: [currentRequirement],
                conversationRequirements: [createMockConversationRequirement(currentRequirement)],
                currentRequirement,
            };

            const result = buildFollowUpPrompt(context, clarificationNeeded);

            // Should include original messages
            const userMessages = result.filter(msg => msg.role === MessageRole.USER);
            expect(userMessages.length).toBeGreaterThan(0);
        });
    });
});
