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
    "jobName": "Truck Driver",
    "jobDescription": "Long-haul truck driver position requiring CDL license",
    "jobLocation": "Los Angeles, CA",
    "isActive": true
  },
  {
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

### 4. Get Conversation Summary

Get the screening decision status for a specific application.

**Endpoint:** `GET /conversation-summary/:applicationId`

**Path Parameters:**
- `applicationId` (UUID v4) - The application ID

**Response:** `200 OK`
```json
{
  "summaryStatus": "Approved"
}
```

**Summary Status Values:**
- `"Approved"` - Application approved
- `"Denied"` - Application denied
- `"Pending"` - Application pending review
- `"Canceled"` - Application canceled by user

**Error Responses:**
- `400 Bad Request` - Invalid application ID format (must be UUID v4)
- `404 Not Found` - Conversation not found for this application
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X GET http://localhost:3000/conversation-summary/123e4567-e89b-4d3a-a456-426614174000
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

For real-time chat functionality, the API also supports WebSocket connections. WebSocket documentation will be provided separately as it's primarily used for the chat orchestration feature.

---

## Support

For questions or issues, please contact the backend team.
