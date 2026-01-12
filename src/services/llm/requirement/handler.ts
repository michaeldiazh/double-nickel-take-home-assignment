import {Pool} from 'pg';
import {LLMClient, StreamOptions} from '../client';
import {ConversationRepository} from '../../../entities/conversation/repository';
import {MessageRepository} from '../../../entities/message/repository';
import {ConversationJobRequirementRepository} from '../../../entities/conversation-job-requirement/repository';
import {JobRequirementRepository} from '../../../entities/job-requirement/repository';
import {createProcessor, Processor} from '../processor';
import {ConversationContextService} from '../../conversation-context/service';
import {ConversationStatus} from '../../../entities/conversation/domain';
import {
    receiveRequirementMessage,
    processRequirementWithLLM,
    evaluateRequirementCriteria,
    routeRequirementState,
    MessageReceiverDependencies,
    LLMProcessorDependencies,
    EvaluatorDependencies,
    StateRouterDependencies,
} from './index';

/**
 * Requirement handler - processes user responses during ON_REQ status.
 *
 * This handler uses functional modules to:
 * 1. Receive and validate user message
 * 2. Process with LLM and parse response
 * 3. Evaluate requirement against criteria
 * 4. Route next message and state based on results
 */
export class RequirementHandler {
    private conversationRepo: ConversationRepository;
    private messageRepo: MessageRepository;
    private conversationJobRequirementRepo: ConversationJobRequirementRepository;
    private jobRequirementRepo: JobRequirementRepository;
    private contextService: ConversationContextService;
    private processor: Processor;

    constructor(client: Pool, private llmClient: LLMClient) {
        this.conversationRepo = new ConversationRepository(client);
        this.messageRepo = new MessageRepository(client);
        this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(client);
        this.jobRequirementRepo = new JobRequirementRepository(client);
        this.contextService = new ConversationContextService(client);
        this.processor = createProcessor({llmClient});
    }

    /**
     * Process user's response to a requirement question.
     *
     * @param conversationId - The conversation ID
     * @param userMessage - The user's response
     * @param streamOptions - Optional streaming options for real-time chunk delivery
     * @returns Result with assistant message and updated status
     */
    async handleRequirementResponse(
        conversationId: string,
        userMessage: string,
        streamOptions?: StreamOptions
    ): Promise<{
        assistantMessage: string;
        newStatus: ConversationStatus;
        requirementMet: boolean | null; // null if still pending
    }> {
        // Build dependencies for functional modules
        const messageReceiverDeps: MessageReceiverDependencies = {
            messageRepo: this.messageRepo,
            contextService: this.contextService,
        };

        const llmProcessorDeps: LLMProcessorDependencies = {
            llmClient: this.llmClient,
        };

        const evaluatorDeps: EvaluatorDependencies = {
            conversationJobRequirementRepo: this.conversationJobRequirementRepo,
            jobRequirementRepo: this.jobRequirementRepo,
            messageRepo: this.messageRepo,
        };

        const stateRouterDeps: StateRouterDependencies = {
            conversationRepo: this.conversationRepo,
            conversationJobRequirementRepo: this.conversationJobRequirementRepo,
            jobRequirementRepo: this.jobRequirementRepo,
            contextService: this.contextService,
            processor: this.processor,
        };

        // Step 1: Receive user message and load context
        const {context, currentRequirement} = await receiveRequirementMessage(
            conversationId,
            userMessage,
            messageReceiverDeps
        );

        await this.messageRepo.create({conversation_id: conversationId, sender: 'USER', content: userMessage});
        // Step 2: Process with LLM and parse response
        const {parseResult, cleanedMessage, needsClarification} = await processRequirementWithLLM(
            userMessage,
            context,
            currentRequirement,
            llmProcessorDeps
        );

        console.log(`[RequirementHandler] LLM cleaned message: ${cleanedMessage}`);
        // Step 3: Save the initial assistant message (needed for evaluator)
        const initialAssistantMessageId = await this.messageRepo.create({
            conversation_id: conversationId,
            sender: 'ASSISTANT',
            content: cleanedMessage,
        });

        // Step 4: Evaluate requirement against criteria
        const evaluationResult = await evaluateRequirementCriteria(
            conversationId,
            currentRequirement,
            parseResult,
            initialAssistantMessageId,
            evaluatorDeps
        );

        // Step 5: Route next message and state based on evaluation results
        // Use needsClarification from processor (determined by parser) or from evaluator (if evaluation failed)
        // The evaluator may also set needsClarification if evaluationResult is null
        const routerResult = await routeRequirementState(
            conversationId,
            currentRequirement.id,
            evaluationResult.evaluationResult,
            cleanedMessage,
            userMessage,
            needsClarification || evaluationResult.needsClarification,
            streamOptions,
            stateRouterDeps
        );
        if (routerResult.needsClarification) {
            return {
                assistantMessage: routerResult.assistantMessage,
                newStatus: routerResult.newStatus,
                requirementMet: null,
            }
        }

        // Step 6: Save the final assistant message if it exists and is different from the initial one
        // (e.g., if routing generated a next question or job questions welcome message)
        if (routerResult.assistantMessage &&
            routerResult.assistantMessage.trim().length > 0 &&
            routerResult.assistantMessage !== cleanedMessage) {
            const finalAssistantMessageId = await this.messageRepo.create({
                conversation_id: conversationId,
                sender: 'ASSISTANT',
                content: routerResult.assistantMessage,
            });

            // Update the requirement with the final message ID if we have an evaluation result
            if (evaluationResult.evaluationResult) {
                await this.conversationJobRequirementRepo.update(
                    conversationId,
                    currentRequirement.id,
                    {message_id: finalAssistantMessageId}
                );
            }
        }

        return {
            assistantMessage: routerResult.assistantMessage,
            newStatus: routerResult.newStatus,
            requirementMet: routerResult.requirementMet,
        };
    }
}
