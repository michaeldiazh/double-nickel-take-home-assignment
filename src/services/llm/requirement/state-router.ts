/**
 * Requirement State Router Module
 *
 * Responsibility: Route next message and state based on evaluation results
 * - Determines status transitions
 * - Generates next question (if more requirements)
 * - Generates job questions message (if all met)
 * - Handles streaming
 */

import {StreamOptions} from '../client';
import {ConversationRepository} from '../../../entities/conversation/repository';
import {ConversationJobRequirementRepository} from '../../../entities/conversation-job-requirement/repository';
import {JobRequirementRepository} from '../../../entities/job-requirement/repository';
import {ConversationContextService} from '../../conversation-context/service';
import {MessageRepository} from '../../../entities/message/repository';
import {Processor} from '../processor';
import {ConversationContext} from '../processor/prompts/prompt-context';
import {JobRequirement} from '../../../entities/job-requirement/domain';
import {ConversationStatus, ScreeningDecision} from '../../../entities/conversation/domain';
import {RequirementStatus} from '../../../entities/conversation-job-requirement/domain';
import {getRequirementStatusSummary, areAllRequiredMet, getTop3RequirementIds} from '../../criteria/requirement-status';
import {parseLLMResponse} from '../../criteria/parser';
import {extractJSONObject, removeJSONFromText} from '../../criteria/parser/utils';
import {buildFollowUpRequirementPrompt} from "../processor/prompts/question-prompt";

export interface StateRouterDependencies {
    conversationRepo: ConversationRepository;
    conversationJobRequirementRepo: ConversationJobRequirementRepository;
    jobRequirementRepo: JobRequirementRepository;
    contextService: ConversationContextService;
    processor: Processor;
}

export interface StateRouterResult {
    assistantMessage: string;
    newStatus: ConversationStatus;
    requirementMet: boolean | null;
    needsClarification?: boolean;
}

/**
 * Helper function to stream a message if streamOptions are provided.
 *
 * @param message - The message to stream
 * @param streamOptions - Optional streaming options
 */
const streamMessage = (message: string, streamOptions: StreamOptions | undefined): void => {
    if (streamOptions && message) {
        for (const char of message) {
            streamOptions.onChunk(char);
        }
        streamOptions.onComplete?.();
    }
};

/**
 * Handles status transitions based on requirement evaluation.
 */
const handleStatusTransition = async (
    conversationId: string,
    currentJobRequirementId: string,
    evaluationResult: RequirementStatus | null,
    deps: StateRouterDependencies
): Promise<ConversationStatus> => {
    // If still pending, stay in ON_REQ
    if (!evaluationResult || evaluationResult === RequirementStatus.PENDING) {
        return ConversationStatus.ON_REQ;
    }

    // If not met and required, set to DENIED
    if (evaluationResult === RequirementStatus.NOT_MET) {
        const conversationRequirement = await deps.conversationJobRequirementRepo.getConversationRequirements(conversationId);
        const currentReq = conversationRequirement.find(cr => cr.job_requirement_id === currentJobRequirementId);

        if (currentReq) {
            const jobReq = await deps.jobRequirementRepo.getById(currentJobRequirementId);
            if (jobReq) {
                if (jobReq.criteria.required) {
                    // Required requirement not met - deny
                    await deps.conversationRepo.update(conversationId, {
                        conversation_status: ConversationStatus.DONE,
                        screening_decision: ScreeningDecision.DENIED,
                        is_active: false,
                    });
                    return ConversationStatus.DONE;
                }
            }
        }
    }

    // Reload requirements to get the latest status (after the update above)
    const allRequirements = await deps.conversationJobRequirementRepo.getConversationRequirements(conversationId);

    // Check if all required requirements are MET
    // (Non-required requirements being NOT_MET shouldn't block progression)
    if (areAllRequiredMet(allRequirements)) {
        await deps.conversationRepo.update(conversationId, {
            conversation_status: ConversationStatus.ON_JOB_QUESTIONS,
        });
        return ConversationStatus.ON_JOB_QUESTIONS;
    }

    // Still have more requirements - stay in ON_REQ
    return ConversationStatus.ON_REQ;
}

/**
 * Generates the next requirement question after a requirement is met.
 * Note: Does not handle streaming - that should be done by the caller.
 */
const generateNextRequirementQuestion = async (
    conversationId: string,
    context: ConversationContext,
    nextRequirement: JobRequirement,
    deps: StateRouterDependencies
): Promise<string> => {
    // Build context with the next requirement
    const nextContext: ConversationContext = {
        ...context,
        current_requirement: nextRequirement,
    };

    // Get full response first (non-streaming - we need to clean it)
    const processorResponse = await deps.processor({context: nextContext, isInitialMessage: false});

    const rawAssistantMessage = processorResponse.assistantMessage;

    // Parse JSON if present and extract message
    const parseResult = parseLLMResponse(nextRequirement.requirement_type, rawAssistantMessage);
    const cleanMessage = parseResult.message || rawAssistantMessage;

    return cleanMessage;
};

/**
 * Generates a welcome message for the job facts/questions phase.
 * This is sent when transitioning from requirements to job questions.
 * Note: Does not handle streaming - that should be done by the caller.
 */
const generateJobFactsWelcomeMessage = async (
    conversationId: string,
    context: ConversationContext,
    deps: StateRouterDependencies
): Promise<string> => {
    // Get full response first (non-streaming - we need to clean it)
    const processorResponse = await deps.processor({context, isInitialMessage: false});

    const rawAssistantMessage = processorResponse.assistantMessage;

    // Parse JSON if present and extract message (for job questions, it should have continueWithQuestion and assistantMessage)
    const jsonObject = extractJSONObject(rawAssistantMessage);
    let cleanMessage = rawAssistantMessage;
    if (jsonObject && typeof jsonObject.assistantMessage === 'string') {
        cleanMessage = jsonObject.assistantMessage;
    }

    // Clean any remaining JSON that might be in the message
    cleanMessage = removeJSONFromText(cleanMessage);

    return cleanMessage;
};

/**
 * Transitions to job questions when all top 3 requirements are complete.
 *
 * @param conversationId - The conversation ID
 * @param streamOptions - Optional streaming options
 * @param deps - Dependencies (repositories, services, processor)
 * @returns StateRouterResult with job questions message
 */
const transitionToJobQuestions = async (
    conversationId: string,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult> => {
    await deps.conversationRepo.update(conversationId, {
        conversation_status: ConversationStatus.ON_JOB_QUESTIONS,
    });
    const updatedContext = await deps.contextService.loadFullContext(conversationId);
    const jobQuestionsMessage = await generateJobFactsWelcomeMessage(
        conversationId,
        updatedContext,
        deps
    );
    streamMessage(jobQuestionsMessage, streamOptions);
    return {
        assistantMessage: jobQuestionsMessage,
        newStatus: ConversationStatus.ON_JOB_QUESTIONS,
        requirementMet: true,
    };
};

/**
 * Generates and sends the next requirement question.
 *
 * @param conversationId - The conversation ID
 * @param nextRequirement - The next requirement to ask about
 * @param newStatus - The current conversation status
 * @param streamOptions - Optional streaming options
 * @param deps - Dependencies (repositories, services, processor)
 * @returns StateRouterResult with the next question message
 */
const sendNextRequirementQuestion = async (
    conversationId: string,
    nextRequirement: JobRequirement,
    newStatus: ConversationStatus,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult> => {
    const updatedContext = await deps.contextService.loadFullContext(conversationId);
    const nextQuestionMessage = await generateNextRequirementQuestion(
        conversationId,
        updatedContext,
        nextRequirement,
        deps
    );
    streamMessage(nextQuestionMessage, streamOptions);
    return {
        assistantMessage: nextQuestionMessage,
        newStatus,
        requirementMet: true,
    };
};

/**
 * Handles generating the next requirement question.
 */
const handleNextRequirement = async (
    conversationId: string,
    newStatus: ConversationStatus,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult> => {
    const allRequirements = await deps.conversationJobRequirementRepo.getConversationRequirements(conversationId);
    const statusSummary = getRequirementStatusSummary(allRequirements);

    // If all 3 are MET, we should have transitioned to ON_JOB_QUESTIONS already
    // But if we're still here, double-check and transition
    if (statusSummary.allMet) {
        return await transitionToJobQuestions(conversationId, streamOptions, deps);
    }

    // Get next pending requirement (should only be from top 3)
    const nextRequirement = await deps.conversationJobRequirementRepo.getNextPending(conversationId);

    if (nextRequirement) {
        // Verify this is one of the top 3 requirements
        // The service should only process the top 3 requirements
        const top3Ids = getTop3RequirementIds(allRequirements);
        const isTop3 = top3Ids.includes(nextRequirement.job_requirement_id);

        if (!isTop3) {
            // Data integrity issue: getNextPending returned a requirement outside the top 3
            // This should never happen if the system is working correctly
            throw new Error(
                `Data integrity error: getNextPending returned requirement ${nextRequirement.job_requirement_id} ` +
                `which is not in the top 3 requirements (${top3Ids.join(', ')}) for conversation ${conversationId}`
            );
        }

        // Generate the next question explicitly with updated context
        const nextRequirementObj = await deps.jobRequirementRepo.getById(nextRequirement.job_requirement_id);
        if (!nextRequirementObj) {
            throw new Error(
                `Could not find job requirement ${nextRequirement.job_requirement_id} for conversation ${conversationId}`
            );
        }

        return await sendNextRequirementQuestion(
            conversationId,
            nextRequirementObj,
            newStatus,
            streamOptions,
            deps
        );
    }

    // No pending requirements found - all top 3 must be completed (MET or NOT_MET)
    // This should have been caught by the statusSummary.allMet check above,
    // but if we're here, transition to job questions
    return await transitionToJobQuestions(conversationId, streamOptions, deps);
}

/**
 * Handles when all requirements are met - generates initial job questions message.
 */
const handleAllRequirementsMet = async (
    conversationId: string,
    newStatus: ConversationStatus,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult> => {
    const updatedContext = await deps.contextService.loadFullContext(conversationId);
    const jobQuestionsMessage = await generateJobFactsWelcomeMessage(
        conversationId,
        updatedContext,
        deps
    );
    streamMessage(jobQuestionsMessage, streamOptions);

    console.log(`[RequirementStateRouter] Initial job questions message generated, length: ${jobQuestionsMessage.length}`);

    return {
        assistantMessage: jobQuestionsMessage,
        newStatus,
        requirementMet: true,
    };
}

/**
 * Handles transitions when a requirement is MET.
 * Generates and returns the next question or job questions message.
 *
 * @param conversationId - The conversation ID
 * @param newStatus - The new conversation status after transition
 * @param streamOptions - Optional streaming options
 * @param deps - Dependencies (repositories, services, processor)
 * @returns StateRouterResult with the next message, or null if no transition needed
 */
const handleMetRequirementTransition = async (
    conversationId: string,
    newStatus: ConversationStatus,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult | null> => {
    if (newStatus === ConversationStatus.ON_REQ) {
        // More requirements to ask
        return await handleNextRequirement(
            conversationId,
            newStatus,
            streamOptions,
            deps
        );
    } else if (newStatus === ConversationStatus.ON_JOB_QUESTIONS) {
        // All requirements met - generate initial job questions message
        return await handleAllRequirementsMet(
            conversationId,
            newStatus,
            streamOptions,
            deps
        );
    }

    // No transition needed
    return null;
};

/**
 * Routes the next message and state based on evaluation results.
 *
 * @param conversationId - The conversation ID
 * @param currentRequirementId - The current requirement ID
 * @param evaluationResult - The evaluation result (MET/NOT_MET/PENDING)
 * @param assistantMessage - The assistant message to potentially stream
 * @param userMessage - The user's original message
 * @param needsClarification - Whether clarification is needed (follow-up case)
 * @param streamOptions - Optional streaming options
 * @param deps - Dependencies (repositories, services, processor)-
 * @returns Next message, status, and requirement met status
 */
export const routeRequirementState = async (
    conversationId: string,
    currentRequirementId: string,
    evaluationResult: RequirementStatus | null,
    assistantMessage: string,
    userMessage: string,
    needsClarification: boolean,
    streamOptions: StreamOptions | undefined,
    deps: StateRouterDependencies
): Promise<StateRouterResult> => {
    // 1. Handle follow-up case first (needs clarification)
    // Generate a proper follow-up question using the follow-up prompt builder
    if (needsClarification) {
        // Load context and set up for follow-up prompt
        const context = await deps.contextService.loadFullContext(conversationId);

        if (!context.current_requirement) {
            throw new Error('current_requirement is required for follow-up prompts');
        }

        // Use the assistant message as the clarification needed text
        // This message should already indicate what needs clarification from the LLM
        const clarificationNeeded = userMessage || 'Please provide more information to clarify your response.';

        // Create context with NEED_FOLLOW_UP status for follow-up prompt builder
        // This will use buildFollowUpRequirementPrompt which generates a proper follow-up question
        const followUpContext: ConversationContext = {
            ...context,
            status: 'NEED_FOLLOW_UP',
            clarification_needed: clarificationNeeded,
        };

        // Generate follow-up question using processor with follow-up prompt
        // The processor will use buildFollowUpRequirementPrompt based on the NEED_FOLLOW_UP status
        const followupMessage = buildFollowUpRequirementPrompt(followUpContext)

        const processorResponse = await deps.processor({
            context: followUpContext,
            isInitialMessage: false,
        }, followupMessage);
        console.log(`[RequirementStateRouter] Raw follow-up response: ${processorResponse.assistantMessage}`);
        const followUpMessage = processorResponse.assistantMessage || 'Could you please clarify your previous response?';
        const response = parseLLMResponse(context.current_requirement.requirement_type, followUpMessage);
        // Clean any JSON from the follow-up message
        const maybeJSON = extractJSONObject(followUpMessage);
        if (maybeJSON) {
            console.log(`[RequirementStateRouter] Follow-up question JSON extracted: ${JSON.stringify(maybeJSON)}`);
            const message = maybeJSON.message as string
                || 'Could you please clarify your previous response?';
            streamMessage(message, streamOptions);
            return {
                assistantMessage: message,
                newStatus: ConversationStatus.ON_REQ,
                requirementMet: null, // Still pending
                needsClarification: true,
            };
        }
        const cleanFollowUpMessage = removeJSONFromText(response.message ?? followUpMessage) || 'Could you please clarify your previous response?';
        console.log(`[RequirementStateRouter] Follow-up question generated: ${cleanFollowUpMessage}`);

        streamMessage(cleanFollowUpMessage, streamOptions);
        return {
            assistantMessage: cleanFollowUpMessage,
            newStatus: ConversationStatus.ON_REQ,
            requirementMet: null, // Still pending
            needsClarification: true,
        };
    }

    // 2. Handle status transitions (check AFTER update is committed)
    const newStatus = await handleStatusTransition(
        conversationId,
        currentRequirementId,
        evaluationResult,
        deps
    );

    // 3. Handle transitions based on evaluation result
    // Only handle MET case - null/PENDING/NOT_MET will fall through to streaming
    if (evaluationResult === RequirementStatus.MET) {
        const transitionResult = await handleMetRequirementTransition(
            conversationId,
            newStatus,
            streamOptions,
            deps
        );

        // If transition occurred, return early
        if (transitionResult) {
            return transitionResult;
        }
    }

    // 4. For NOT_MET, PENDING, or null cases, stream the message and return
    // null means no evaluation could be performed (treated like PENDING)
    streamMessage(assistantMessage, streamOptions);

    return {
        assistantMessage,
        newStatus,
        requirementMet: evaluationResult === RequirementStatus.MET ? true :
            evaluationResult === RequirementStatus.NOT_MET ? false : null,
    };
};
