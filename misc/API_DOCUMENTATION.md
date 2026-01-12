# API Documentation

## Overview

This API provides endpoints for user management, job listings, and conversation summaries. For this POC (Proof of Concept), we focused on **chat orchestration** to enable real-time conversations between users and the system.

**Note:** Filtering capabilities will be added in a future iteration. Currently, endpoints return all available data without filtering options.

---

## Base URL

```
http://localhost:<PORT>
```

Replace `<PORT>` with your configured server port (typically `3000` or as configured in your environment).

---

## Authentication

Currently, authentication is simplified for the POC. The `/user/login` endpoint validates user credentials but does not return authentication tokens. Future iterations will include proper JWT or session-based authentication.

---

## Endpoints

### 1. Create User

Create a new user account.

**Endpoint:** `POST /user`

**Request Body:**
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

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-4d3a-a456-426614174000",
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

**Note:** For new users, `jobApplications` will be an empty array. For existing users with applications, each item in `jobApplications` includes:
- `applicationId` - UUID of the application (used for deletion)
- `jobId` - UUID of the job (used to restart/redo application)
- `jobName` - Name of the job
- `jobDescription` - Description of the job
- `jobLocation` - Location of the job
- `screeningDecision` - Current screening decision (see values below)

**Error Responses:**
- `400 Bad Request` - Invalid request body (validation errors)
- `409 Conflict` - User with this email already exists
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "aptNum": "Apt 4B",
    "state": "CA",
    "zipCode": "90210"
  }'
```

---

### 2. User Login

Authenticate a user and retrieve their profile with job applications.

**Endpoint:** `POST /user/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-4d3a-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "address": "123 Main St",
  "aptNum": "Apt 4B",
  "state": "CA",
  "zipCode": "90210",
  "jobApplications": [
    {
      "applicationId": "123e4567-e89b-4d3a-a456-426614174001",
      "jobId": "123e4567-e89b-4d3a-a456-426614174002",
      "jobName": "Truck Driver",
      "jobDescription": "Long-haul truck driver position",
      "jobLocation": "Los Angeles, CA",
      "screeningDecision": "Pending"
    }
  ]
}
```

**Screening Decision Values:**
- `"Approved"` - Application approved
- `"Denied"` - Application denied
- `"Pending"` - Application pending review
- `"Canceled"` - Application canceled by user

**Error Responses:**
- `400 Bad Request` - Invalid request body (validation errors)
- `401 Unauthorized` - Invalid email or password
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

---

### 3. Get All Jobs

Retrieve all available jobs, ordered by creation date (oldest first).

**Endpoint:** `GET /jobs`

**Response:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-4d3a-a456-426614174000",
    "jobName": "Truck Driver",
    "jobDescription": "Long-haul truck driver position requiring CDL license",
    "jobLocation": "Los Angeles, CA",
    "isActive": true
  },
  {
    "id": "123e4567-e89b-4d3a-a456-426614174001",
    "jobName": "Delivery Driver",
    "jobDescription": "Local delivery driver position",
    "jobLocation": "San Francisco, CA",
    "isActive": true
  }
]
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X GET http://localhost:3000/jobs
```

**Note:** Filtering by location, job type, or other criteria will be added in a future iteration.

---

### 4. Delete Application

Delete an application and all associated data (conversation, messages, etc.). This is useful for allowing users to redo an application.

**Endpoint:** `DELETE /application/:applicationId`

**Path Parameters:**
- `applicationId` (UUID v4) - The application ID to delete

**Response:** `200 OK`
```json
{
  "message": "Application deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid application ID format (must be UUID v4)
- `404 Not Found` - Application not found
- `500 Internal Server Error` - Server error

**Note:** Deleting an application will cascade delete:
- The associated conversation
- All messages in that conversation
- All conversation job requirements
- All related data

**Example:**
```bash
curl -X DELETE http://localhost:3000/application/123e4567-e89b-4d3a-a456-426614174000
```

---

### 5. Download Conversation Messages

Download all messages from a conversation as a text file.

**Endpoint:** `GET /conversation-summary/:applicationId/messages`

**Path Parameters:**
- `applicationId` (UUID v4) - The application ID

**Response:** `200 OK`
- **Content-Type:** `text/plain`
- **Content-Disposition:** `attachment; filename="<first_name>_<last_name>_<application-id>.txt"`

**Response Body:** Plain text file with formatted messages
```
[2024-01-15T10:30:00.000Z] User: Hello, I'm interested in applying for this position.

[2024-01-15T10:30:15.000Z] Assistant: Great! I'd be happy to help you with your application. Let me start by asking you a few questions.

[2024-01-15T10:30:30.000Z] User: Sure, go ahead.
```

**Filename Format:**
- Format: `<first_name>_<last_name>_<application-id>.txt`
- Special characters in names are replaced with underscores
- Example: `John_Doe_123e4567-e89b-4d3a-a456-426614174000.txt`

**Error Responses:**
- `400 Bad Request` - Invalid application ID format (must be UUID v4)
- `404 Not Found` - Application or conversation not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X GET http://localhost:3000/conversation-summary/123e4567-e89b-4d3a-a456-426614174000/messages \
  --output conversation.txt
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Validation error message"
    }
  ]
}
```

The `details` field is only included for validation errors (400 Bad Request).

---

## Data Types

### UUID v4
All IDs are UUID v4 format: `123e4567-e89b-4d3a-a456-426614174000`

### Email
Email addresses must be valid email format.

### Screening Decision
Enum values: `"Approved"`, `"Denied"`, `"Pending"`, `"Canceled"`

---

## Future Enhancements

The following features are planned for future iterations:

1. **Filtering** - Add query parameters to filter jobs by location, job type, etc.
2. **Pagination** - Add pagination support for large result sets
3. **Authentication Tokens** - Implement proper JWT or session-based authentication
4. **Rate Limiting** - Add rate limiting to prevent abuse
5. **Search** - Add search functionality for jobs and applications

---

## WebSocket API

For real-time chat functionality, the API also supports WebSocket connections. When a conversation is completed (status becomes `DONE`), the WebSocket will send a `status_update` message with the following additional fields:

**Completion Message Format:**
```json
{
  "type": "status_update",
  "conversationId": "123e4567-e89b-4d3a-a456-426614174000",
  "status": "DONE",
  "conversationComplete": true,
  "screeningDecision": "APPROVED",
  "screeningSummary": "Candidate meets all requirements. Approved for position."
}
```

**Fields:**
- `conversationComplete` (boolean) - `true` when the conversation is finished
- `screeningDecision` (string) - One of: `"APPROVED"`, `"DENIED"`, `"PENDING"`, `"USER_CANCELED"`
- `screeningSummary` (string | null) - Summary text explaining the decision, or `null` if not available

**Note:** The frontend should listen for `conversationComplete: true` in WebSocket messages to trigger navigation to the summary page. The screening decision and summary are included in the completion message, so no additional API call is needed.

### Pause and Resume Conversation

The WebSocket API supports pausing and resuming conversations:

**Pause Conversation:**
```json
{
  "type": "pause_conversation",
  "conversationId": "123e4567-e89b-4d3a-a456-426614174000"
}
```

**Response:**
```json
{
  "type": "conversation_paused",
  "conversationId": "123e4567-e89b-4d3a-a456-426614174000",
  "status": "ON_REQ",
  "message": "Conversation paused"
}
```

**Continue Conversation:**
```json
{
  "type": "continue_conversation",
  "conversationId": "123e4567-e89b-4d3a-a456-426614174000"
}
```

**Response:**
```json
{
  "type": "conversation_resumed",
  "conversationId": "123e4567-e89b-4d3a-a456-426614174000",
  "status": "ON_REQ",
  "message": "Conversation resumed"
}
```

**Note:** When pausing, the conversation status remains unchanged (e.g., `ON_REQ` if there are pending requirements). When resuming, the conversation continues from where it left off. The frontend can continue sending `send_message` events after resuming.

---

## Support

For questions or issues, please contact the backend team.
