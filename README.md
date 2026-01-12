# Backend Architecture Documentation

This document provides a comprehensive overview of the backend architecture for the Double Nickel Take Home Challenge, covering the criteria layer, database layer, handlers, WebSocket implementation, and frontend endpoints.

## Table of Contents

1. [Criteria Layer](#criteria-layer)
2. [Database Layer](#database-layer)
3. [Handlers](#handlers)
   - [Prompting Handlers](#prompting-handlers)
   - [Response Handling Handlers](#response-handling-handlers)
4. [WebSocket Implementation](#websocket-implementation)
5. [Frontend Endpoints](#frontend-endpoints)

---

## Criteria Layer

The criteria layer is responsible for defining, parsing, and evaluating job requirements. It provides a type-safe, extensible system for handling different types of job requirements.

### Structure

```
src/services/criteria/
├── criteria-types.ts          # Type definitions and Zod schemas for all requirement types
├── handlers/                  # Evaluation handlers for each requirement type
│   ├── router.ts             # Routes requirement types to appropriate handlers
│   ├── cdl-class-handler.ts
│   ├── years-experience-handler.ts
│   ├── driving-record-handler.ts
│   ├── endorsements-handler.ts
│   ├── age-requirement-handler.ts
│   ├── physical-exam-handler.ts
│   ├── drug-test-handler.ts
│   ├── background-check-handler.ts
│   └── geographic-restriction-handler.ts
├── parser/                    # Text parsing utilities for extracting values from user responses
│   ├── cdl-class/
│   ├── years-experience/
│   ├── driving-record/
│   └── ... (one per requirement type)
├── requirement-status.ts     # Status management utilities
└── response-format.ts        # Response formatting utilities
```

### Key Components

#### 1. Requirement Types (`criteria-types.ts`)

Defines all supported job requirement types and their criteria schemas:

- **CDL_CLASS**: Commercial Driver's License class (A, B, C)
- **YEARS_EXPERIENCE**: Minimum years of driving experience
- **DRIVING_RECORD**: Maximum violations and accidents allowed
- **ENDORSEMENTS**: Required endorsements (Hazmat, Tanker, etc.)
- **AGE_REQUIREMENT**: Minimum age requirement
- **PHYSICAL_EXAM**: DOT physical exam requirements
- **DRUG_TEST**: Drug testing requirements
- **BACKGROUND_CHECK**: Background check requirements
- **GEOGRAPHIC_RESTRICTION**: Geographic restrictions (states, regions)

Each requirement type has:
- A Zod schema for validation (`cdlClassCriteriaSchema`, etc.)
- A TypeScript type (`CDLClassCriteria`, etc.)
- Base schemas: `requiredCriteriaSchema` (required field mandatory) and `optionalRequiredCriteriaSchema` (required field optional)

#### 2. Evaluation Handlers (`handlers/`)

Each handler evaluates whether a user's response meets the requirement criteria:

```typescript
// Example: CDL Class Handler
export const evaluateCDLClass = (
  criteria: CDLClassCriteria,
  value: ConversationRequirementValue
): RequirementStatus => {
  // Validates user's CDL class against job requirements
  // Returns: MET, NOT_MET, or PENDING
};
```

The router (`handlers/router.ts`) maps requirement types to their handlers using a type-safe record:

```typescript
const criteriaRouter: CriteriaRouter = {
  [JobRequirementType.CDL_CLASS]: evaluateCDLClass,
  [JobRequirementType.YEARS_EXPERIENCE]: evaluateYearsExperience,
  // ... etc
};
```

#### 3. Parsers (`parser/`)

Extract structured data from user's natural language responses:

- **Text Extraction**: Converts free-form text to structured values
- **Type-Specific Parsing**: Each requirement type has its own parser
- **LLM-Assisted Parsing**: Uses LLM when simple keyword matching isn't sufficient

Example: `cdl-class/extract-value-from-text.ts` extracts CDL class from user messages like "I have a Class A license".

### Usage Flow

1. **Requirement Definition**: Job requirements are stored in `job_requirements` table with `criteria` as JSONB
2. **User Response**: User provides natural language response during conversation
3. **Parsing**: Parser extracts structured value from user's text
4. **Evaluation**: Handler evaluates extracted value against criteria
5. **Status Update**: Conversation requirement status updated to MET, NOT_MET, or PENDING

---

## Database Layer

The database layer follows a repository pattern with clear separation between entities and data access.

### Entity Structure

```
src/entities/
├── user/                      # User accounts
├── job/                       # Job postings
├── application/               # Job applications
├── conversation/              # Conversation sessions
├── message/                   # Individual messages in conversations
├── job-requirement/           # Job requirement definitions
├── conversation-job-requirement/  # User's responses to requirements
└── job-fact/                 # Job-specific facts/context
```

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
- Sender enum: `USER`, `ASSISTANT`, `SYSTEM`
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

## Handlers

Handlers orchestrate the conversation flow, managing prompts, LLM interactions, and state transitions.

### Prompting Handlers

Handlers responsible for generating prompts and sending messages to users.

#### 1. Greeting Initial Handler (`services/llm/greeting/initial-handler.ts`)

**Purpose**: Generates the initial greeting message when a conversation starts.

**Flow**:
1. Creates application and conversation (status: `PENDING`)
2. Builds greeting prompt with job context
3. Calls LLM to generate personalized greeting
4. Saves greeting as assistant message
5. Returns greeting text

**Key Methods**:
- `handleInitialGreeting(applicationId, jobId)`: Generates and saves initial greeting

#### 2. Greeting Response Handler (`services/llm/greeting/response-handler.ts`)

**Purpose**: Handles user's yes/no response to the initial greeting.

**Flow**:
1. Saves user's message
2. Parses yes/no response (keyword matching or LLM-assisted)
3. If "no": Updates conversation to `DENIED`, sends "good luck" message
4. If "yes": 
   - Creates top 3 conversation requirements (from job requirements)
   - Generates requirement introduction message
   - Updates conversation status to `START`
   - Returns introduction message

**Key Methods**:
- `handleResponse(conversationId, userMessage)`: Processes yes/no response

#### 3. Requirement Handler (`services/llm/requirement/handler.ts`)

**Purpose**: Processes user responses during requirement collection phase (`ON_REQ` status).

**Flow**:
1. **Message Receiver**: Validates and saves user message
2. **LLM Processor**: Processes message with LLM to extract structured data
3. **Evaluator**: Evaluates extracted value against requirement criteria
4. **State Router**: Determines next action based on evaluation result
   - If MET/NOT_MET: Move to next requirement or complete requirements
   - If PENDING: Ask follow-up question

**Key Methods**:
- `processRequirement(conversationId, userMessage)`: Main processing method

**Sub-modules**:
- `message-receiver.ts`: Receives and validates messages
- `llm-processor.ts`: LLM processing and parsing
- `evaluator.ts`: Criteria evaluation
- `state-router.ts`: State management and routing

#### 4. Job Questions Handler (`services/llm/job-questions/handler.ts`)

**Purpose**: Handles job-specific questions after requirements are met.

**Flow**:
1. Processes user responses to job-specific questions
2. Uses LLM to generate contextual questions
3. Manages question flow and completion

**Status**: `ON_JOB_QUESTIONS`

#### 5. Completion Handler (`services/llm/completion/handler.ts`)

**Purpose**: Generates final screening decision and summary.

**Flow**:
1. Evaluates all requirements
2. Generates screening decision (APPROVED/DENIED)
3. Creates screening summary
4. Updates conversation to `DONE` status

### Response Handling Handlers

Handlers that process responses and manage state transitions.

#### Sender Handlers (`services/sender/handler/`)

Orchestrate message sending and state updates:

- **`on-greeting.handler.ts`**: Handles initial greeting flow
- **`on-requirements.handler.ts`**: Handles requirement collection flow
- **`on-job-questions.handler.ts`**: Handles job questions flow
- **`on-completion.handler.ts`**: Handles completion flow

Each handler:
1. Calls appropriate LLM handler
2. Sends response to user via WebSocket
3. Updates conversation status
4. Manages state transitions

### LLM Client (`services/llm/client/`)

Abstracts LLM provider interactions:

- **Interface**: `LLMClient` with methods for chat completion and streaming
- **Factory**: `createLLMClient()` creates provider-specific clients
- **Providers**: Currently supports OpenAI
- **Streaming**: Supports real-time chunk delivery for WebSocket

### Prompt Building (`services/llm/processor/prompts/`)

Modular prompt construction:

- **`message-builders/`**: Builds different message types (introduction, requirements, context, etc.)
- **`prompt-context.ts`**: Builds conversation context for LLM
- **`question-prompt.ts`**: Builds question prompts

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
  type: 'greeting',
  conversationId: string,
  message: string
}

// Regular message
{
  type: 'message',
  conversationId: string,
  message: string
}

// Status update
{
  type: 'status_update',
  conversationId: string,
  status: ConversationStatus,
  message: string,
  conversationComplete?: boolean,  // When status is DONE
  screeningDecision?: string,      // When conversation complete
  screeningSummary?: string | null  // When conversation complete
}

// Error
{
  type: 'error',
  error: string
}

// Conversation end
{
  type: 'conversation_end',
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
8. **On completion**: Server sends `status_update` with `conversationComplete: true`, `screeningDecision`, and `screeningSummary`

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

### Separation of Concerns

- **Entities**: Domain models and database access (repository pattern)
- **Services**: Business logic and orchestration
- **Handlers**: LLM interaction and conversation flow
- **Routes**: HTTP endpoint definitions
- **Server**: WebSocket and HTTP server setup

### Type Safety

- Zod schemas for validation at boundaries
- TypeScript types throughout
- Enum types for status values

### Extensibility

- Criteria layer easily extended with new requirement types
- Handler pattern allows adding new conversation states
- LLM client abstraction supports multiple providers

### Data Integrity

- Foreign key constraints with cascade deletes
- UUIDv4 for all IDs
- PostgreSQL ENUMs for status values
- JSONB for flexible criteria storage

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
