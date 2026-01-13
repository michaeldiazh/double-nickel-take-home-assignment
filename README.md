# Backend Architecture Documentation

This document provides a comprehensive overview of the backend architecture for the Double Nickel Take Home Challenge, covering the domain-driven design, criteria layer, database layer, handlers, WebSocket implementation, and frontend endpoints.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Domain Layer](#domain-layer)
   - [Criteria Layer](#criteria-layer)
   - [LLM Layer](#llm-layer)
   - [Application Domain](#application-domain)
   - [Prompts Domain](#prompts-domain)
   - [Conversation Context](#conversation-context)
3. [Database Layer](#database-layer)
4. [Infrastructure Layer](#infrastructure-layer)
   - [Processor](#processor)
   - [Server](#server)
   - [Database Connection](#database-connection)
5. [WebSocket Implementation](#websocket-implementation)
6. [Frontend Endpoints](#frontend-endpoints)

---

## Architecture Overview

The backend follows a **domain-driven architecture** with clear separation between business logic (domain) and infrastructure concerns.

### Directory Structure

```
src/
├── domain/                    # Business Logic (Domain Layer)
│   ├── application/           # Application service
│   ├── conversation-context/  # Conversation context building
│   ├── criteria/              # Job requirement criteria system
│   ├── llm/                   # LLM interaction handlers
│   └── prompts/               # Prompt building and status handlers
├── entities/                  # Data Access Layer (Repository Pattern)
│   ├── application/
│   ├── conversation/
│   ├── job/
│   ├── message/
│   └── ...
├── processor/                 # LLM Processing Orchestration (Infrastructure)
├── server/                    # HTTP/WebSocket Server (Infrastructure)
└── database/                  # Database Connection Pool (Infrastructure)
```

### Architecture Principles

- **Domain Layer** (`domain/`): Contains all business logic, domain models, and use cases
- **Entity Layer** (`entities/`): Data access layer using repository pattern
- **Infrastructure Layer** (`processor/`, `server/`, `database/`): Technical concerns and external integrations
- **Separation of Concerns**: Clear boundaries between business logic and infrastructure
- **Functional Composition**: Handlers are functional, explicit dependencies, easy to test

---

## Domain Layer

### Criteria Layer

The criteria layer is responsible for defining, parsing, and evaluating job requirements. It provides a type-safe, extensible system for handling different types of job requirements.

#### Structure

```
src/domain/criteria/
├── base-schemas.ts            # Base schemas (no dependencies, prevents circular deps)
├── types.ts                   # Union types and re-exports
├── parser.ts                  # Main parser router
├── router.ts                  # Evaluation router
├── requirement-status.ts      # Status management
├── response-format.ts         # Response formatting
├── utils.ts                   # Utility functions
└── <requirement-type>/        # One directory per requirement type
    ├── types.ts               # Type definitions and Zod schemas
    ├── handler.ts             # Evaluation handler
    ├── parser.ts              # Value extraction parser
    └── index.ts               # Exports
```

#### Requirement Types

Each requirement type has its own directory with:
- **`types.ts`**: Zod schemas, TypeScript types, and type guards
- **`handler.ts`**: Evaluation logic (checks if user meets requirement)
- **`parser.ts`**: Extraction logic (parses user response to structured value)
- **`index.ts`**: Public exports

**Supported Requirement Types**:
- `cdl-class/` - Commercial Driver's License class (A, B, C)
- `years-experience/` - Minimum years of driving experience
- `driving-record/` - Maximum violations and accidents allowed
- `endorsements/` - Required endorsements (Hazmat, Tanker, etc.)
- `age-requirement/` - Minimum age requirement
- `physical-exam/` - DOT physical exam requirements
- `drug-test/` - Drug testing requirements
- `background-check/` - Background check requirements
- `geographic-restriction/` - Geographic restrictions (states, regions)

#### Base Schemas

The `base-schemas.ts` file contains foundational schemas used by all requirement types:

- **`requiredCriteriaSchema`**: For criteria with a mandatory `required` field
- **`optionalRequiredCriteriaSchema`**: For criteria with an optional `required` field

This file has **no imports** to prevent circular dependencies. All requirement type schemas extend from these base schemas.

#### Key Components

**1. Type Definitions** (`types.ts`)

- Union types: `JobRequirementCriteria`, `ConversationRequirementValue`
- Enum: `JobRequirementType`
- Re-exports all requirement-specific types and schemas

**2. Evaluation Router** (`router.ts`)

Routes requirement types to their evaluation handlers:

```typescript
const criteriaRouter: CriteriaRouter = {
  [JobRequirementType.CDL_CLASS]: evaluateCDLClass,
  [JobRequirementType.YEARS_EXPERIENCE]: evaluateYearsExperience,
  // ... etc
};
```

**3. Parser** (`parser.ts`)

Main entry point for parsing LLM responses into structured values:

```typescript
parseLLMResponse(requirementType: JobRequirementType, content: string): ParseResult
```

**4. Handlers** (`<requirement-type>/handler.ts`)

Each handler evaluates whether a user's response meets the requirement:

```typescript
export const evaluateCDLClass = (
  criteria: CDLClassCriteria,
  value: CDLClassValue
): RequirementStatus => {
  // Returns: MET, NOT_MET, or PENDING
};
```

**5. Parsers** (`<requirement-type>/parser.ts`)

Extract structured data from user's natural language responses:

```typescript
export const parseCDLClassValue = (text: string): CDLClassValue => {
  // Extracts CDL class from text
};
```

### LLM Layer

The LLM layer handles all interactions with language models, organized by conversation phase.

#### Structure

```
src/domain/llm/
├── client/                     # LLM client abstraction
│   ├── interface.ts            # LLMClient interface
│   ├── factory.ts              # Client factory
│   ├── types.ts                # Shared types
│   └── providers/              # Provider implementations
│       └── openai/             # OpenAI provider
├── greeting/                   # Initial greeting phase
│   ├── handler.ts              # Main greeting handler
│   ├── initial-handler.ts      # Creates greeting message
│   ├── response-handler.ts     # Handles yes/no response
│   └── parser.ts               # Parses yes/no responses
├── requirement/                # Requirement collection phase
│   ├── requirement.handler.ts  # Main requirement handler
│   ├── message-receiver.ts     # Receives and validates messages
│   ├── llm-processor.ts        # LLM processing and parsing
│   ├── evaluator.ts            # Criteria evaluation
│   └── state-router.ts         # State management and routing
├── completion/                 # Conversation completion phase
│   ├── completion.handler.ts   # Main completion handler
│   ├── context-builder.ts      # Builds completion context
│   ├── completion-processor.ts # Generates completion message
│   └── summary-truncator.ts    # Truncates long summaries
└── job-questions/              # Job-specific questions phase
    ├── handler.ts
    ├── job-question-processor.ts
    ├── message-receiver.ts
    └── state-router.ts
```

#### Key Components

**1. LLM Client** (`client/`)

Abstracts LLM provider interactions:

```typescript
interface LLMClient {
  chatCompletion(messages: ChatMessage[], options?: CompletionOptions): Promise<LLMResponse>;
  streamChatCompletion(messages: ChatMessage[], options: StreamOptions): Promise<void>;
}
```

**2. Functional Handlers**

All handlers are functional with explicit dependencies:

```typescript
export const handleRequirementResponse = async (
  conversationId: string,
  userMessage: string,
  streamOptions: StreamOptions | undefined,
  deps: RequirementHandlerDependencies
): Promise<RequirementHandlerResult>
```

**3. Phase-Specific Logic**

Each conversation phase has dedicated handlers:
- **Greeting**: Initial welcome and engagement
- **Requirement**: Collecting and evaluating requirements
- **Job Questions**: Job-specific questions
- **Completion**: Final decision and summary generation

### Application Domain

Application service for managing job applications.

```
src/domain/application/
├── service.ts                 # ApplicationService
└── index.ts
```

**ApplicationService**:
- Retrieves user's job applications with job and conversation data
- Used by user endpoints to return application history

### Prompts Domain

Prompt building and conversation status management.

#### Structure

```
src/domain/prompts/
├── builders/                  # Prompt construction
│   ├── prompt-context.ts     # Builds conversation context
│   ├── question-prompt.ts    # Builds question prompts
│   └── message-builders/      # Message type builders
│       ├── greeting.ts
│       ├── introduction.ts
│       ├── requirements.ts
│       ├── follow-up.ts
│       ├── job-facts.ts
│       └── complete.ts
└── handlers/                  # Status transition handlers
    ├── pending.status.handler.ts    # Handles PENDING status
    ├── requirements.status.handler.ts # Handles ON_REQ status
    ├── job-questions.status.handler.ts # Handles ON_JOB_QUESTIONS status
    └── done.status.handler.ts        # Handles DONE status
```

#### Status Handlers

Status handlers orchestrate conversation state transitions:

- **`pending.status.handler.ts`**: Handles initial greeting and yes/no response
- **`requirements.status.handler.ts`**: Handles requirement collection phase
- **`job-questions.status.handler.ts`**: Handles job-specific questions
- **`done.status.handler.ts`**: Handles conversation completion

Each handler:
1. Receives user message
2. Calls appropriate LLM handler
3. Updates conversation status
4. Returns response message

### Conversation Context

Builds comprehensive conversation context for LLM interactions.

```
src/domain/conversation-context/
├── service.ts                 # ConversationContextService
├── types.ts                   # ConversationContext type
└── index.ts
```

**ConversationContextService**:
- Loads full conversation context including:
  - User and job information
  - Message history
  - Current requirement
  - Completed requirements
  - Job facts
- Used by all LLM handlers to provide context

---

## Database Layer

The database layer follows a repository pattern with clear separation between entities and data access.

### Entity Structure

```
src/entities/
├── user/                      # User accounts
├── job/                       # Job postings
├── application/              # Job applications
├── conversation/             # Conversation sessions
├── message/                  # Individual messages
├── job-requirement/          # Job requirement definitions
├── conversation-job-requirement/ # User's responses to requirements
└── job-fact/                 # Job-specific facts/context
```

Each entity has:
- **`domain.ts`**: Domain model and Zod schemas
- **`repository.ts`**: Database access methods
- **`index.ts`**: Public exports

### Key Entities

#### 1. User (`entities/user/`)
- Stores user account information (email, name, address, etc.)
- Repository: `UserRepository`
- Methods: `create()`, `getById()`, `getByEmail()`

#### 2. Job (`entities/job/`)
- Job postings with descriptions, location, payment info
- Repository: `JobRepository`
- Methods: `getById()`, `getAll()`
- Includes `is_active` flag and `location` field

#### 3. Application (`entities/application/`)
- Links users to jobs
- Repository: `ApplicationRepository`
- Methods: `create()`, `getById()`, `getWithUserAndJob()`, `getApplicationsWithJobAndConversationByUserId()`, `delete()`
- Cascade deletes: Deleting an application automatically deletes associated conversations, messages, and requirements

#### 4. Conversation (`entities/conversation/`)
- Conversation sessions with status tracking
- Repository: `ConversationRepository`
- Status enum: `PENDING`, `START`, `ON_REQ`, `ON_JOB_QUESTIONS`, `DONE`
- Screening decision: `APPROVED`, `DENIED`, `USER_CANCELED`, `PENDING`
- Methods: `create()`, `getById()`, `getByApplicationId()`, `update()`

#### 5. Message (`entities/message/`)
- Individual messages in conversations
- Repository: `MessageRepository`
- Sender: `'USER'`, `'ASSISTANT'`, `'SYSTEM'` (string literals)
- Methods: `create()`, `getByConversationId()`

#### 6. Job Requirement (`entities/job-requirement/`)
- Requirement definitions for jobs
- Repository: `JobRequirementRepository`
- Stores `criteria` as JSONB matching criteria schemas
- Methods: `getByJobId()`, `getById()`, `getIdsByJobId()`

#### 7. Conversation Job Requirement (`entities/conversation-job-requirement/`)
- User's responses to specific requirements
- Repository: `ConversationJobRequirementRepository`
- Status: `PENDING`, `MET`, `NOT_MET`
- Stores `extracted_value` as JSONB
- Methods: `createForConversation()`, `getByConversationId()`, `getNextPending()`, `update()`

### Database Schema

Key tables and relationships:

- **users** → **applications** → **conversations** → **messages**
- **jobs** → **job_requirements**
- **conversations** → **conversation_job_requirements** → **job_requirements**

All IDs use UUIDv4. Foreign keys use `ON DELETE CASCADE` for automatic cleanup.

See `misc/output_schema.sql` for complete schema definition.

---

## Infrastructure Layer

### Processor

The processor orchestrates LLM interactions, prompt building, and response handling.

```
src/processor/
├── index.ts                  # Processor factory and main logic
└── types.ts                   # Processor types
```

**Processor**:
- Builds conversation prompts from context
- Handles streaming and non-streaming LLM calls
- Processes LLM responses
- Used by all LLM handlers

### Server

HTTP and WebSocket server implementation.

```
src/server/
├── index.ts                  # ApplicationGateway (HTTP + WebSocket)
├── types.ts                   # WebSocket types and schemas
├── builder/
│   └── stream-option.builder.ts # Stream options builder
└── routes/                    # HTTP route handlers
    ├── user.routes.ts
    ├── job.routes.ts
    ├── application.routes.ts
    └── conversation-summary.routes.ts
```

**ApplicationGateway**:
- Unified entry point for HTTP REST and WebSocket
- Manages WebSocket connections
- Routes messages to appropriate handlers based on conversation status
- Handles early disconnects (auto-deletes incomplete applications)

### Database Connection

Database connection pool management.

```
src/database/
├── connection.ts              # Connection pool setup
└── index.ts
```

---

## WebSocket Implementation

The WebSocket server provides real-time bidirectional communication for the conversation flow.

### Architecture

The `ApplicationGateway` class (in `src/server/index.ts`) serves as a unified entry point for both HTTP REST and WebSocket connections.

### Message Types

#### Client Messages

```typescript
// Start a new conversation
{
  type: 'start_conversation',
  userId: string,
  jobId: string
}

// Send a message in an existing conversation
{
  type: 'send_message',
  conversationId: string,
  message: string
}

// End a conversation
{
  type: 'end_conversation',
  conversationId: string
}

// Pause a conversation
{
  type: 'pause_conversation',
  conversationId: string
}

// Continue a paused conversation
{
  type: 'continue_conversation',
  conversationId: string
}
```

#### Server Messages

```typescript
// Initial greeting
{
  event: 'greeting',
  conversationId: string,
  message: string
}

// Regular message
{
  event: 'message',
  conversationId: string,
  message: string
}

// Status update (includes completion data when done)
{
  event: 'status_update',
  conversationId: string,
  status: ConversationStatus,
  message: string,
  screeningDecision?: string,      // When conversation complete
  screeningSummary?: string | null  // When conversation complete
}

// Error
{
  event: 'error',
  error: string
}

// Conversation end
{
  event: 'conversation_end',
  conversationId: string,
  message: string
}
```

### Connection Flow

1. **Client connects** to WebSocket server
2. **Client sends** `start_conversation` with `userId` and `jobId`
3. **Server**:
   - Creates application and conversation
   - Generates initial greeting
   - Sends greeting via WebSocket
   - Conversation status: `PENDING`
4. **User responds** with yes/no
5. **Server**:
   - Processes response
   - If yes: Creates requirements, sends introduction, status: `START`
   - If no: Sends "good luck", status: `DONE`, decision: `DENIED`
6. **Conversation continues** with `send_message` events
7. **Status transitions**: `PENDING` → `START` → `ON_REQ` → `ON_JOB_QUESTIONS` → `DONE`
8. **On completion**: Server sends `status_update` with `screeningDecision` and `screeningSummary`

### State Management

Conversation status determines which handler processes messages:

- **PENDING**: `handlePendingResponse` (yes/no to greeting)
- **START**: Transitions to `ON_REQ`
- **ON_REQ**: `handleRequirementsResponse` (requirement collection)
- **ON_JOB_QUESTIONS**: `handleJobQuestionsResponse` (job questions)
- **DONE**: `handleDoneConversation` (read-only)

### Disconnect Handling

If a user disconnects early (status `PENDING` or `START`):
- Application and conversation are automatically deleted
- Prevents stale data from incomplete applications

### Pause/Resume

- **Pause**: Acknowledges pause, returns current status
- **Resume**: Returns current status, includes completion data if conversation is done

---

## Frontend Endpoints

REST API endpoints for frontend integration.

### Base URL

```
http://localhost:<PORT>
```

Default port: `3000` (configurable via environment variables)

### Endpoints

#### 1. Create User

**POST** `/user`

Creates a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "aptNum": "Apt 4B",  // Optional
  "state": "CA",
  "zipCode": "90210"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "address": "123 Main St",
  "aptNum": "Apt 4B",
  "state": "CA",
  "zipCode": "90210",
  "jobApplications": []
}
```

#### 2. User Login

**POST** `/user/login`

Authenticates a user and returns their profile with job applications.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "address": "123 Main St",
  "aptNum": "Apt 4B",
  "state": "CA",
  "zipCode": "90210",
  "jobApplications": [
    {
      "applicationId": "uuid",
      "jobId": "uuid",
      "jobName": "Truck Driver",
      "jobDescription": "Long-haul truck driver position",
      "jobLocation": "Los Angeles, CA",
      "screeningDecision": "Pending"
    }
  ]
}
```

**Screening Decision Values**:
- `"Approved"` - Application approved
- `"Denied"` - Application denied
- `"Pending"` - Application pending review
- `"Canceled"` - Application canceled by user

#### 3. Get All Jobs

**GET** `/jobs`

Retrieves all available jobs, ordered by creation date (oldest first).

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "jobName": "Truck Driver",
    "jobDescription": "Long-haul truck driver position requiring CDL license",
    "jobLocation": "Los Angeles, CA",
    "isActive": true
  }
]
```

**Note**: Filtering by location, job type, or other criteria will be added in a future iteration.

#### 4. Delete Application

**DELETE** `/application/:applicationId`

Deletes an application and all associated data (conversation, messages, etc.). Useful for allowing users to redo an application.

**Path Parameters**:
- `applicationId` (UUID v4) - The application ID to delete

**Response**: `200 OK`
```json
{
  "message": "Application deleted successfully"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid application ID format (must be UUID v4)
- `404 Not Found` - Application not found
- `500 Internal Server Error` - Server error

**Note**: Deleting an application will cascade delete:
- The associated conversation
- All messages in that conversation
- All conversation job requirements
- All related data

#### 5. Download Conversation Messages

**GET** `/conversation-summary/:applicationId/messages`

Downloads all messages from a conversation as a text file.

**Path Parameters**:
- `applicationId` (UUID v4) - The application ID

**Response**: `200 OK`
- Content-Type: `text/plain`
- Content-Disposition: `attachment; filename="conversation-{applicationId}-{timestamp}.txt"`

**File Format**:
```
Conversation Summary
Application ID: {applicationId}
User: {firstName} {lastName} ({email})
Job: {jobName}
Date: {date}

--- Messages ---

[Timestamp] USER: {message}
[Timestamp] ASSISTANT: {message}
...
```

**Error Responses**:
- `400 Bad Request` - Invalid application ID format
- `404 Not Found` - Application, conversation, or messages not found
- `500 Internal Server Error` - Server error

### Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [...]  // Optional: Zod validation errors
}
```

### CORS

CORS is disabled for local development to allow frontend connections from any origin.

---

## Environment Variables

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=happy_hauler
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=3000

# LLM Provider (OpenAI)
OPENAI_API_KEY=your_api_key
```

---

## Starting the Server

### Prerequisites

1. PostgreSQL database running
2. Database schema created (run `misc/output_schema.sql`)
3. Environment variables configured

### Start Commands

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

### WebSocket Connection

The WebSocket server runs on the same port as the HTTP server:

```
ws://localhost:3000
```

---

## Architecture Highlights

### Domain-Driven Design

- **Domain Layer**: All business logic isolated in `domain/`
- **Entity Layer**: Data access using repository pattern
- **Infrastructure Layer**: Technical concerns (processor, server, database) at root level
- **Clear Boundaries**: Explicit separation between business logic and infrastructure

### Type Safety

- Zod schemas for validation at boundaries
- TypeScript types throughout
- Enum types for status values
- String literal types for message senders

### Functional Composition

- Handlers are functional with explicit dependencies
- Easy to test and mock
- No hidden state or side effects
- Clear dependency injection

### Extensibility

- Criteria layer easily extended with new requirement types
- Handler pattern allows adding new conversation states
- LLM client abstraction supports multiple providers
- Modular prompt builders

### Data Integrity

- Foreign key constraints with cascade deletes
- UUIDv4 for all IDs
- PostgreSQL ENUMs for status values
- JSONB for flexible criteria storage

### Circular Dependency Prevention

- Base schemas in isolated file (`base-schemas.ts`) with no imports
- Prevents circular dependencies in criteria layer
- Clean module boundaries

---

## Testing

Tests are organized to mirror the source structure:

```
tests/
├── domain/                    # Domain logic tests
│   ├── application/
│   ├── criteria/
│   └── llm/
├── entities/                  # Repository tests
└── server/                    # Route tests
```

Run tests:
```bash
npm test
```

---

## Future Enhancements

- **Filtering**: Add filtering to `/jobs` endpoint (location, job type, etc.)
- **Authentication**: Implement JWT or session-based authentication
- **Caching**: Add Redis caching for frequently accessed data
- **Rate Limiting**: Add rate limiting for API endpoints
- **Logging**: Enhanced logging and monitoring
- **Testing**: Expanded test coverage

---

## Additional Documentation

- **API Documentation**: See `misc/API_DOCUMENTATION.md` for detailed API reference
- **Database Schema**: See `misc/output_schema.sql` for complete schema
- **Mock Data**: See `misc/mock_data.sql` for sample data
