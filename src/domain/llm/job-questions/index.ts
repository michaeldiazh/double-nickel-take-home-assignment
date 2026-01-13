/**
 * Job Questions Handler module.
 * 
 * Handles user questions during ON_JOB_QUESTIONS status.
 */

export { JobQuestionsHandler } from './handler';

// Export functional modules
export { receiveJobQuestionMessage, isValidJobQuestionsStatus } from './message-receiver';
export { processJobQuestion } from './job-question-processor';
export { routeJobQuestionState } from './state-router';

export type { MessageReceiverDependencies, MessageReceiverResult } from './message-receiver';
export type { JobQuestionProcessorDependencies, JobQuestionProcessorResult } from './job-question-processor';
export type { StateRouterDependencies, StateRouterResult } from './state-router';
