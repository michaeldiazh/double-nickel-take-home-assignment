/**
 * Requirement Evaluator Module
 *
 * Responsibility: Evaluate criteria results
 * - Runs criteria evaluation
 * - Updates conversation requirement in DB
 * - Handles follow-up clarification logic
 */

import {ConversationJobRequirementRepository} from '../../../entities/conversation-job-requirement/repository';
import {
    ConversationJobRequirement,
    RequirementStatus
} from '../../../entities/conversation-job-requirement/domain';
import {JobRequirement} from '../../../entities/job-requirement/domain';
import {JobRequirementRepository} from '../../../entities/job-requirement/repository';
import {MessageRepository} from '../../../entities/message/repository';
import {ConversationRepository} from '../../../entities/conversation/repository';
import {ScreeningDecision} from '../../../entities/conversation/domain';
import {RequirementParseResult} from '../../../domain/criteria/parser';
import {ConversationRequirementValue, JobRequirementCriteria, JobRequirementType, isRequiredCriteria} from '../../../domain/criteria/types';
import {evaluateRequirement} from '../../../domain/criteria/router';

export interface EvaluatorDependencies {
    conversationJobRequirementRepo: ConversationJobRequirementRepository;
    jobRequirementRepo: JobRequirementRepository;
    messageRepo: MessageRepository;
    conversationRepo: ConversationRepository;
}

export interface EvaluatorResult {
    evaluationResult: RequirementStatus | null;
    needsClarification: boolean;
    updatedRequirement: ConversationJobRequirement | null;
}

/**
 * Maximum number of follow-up questions we'll ask before giving up.
 */
const MAX_FOLLOW_UPS = 5;

/**
 * Counts how many times we've asked for clarification for this requirement.
 *
 * Strategy: Count assistant messages that are follow-ups for THIS specific requirement.
 * Since we're in the same requirement when asking follow-ups (status is PENDING),
 * we can count assistant messages that were sent after the initial question for this requirement.
 *
 * Approach:
 * 1. Get all assistant messages in the conversation
 * 2. Find when this requirement was first asked (estimate based on requirement position)
 * 3. Count assistant messages sent after that point that are follow-ups
 *
 * Since requirements are asked sequentially, we can:
 * - Count total assistant messages
 * - Subtract 1 for initial greeting
 * - Subtract (requirement index + 1) for initial questions up to and including this requirement
 * - The remainder are follow-ups for this requirement
 *
 * However, this is still an approximation. A more accurate approach would be to:
 * - Track follow-up count explicitly in the database, OR
 * - Count assistant messages linked to this requirement via message_id updates
 *
 * For now, we'll use the message count approach but ensure we're counting correctly.
 */
const countFollowUpsForRequirement = async (
    conversationId: string,
    jobRequirementId: string,
    conversationJobRequirementRepo: ConversationJobRequirementRepository,
    messageRepo: MessageRepository
): Promise<number> => {
    const conversationRequirements = await conversationJobRequirementRepo.getConversationRequirements(conversationId);
    const conversationRequirement = conversationRequirements.find(
        cr => cr.job_requirement_id === jobRequirementId
    );

    if (!conversationRequirement) {
        return 0;
    }

    // If message_id is not set, we haven't asked any follow-ups yet
    // (message_id gets set when we first evaluate/save a message for this requirement)
    if (!conversationRequirement.message_id) {
        return 0;
    }

    // Count assistant messages for this conversation
    const allMessages = await messageRepo.getByConversationId(conversationId);
    const userMessage = allMessages.filter(m => m.sender === 'USER');

    // Get all requirements and find this requirement's position
    const allRequirements = await conversationJobRequirementRepo.getConversationRequirements(conversationId);
    const pendingRequirements = allRequirements.filter(
        r => r.status === RequirementStatus.PENDING
    );
    const requirementAssociatedToId = pendingRequirements.filter(
        r => r.job_requirement_id === jobRequirementId && r.status === RequirementStatus.PENDING
    );
    if (requirementAssociatedToId.length === 0) {
        throw new Error(`Requirement with ID ${jobRequirementId} not found among pending requirements`);
    }
    console.log(`[FollowUpClarification] Total assistant messages: ${userMessage.length}, Requirement position: ${requirementAssociatedToId.length - 1}`);
    return requirementAssociatedToId.length - 1;
};

/**
 * Runs criteria evaluation on parsed LLM response.
 */
const runCriteriaEvaluation = (
    parseResult: RequirementParseResult<ConversationRequirementValue>,
    requirementType: JobRequirementType,
    criteria: JobRequirementCriteria
): RequirementStatus | null => {
    // Priority 1: If LLM explicitly provided an assessment, use it (most reliable)
    // The LLM's assessment takes precedence because it considers context and nuance
    // (e.g., "confirmed: false" means NOT_MET even if cdl_class matches)
    if (parseResult.assessment) {
        console.log(`[RequirementEvaluator] Using LLM assessment: ${parseResult.assessment} (LLM assessment takes priority)`);
        return parseResult.assessment as RequirementStatus;
    }

    // Priority 2: If we successfully parsed a value, evaluate it against criteria
    if (parseResult.success && parseResult.value) {
        return evaluateRequirement(requirementType, criteria, parseResult.value);
    }

    // Priority 3: If we have a value but parsing was marked as failed, try to evaluate it anyway
    if (parseResult.value) {
        try {
            return evaluateRequirement(requirementType, criteria, parseResult.value);
        } catch (error) {
            console.warn(`[RequirementEvaluator] Failed to evaluate value even though it exists:`, error);
        }
    }

    // No way to evaluate - return null (will stay PENDING)
    console.warn(`[RequirementEvaluator] Cannot evaluate requirement - no value, no assessment. Parse success: ${parseResult.success}, hasValue: ${!!parseResult.value}, hasAssessment: ${!!parseResult.assessment}`);
    return null;
};

/**
 * Evaluates criteria and updates the conversation requirement in the database.
 * If requirement is NOT_MET, also updates conversation's screening_decision to DENIED.
 *
 * @param conversationId - The conversation ID
 * @param currentRequirement - The current requirement being evaluated
 * @param parseResult - The parsed LLM response
 * @param assistantMessageId - The ID of the saved assistant message
 * @param deps - Dependencies (repositories)
 * @returns EvaluatorResult with the evaluation result
 */
const evaluateAndUpdateRequirement = async (
    conversationId: string,
    currentRequirement: JobRequirement,
    parseResult: RequirementParseResult<ConversationRequirementValue>,
    assistantMessageId: string,
    deps: EvaluatorDependencies
): Promise<EvaluatorResult> => {
    // Run criteria evaluation
    const evaluationResult = runCriteriaEvaluation(
        parseResult,
        currentRequirement.requirement_type,
        currentRequirement.criteria
    );

    // Update conversation_job_requirement with MET/NOT_MET status
    await deps.conversationJobRequirementRepo.update(
        conversationId,
        currentRequirement.id,
        {
            extracted_value: parseResult.value ?? null,
            status: evaluationResult ?? RequirementStatus.PENDING,
            evaluated_at: evaluationResult ? new Date() : null,
            message_id: assistantMessageId,
        }
    );

    // If requirement was NOT_MET and it's required, set conversation's screening_decision to DENIED
    // (Note: This may have already been set in Priority 1 check, but we set it here too for safety
    // in case evaluationResult is NOT_MET but parseResult.assessment wasn't set)
    if (evaluationResult === RequirementStatus.NOT_MET && isRequiredCriteria(currentRequirement.criteria)) {
        await deps.conversationRepo.update(conversationId, {
            screening_decision: ScreeningDecision.DENIED,
        });
    }

    return {
        evaluationResult,
        needsClarification: false,
        updatedRequirement: null,
    };
};

/**
 * Handles follow-up clarification logic: checks threshold and returns appropriate result.
 * If threshold exceeded and marked as NOT_MET, also sets conversation's screening_decision to DENIED.
 *
 * @param conversationId - The conversation ID
 * @param currentRequirement - The current requirement being evaluated
 * @param assistantMessageId - The ID of the saved assistant message
 * @param deps - Dependencies (repositories)
 * @returns EvaluatorResult with NOT_MET if threshold exceeded, or PENDING with needsClarification if within threshold
 */
const handleFollowUpClarification = async (
    conversationId: string,
    currentRequirement: JobRequirement,
    assistantMessageId: string,
    deps: EvaluatorDependencies
): Promise<EvaluatorResult> => {
    const followUpCount = await countFollowUpsForRequirement(
        conversationId,
        currentRequirement.id,
        deps.conversationJobRequirementRepo,
        deps.messageRepo
    );

    console.log(`[FollowUpClarification] Requirement ${currentRequirement.id}, follow-up count: ${followUpCount}, max: ${MAX_FOLLOW_UPS}`);

    // Only mark as NOT_MET if we've clearly exceeded the threshold
    // Use > instead of >= to be more conservative (allows exactly MAX_FOLLOW_UPS follow-ups)
    if (followUpCount > MAX_FOLLOW_UPS) {
        console.log(`[FollowUpClarification] Exceeded threshold (${followUpCount} > ${MAX_FOLLOW_UPS}), marking as NOT_MET`);
        // Exceeded threshold - mark as NOT_MET
        await deps.conversationJobRequirementRepo.update(
            conversationId,
            currentRequirement.id,
            {
                status: RequirementStatus.NOT_MET,
                extracted_value: null,
                evaluated_at: new Date(),
                message_id: assistantMessageId,
            }
        );

        // Set conversation's screening_decision to DENIED only if requirement is required
        if (isRequiredCriteria(currentRequirement.criteria)) {
            await deps.conversationRepo.update(conversationId, {
                screening_decision: ScreeningDecision.DENIED,
            });
        }

        return {
            evaluationResult: RequirementStatus.NOT_MET,
            needsClarification: false, // No more clarification needed - we're done
            updatedRequirement: null,
        };
    }

    // Still within threshold - need clarification
    console.log(`[FollowUpClarification] Within threshold (${followUpCount} <= ${MAX_FOLLOW_UPS}), asking for clarification`);
    return {
        evaluationResult: RequirementStatus.PENDING,
        needsClarification: true,
        updatedRequirement: null,
    };
};

/**
 * Evaluates requirement against criteria and updates the database.
 *
 * @param conversationId - The conversation ID
 * @param currentRequirement - The current requirement being evaluated
 * @param conversationRequirement - The conversation requirement record
 * @param parseResult - The parsed LLM response
 * @param assistantMessageId - The ID of the saved assistant message
 * @param deps - Dependencies (repositories)
 * @returns Evaluation result and whether clarification is needed
 */
export const evaluateRequirementCriteria = async (
    conversationId: string,
    currentRequirement: JobRequirement,
    parseResult: RequirementParseResult<ConversationRequirementValue>,
    assistantMessageId: string,
    deps: EvaluatorDependencies
): Promise<EvaluatorResult> => {
    // Priority 1: If LLM explicitly says NOT_MET (even if needs_clarification is true),
    // and it's a required requirement, we should NOT ask for clarification - end the conversation
    // The LLM may set needs_clarification: true even when assessment is NOT_MET,
    // but if the assessment is clear (NOT_MET), we should respect that
    if (parseResult.assessment === RequirementStatus.NOT_MET && isRequiredCriteria(currentRequirement.criteria)) {
        console.log(`[RequirementEvaluator] NOT_MET for required requirement ${currentRequirement.id} - setting DENIED immediately`);
        // Set DENIED immediately when we detect NOT_MET for a required requirement
        await deps.conversationRepo.update(conversationId, {
            screening_decision: ScreeningDecision.DENIED,
        });
        // Evaluate and update to NOT_MET, which will trigger DONE status in state router
        return await evaluateAndUpdateRequirement(
            conversationId,
            currentRequirement,
            parseResult,
            assistantMessageId,
            deps
        );
    }

    // Priority 2: Check if clarification is needed (parser detected ambiguity)
    // Only ask for clarification if assessment is NOT NOT_MET (or if no assessment)
    if (parseResult.needsClarification && parseResult.assessment !== RequirementStatus.NOT_MET) {
        return await handleFollowUpClarification(
            conversationId,
            currentRequirement,
            assistantMessageId,
            deps
        );
    }

    // Priority 3: Try to evaluate criteria
    const evaluationResult = await evaluateAndUpdateRequirement(
        conversationId,
        currentRequirement,
        parseResult,
        assistantMessageId,
        deps
    );

    // Priority 4: If we couldn't evaluate (no value, no assessment), that's also a follow-up case
    // The LLM is confused and needs more information (e.g., "I maybe have it")
    if (evaluationResult.evaluationResult === null) {
        return await handleFollowUpClarification(
            conversationId,
            currentRequirement,
            assistantMessageId,
            deps
        );
    }

    return evaluationResult;
};
