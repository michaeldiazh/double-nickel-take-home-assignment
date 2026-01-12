
# Double Nickel Take Home Challenge - Backend

Backend server for the Double Nickel recruiting assistant chatbot. Built with TypeScript, Express, WebSocket, and PostgreSQL.

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v14+ recommended)
- npm or yarn

## Database Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE double_nickel;

# Create user (optional, or use existing postgres user)
CREATE USER double_nickel_user WITH PASSWORD 'your_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE double_nickel TO double_nickel_user;

# Exit psql
\q
```

### 3. Run Schema

```bash
# Connect to your database
psql -d double_nickel

# Or if using a specific user:
psql -U double_nickel_user -d double_nickel

# Run the schema script
\i misc/schema-simple.sql

# Or from command line:
psql -d double_nickel -f misc/schema-simple.sql
```

### 4. Load Mock Data (Optional)

```bash
# Connect to database
psql -d double_nickel

# Run mock data script
\i misc/mock-data.sql

# Or from command line:
psql -d double_nickel -f misc/mock-data.sql
```

### 5. Delete Test Application (If Needed)

If you get a unique constraint error when testing `start_conversation` (because the application already exists in mock data):

```bash
# Delete the test application and conversation
psql -d double_nickel -f misc/delete-test-application.sql

# Or from psql:
# \i misc/delete-test-application.sql
```

This will delete the application for user `11111111-1111-4111-8111-111111111111` and job `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, allowing you to test the `start_conversation` endpoint again.

### 6. Reset Database (If Needed)

If you need to completely reset the database:

```bash
# Connect to database
psql -d double_nickel

# Run drop script (drops all tables, functions, types)
\i misc/drop-schema.sql

# Then rerun schema-simple.sql and mock-data.sql
\i misc/schema-simple.sql
\i misc/mock-data.sql
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
read_file

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=double_nickel
DB_USER=postgres
DB_PASSWORD=your_password

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Server Configuration
PORT=3000
```

**Note:** Copy `.env.example` to `.env` and fill in your values.

## Installation

```bash
# Install dependencies
npm install
```

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

This will:
- Watch for file changes
- Restart the server automatically
- Start the WebSocket server on port 3000 (or PORT from .env)

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Type Checking

```bash
npm run typecheck
```

### Testing

```bash
npm test
```

## WebSocket Server

The server starts a WebSocket server on `ws://localhost:3000` (or the PORT specified in `.env`).

### Connection

Connect to: `ws://localhost:3000`

### Message Protocol

#### Client Messages

**Start Conversation:**
```json
{
  "type": "start_conversation",
  "userId": "11111111-1111-4111-8111-111111111111",
  "jobId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

**Send Message:**
```json
{
  "type": "send_message",
  "conversationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "message": "Yes, I have a Class A CDL"
}
```

**End Conversation:**
```json
{
  "type": "end_conversation",
  "conversationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
}
```

#### Server Messages

**Greeting:**
```json
{
  "type": "greeting",
  "conversationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "message": "Hi John! Thanks for your interest...",
  "status": "PENDING"
}
```

**Message:**
```json
{
  "type": "message",
  "conversationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "message": "Do you have a valid Class A CDL?",
  "status": "ON_REQ"
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Conversation not found"
}
```

**Conversation End:**
```json
{
  "type": "conversation_end",
  "conversationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "message": "Thank you. A recruiter will be in touch.",
  "status": "DONE"
}
```

### Conversation Flow

1. **Client sends `start_conversation`** with `userId` and `jobId`
   - Server creates application and conversation (PENDING status)
   - Server sends initial greeting

2. **Client sends `send_message`** with yes/no response
   - Server processes response (accept/decline)
   - If accepted: Creates requirements, sends first question (ON_REQ status)
   - If declined: Sends good luck message (DONE status)

3. **Client sends `send_message`** with answers to requirements
   - Server processes requirement responses
   - Moves through requirements until all completed
   - Transitions to ON_JOB_QUESTIONS when all requirements met

4. **Client sends `send_message`** with job questions
   - Server answers questions using job facts
   - Continues until conversation ends

5. **Conversation completes** → Status: DONE

## Testing with Mock Data

The mock data includes:
- 5 users (John Smith, Maria Garcia, Robert Johnson, Jennifer Williams, Michael Brown)
- 4 jobs (Regional CDL-A, Local Class B, OTR Flatbed, Dedicated Refrigerated)
- 5 applications
- 5 conversations (various statuses)

You can use these IDs to test the WebSocket flow:

**Example: Start conversation for John Smith:**
```json
{
  "type": "start_conversation",
  "userId": "11111111-1111-4111-8111-111111111111",
  "jobId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

## Testing with Python CLI Client

A Python CLI client is provided for testing the WebSocket server. This client allows you to interact with the chatbot from the command line.

### Prerequisites

Install the required Python package:

```bash
pip install websockets
```

### Usage

The client requires `--user-id` and `--job-id` arguments:

```bash
# Run with required user and job IDs
python websocket_client.py \
  --user-id 11111111-1111-4111-8111-111111111111 \
  --job-id aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

# Run with custom server URI
python websocket_client.py \
  --uri ws://localhost:3000 \
  --user-id 11111111-1111-4111-8111-111111111111 \
  --job-id aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
```

### Commands

- `/quit` or `/exit` - Exit the client
- `/end` - End the conversation
- `/help` - Show help message
- Any other text - Send as a message

### Features

- **Streaming support**: Displays LLM responses in real-time as they stream
- **Interactive chat**: Type messages and receive responses
- **Status tracking**: Shows conversation status updates
- **Error handling**: Displays errors clearly
- **Command support**: Special commands for controlling the client

### Example Session

```
$ python websocket_client.py --user-id abc123 --job-id job456

============================================================
Double Nickel Chat Client
============================================================

Commands:
  /quit or /exit - Exit the client
  /end - End the conversation
  /help - Show this help message
  Any other text - Send as a message

============================================================

→ Assistant: Hello John! 🚚 Welcome and thank you for applying...

[Status: PENDING]

📤 You: Yes, I'd like to continue
→ Assistant: Great! Do you have a valid Class A CDL?

[Status: ON_REQ]

📤 You: Yes, I have my Class A CDL
→ Assistant: Excellent! How many years of truck driving experience...

[Status: ON_REQ]

👋 Goodbye!
✓ Disconnected from server
```

## Project Structure

```
src/
├── entities/          # Database entities (users, jobs, conversations, etc.)
├── services/          # Business logic services
│   ├── application/   # Application creation service
│   ├── conversation-context/  # Conversation context loading
│   ├── criteria/      # Criteria parsing and evaluation
│   ├── llm/          # LLM handlers and processors
│   │   ├── greeting/ # Initial greeting handlers
│   │   ├── requirement/  # Requirement question handlers
│   │   ├── job-questions/  # Job question handlers
│   │   └── completion/  # Completion handlers
│   └── filters/      # Database query filters
├── database/         # Database connection
├── server/           # WebSocket server
└── index.ts          # Entry point

misc/
├── schema-simple.sql    # Database schema
├── drop-schema.sql      # Drop script
└── mock-data.sql        # Mock data
```

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Verify credentials in `.env` file
- Test connection: `psql -d double_nickel -U postgres`

### WebSocket Connection Issues

- Ensure server is running on the correct port
- Check firewall settings
- Verify WebSocket URL: `ws://localhost:3000` (not `http://`)

### Missing Environment Variables

- Ensure `.env` file exists in root directory
- Check all required variables are set (DB_*, OPENAI_API_KEY, PORT)

## License

ISC
