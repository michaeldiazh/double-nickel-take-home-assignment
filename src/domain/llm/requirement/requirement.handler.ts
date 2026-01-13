import { LLMClient, StreamOptions } from '../client';
import { ConversationRepository } from '../../../entities/conversation/repository';
import { MessageRepository } from '../../../entities/message/repository';
import { ConversationJobRequirementRepository } from '../../../entities/conversation-job-requirement/repository';
import { JobRequirementRepository } from '../../../entities/job-requirement/repository';
import { ConversationContextService } from '../../conversation-context/service';
import { Processor } from '../../../processor';
import { ConversationStatus } from '../../../entities/conversation/domain';
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
 * Dependencies for the requirement handler.
 */
export interface RequirementHandlerDependencies {
    conversationRepo: ConversationRepository;
    messageRepo: MessageRepository;
    conversationJobRequirementRepo: ConversationJobRequirementRepository;
    jobRequirementRepo: JobRequirementRepository;
    contextService: ConversationContextService;
    processor: Processor;
    llmClient: LLMClient;
}

/**
 * Process user's response to a requirement question.
 *
 * This functional handler:
 * 1. Receives and validates user message
 * 2. Processes with LLM and parses response
 * 3. Evaluates requirement against criteria
 * 4. Routes next message and state based on results
 *
 * @param conversationId - The conversation ID
 * @param userMessage - The user's response
 * @param streamOptions - Optional streaming options for real-time chunk delivery
 * @param deps - Handler dependencies
 * @returns Result with assistant message and updated status
 */
export const handleRequirementResponse = async (
    conversationId: string,
    userMessage: string,
    streamOptions: StreamOptions | undefined,
    deps: RequirementHandlerDependencies
): Promise<{
    assistantMessage: string;
    newStatus: ConversationStatus;
    requirementMet: boolean | null; // null if still pending
}> => {
    // Build dependencies for functional modules
    const messageReceiverDeps: MessageReceiverDependencies = {
        messageRepo: deps.messageRepo,
        contextService: deps.contextService,
    };

    const llmProcessorDeps: LLMProcessorDependencies = {
        llmClient: deps.llmClient,
    };

    const evaluatorDeps: EvaluatorDependencies = {
        conversationJobRequirementRepo: deps.conversationJobRequirementRepo,
        jobRequirementRepo: deps.jobRequirementRepo,
        messageRepo: deps.messageRepo,
        conversationRepo: deps.conversationRepo,
    };

    const stateRouterDeps: StateRouterDependencies = {
        conversationRepo: deps.conversationRepo,
        conversationJobRequirementRepo: deps.conversationJobRequirementRepo,
        jobRequirementRepo: deps.jobRequirementRepo,
        contextService: deps.contextService,
        processor: deps.processor,
    };

    // Step 1: Receive user message and load context
    const {context, currentRequirement} = await receiveRequirementMessage(
        conversationId,
        userMessage,
        messageReceiverDeps
    );

    await deps.messageRepo.create({conversation_id: conversationId, sender: 'USER', content: userMessage});
    // Step 2: Process with LLM and parse response
    const {parseResult, cleanedMessage, needsClarification} = await processRequirementWithLLM(
        userMessage,
        context,
        currentRequirement,
        llmProcessorDeps
    );

    console.log(`[RequirementHandler] LLM cleaned message: ${cleanedMessage}`);
    // Step 3: Save the initial assistant message (needed for evaluator)
    const initialAssistantMessageId = await deps.messageRepo.create({
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
    console.log(`[RequirementHandler] Routing state - evaluationResult: ${evaluationResult.evaluationResult}, needsClarification: ${needsClarification || evaluationResult.needsClarification}`);
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
    console.log(`[RequirementHandler] Router returned - newStatus: ${routerResult.newStatus}, needsClarification: ${routerResult.needsClarification}, requirementMet: ${routerResult.requirementMet}`);
    if (routerResult.needsClarification) {
        return {
            assistantMessage: routerResult.assistantMessage,
            newStatus: routerResult.newStatus,
            requirementMet: null,
        }
    }
    
    // If conversation is DONE, we should not continue processing
    if (routerResult.newStatus === ConversationStatus.DONE) {
        console.log(`[RequirementHandler] Conversation is DONE - returning early`);
        return {
            assistantMessage: routerResult.assistantMessage,
            newStatus: routerResult.newStatus,
            requirementMet: routerResult.requirementMet,
        };
    }

    // Step 6: Save the final assistant message if it exists and is different from the initial one
    // (e.g., if routing generated a next question or job questions welcome message)
    if (routerResult.assistantMessage &&
        routerResult.assistantMessage.trim().length > 0 &&
        routerResult.assistantMessage !== cleanedMessage) {
        const finalAssistantMessageId = await deps.messageRepo.create({
            conversation_id: conversationId,
            sender: 'ASSISTANT',
            content: routerResult.assistantMessage,
        });

        // Update the requirement with the final message ID if we have an evaluation result
        if (evaluationResult.evaluationResult) {
            await deps.conversationJobRequirementRepo.update(
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
};
