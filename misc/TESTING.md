# Testing Guide

## Setup

To run tests, you'll need to install the test dependencies:

```bash
npm install -D vitest @vitest/ui
```

## Running Tests

Run all tests:
```bash
npx vitest
```

Run tests in watch mode:
```bash
npx vitest --watch
```

Run tests with UI:
```bash
npx vitest --ui
```

Run specific test file:
```bash
npx vitest src/services/llm/requirement/__tests__/message-receiver.test.ts
```

## Test Structure

Tests are located in `__tests__` directories next to the modules they test:

- `src/services/llm/requirement/__tests__/message-receiver.test.ts` - Tests for message receiver module
- `src/services/llm/requirement/__tests__/llm-processor.test.ts` - Tests for LLM processor module
- `src/services/llm/requirement/__tests__/evaluator.test.ts` - Tests for evaluator module
- `src/services/llm/requirement/__tests__/state-router.test.ts` - Tests for state router module

## Test Coverage

Each module has tests covering:
- Happy path scenarios
- Error cases
- Edge cases
- Boundary conditions

## Notes

- Tests use Vitest as the test framework
- Tests use mocks for external dependencies (repositories, LLM client, etc.)
- Tests are designed to validate the functional modules before refactoring the handler
