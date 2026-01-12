# RequirementHandler Refactoring Plan

## Overview

The `RequirementHandler` class is being refactored into 4 functional modules, each with a single responsibility. This improves testability, maintainability, and reusability.

## Created Modules

### 1. `message-receiver.ts`
**Responsibility**: Receive and validate user input
- Validates conversation state (START or ON_REQ)
- Loads conversation context
- Gets current requirement
- Saves user message
- **Function**: `receiveRequirementMessage()`

### 2. `llm-processor.ts`
**Responsibility**: Send user message to LLM with criteria and parse response
- Builds prompt with criteria
- Sends to LLM
- Parses LLM response (extract value, assessment, message)
- Cleans message (remove JSON)
- **Function**: `processRequirementWithLLM()`

### 3. `evaluator.ts`
**Responsibility**: Evaluate criteria results
- Runs criteria evaluation
- Updates conversation requirement in DB
- Handles follow-up clarification logic
- **Function**: `evaluateRequirementCriteria()`

### 4. `state-router.ts`
**Responsibility**: Route next message and state based on results
- Determines status transitions
- Generates next question (if more requirements)
- Generates job questions message (if all met)
- Handles streaming
- **Function**: `routeRequirementState()`

## Test Files Created

All test files are in `src/services/llm/requirement/__tests__/`:

1. `message-receiver.test.ts` - Tests for message receiver
2. `llm-processor.test.ts` - Tests for LLM processor
3. `evaluator.test.ts` - Tests for evaluator
4. `state-router.test.ts` - Tests for state router

## Next Steps

### Step 1: Install Test Dependencies
```bash
npm install -D vitest @vitest/ui
```

### Step 2: Run Tests
```bash
npx vitest
```

Review and fix any failing tests. The tests should validate that each module works correctly.

### Step 3: Refactor Handler
Once all tests pass, refactor `handler.ts` to use the new functional modules:

```typescript
async handleRequirementResponse(
  conversationId: string,
  userMessage: string,
  streamOptions?: StreamOptions
) {
  // 1. Receive and validate message
  const { context, currentRequirement, conversationRequirement, userMessageId } = 
    await receiveRequirementMessage(conversationId, userMessage, {
      messageRepo: this.messageRepo,
      contextService: this.contextService,
    });

  // 2. Process with LLM
  const { parseResult, cleanedMessage, rawAssistantMessage } = 
    await processRequirementWithLLM(userMessage, context, currentRequirement, {
      llmClient: this.llmClient,
    });

  // 3. Save assistant message
  const assistantMessageId = await this.saveAssistantMessage(conversationId, cleanedMessage);

  // 4. Handle clarification if needed
  if (parseResult.needsClarification) {
    // Stream and return follow-up
    // ...
  }

  // 5. Evaluate criteria
  const { evaluationResult, needsClarification } = 
    await evaluateRequirementCriteria(
      conversationId,
      currentRequirement,
      conversationRequirement,
      parseResult,
      assistantMessageId,
      {
        conversationJobRequirementRepo: this.conversationJobRequirementRepo,
        jobRequirementRepo: this.jobRequirementRepo,
      }
    );

  // 6. Route state
  return await routeRequirementState(
    conversationId,
    currentRequirement.id,
    evaluationResult,
    cleanedMessage,
    streamOptions,
    {
      conversationRepo: this.conversationRepo,
      conversationJobRequirementRepo: this.conversationJobRequirementRepo,
      jobRequirementRepo: this.jobRequirementRepo,
      contextService: this.contextService,
      messageRepo: this.messageRepo,
      processor: this.processor,
    }
  );
}
```

### Step 4: Delete Old Implementation
After refactoring and verifying everything works:
- Remove private helper methods from `handler.ts`
- Keep only the public `handleRequirementResponse` method that orchestrates the modules

## Benefits

1. **Single Responsibility**: Each module has one clear purpose
2. **Testability**: Each module can be tested independently
3. **Reusability**: Modules can be reused in other contexts
4. **Maintainability**: Easier to understand and modify
5. **Functional Style**: Pure functions with dependencies injected

## Files Modified/Created

### Created:
- `src/services/llm/requirement/message-receiver.ts`
- `src/services/llm/requirement/llm-processor.ts`
- `src/services/llm/requirement/evaluator.ts`
- `src/services/llm/requirement/state-router.ts`
- `src/services/llm/requirement/__tests__/message-receiver.test.ts`
- `src/services/llm/requirement/__tests__/llm-processor.test.ts`
- `src/services/llm/requirement/__tests__/evaluator.test.ts`
- `src/services/llm/requirement/__tests__/state-router.test.ts`
- `vitest.config.ts`
- `TESTING.md`
- `REFACTORING_PLAN.md`

### Modified:
- `src/services/llm/requirement/index.ts` - Added exports for new modules

### Not Modified (Yet):
- `src/services/llm/requirement/handler.ts` - Original implementation preserved until tests pass
