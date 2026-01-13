/**
 * Greeting handler module.
 * 
 * Handles sending initial greeting when conversation is created (PENDING status)
 * and processing user's response to the greeting (yes/no).
 */

export { GreetingHandler } from './handler';
export { parseYesNoSimple, buildYesNoParsingPrompt, type YesNoParseResult } from './parser';
// Prompt builders moved to domain/prompts/builders/message-builders/greeting
export { buildPendingGreetingSystemPromptMessage, buildGoodLuckSystemPromptMessage } from '../../../domain/prompts/builders/message-builders/greeting';

// Legacy exports for backward compatibility (deprecated - use GreetingHandler instead)
export { GreetingInitialHandler } from './initial-handler';
export { GreetingResponseHandler } from './response-handler';