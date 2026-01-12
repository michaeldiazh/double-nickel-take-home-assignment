import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { pool } from '../database';
import { createLLMClient, LLMProvider } from '../services/llm/client/factory';
import { ApplicationService } from '../services/application/service';
import { GreetingInitialHandler } from '../services/llm/greeting/initial-handler';
import { GreetingResponseHandler } from '../services/llm/greeting/response-handler';
import { RequirementHandler } from '../services/llm/requirement/handler';
import { JobQuestionsHandler } from '../services/llm/job-questions/handler';
import { CompletionHandler } from '../services/llm/completion/handler';
import { ConversationRepository } from '../entities/conversation/repository';
import { ConversationJobRequirementRepository } from '../entities/conversation-job-requirement/repository';
import { ConversationStatus } from '../entities/conversation/domain';
import {
  handleInitialConversation,
  handlePendingResponse,
  handleRequirementsResponse,
  handleJobQuestionsResponse,
  handleDoneConversation,
} from '../services/sender/handler';

/**
 * WebSocket message types
 */
interface StartConversationMessage {
  type: 'start_conversation';
  userId: string;
  jobId: string;
}

interface SendMessageMessage {
  type: 'send_message';
  conversationId: string;
  message: string;
}

interface EndConversationMessage {
  type: 'end_conversation';
  conversationId: string;
}

type ClientMessage = StartConversationMessage | SendMessageMessage | EndConversationMessage;

interface ServerMessage {
  type: 'greeting' | 'message' | 'error' | 'status_update' | 'conversation_end';
  conversationId?: string;
  message?: string;
  status?: ConversationStatus;
  error?: string;
}

/**
 * WebSocket handler for LLM chat
 */
export class ChatWebSocketServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private applicationService: ApplicationService;
  private greetingInitialHandler: GreetingInitialHandler;
  private greetingResponseHandler: GreetingResponseHandler;
  private requirementHandler: RequirementHandler;
  private jobQuestionsHandler: JobQuestionsHandler;
  private completionHandler: CompletionHandler;
  private conversationRepo: ConversationRepository;
  private conversationJobRequirementRepo: ConversationJobRequirementRepository;

  constructor(port: number = 3000) {
    // Initialize Express app
    this.app = express();
    this.app.use(express.json());

    // Create HTTP server
    this.server = createServer(this.app);

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    // Initialize services and handlers
    const llmClient = createLLMClient({
      provider: LLMProvider.OPENAI,
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    });

    this.applicationService = new ApplicationService(pool);
    this.greetingInitialHandler = new GreetingInitialHandler(pool, llmClient);
    this.greetingResponseHandler = new GreetingResponseHandler(pool, llmClient);
    this.requirementHandler = new RequirementHandler(pool, llmClient);
    this.jobQuestionsHandler = new JobQuestionsHandler(pool, llmClient);
    this.completionHandler = new CompletionHandler(pool, llmClient);
    this.conversationRepo = new ConversationRepository(pool);
    this.conversationJobRequirementRepo = new ConversationJobRequirementRepository(pool);

    // Setup WebSocket connection handling
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start server
    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log(`WebSocket server ready on ws://localhost:${port}`);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      try {
        const rawMessage = data.toString();
        if (!rawMessage || rawMessage.trim().length === 0) {
          console.warn('Received empty message');
          return;
        }

        const parsed = JSON.parse(rawMessage);
        
        // Check if this is a server message (has 'event' field) - ignore it
        if ('event' in parsed && !('type' in parsed)) {
          // This is a server message being echoed back, ignore it
          return;
        }

        // Validate it has a type field
        if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
          console.warn('Received message without type field:', parsed);
          this.sendError(ws, 'Message must have a type field');
          return;
        }

        const message: ClientMessage = parsed as ClientMessage;
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    switch (message.type) {
      case 'start_conversation':
        await this.handleStartConversation(ws, message.userId, message.jobId);
        break;
      case 'send_message':
        await this.handleSendMessage(ws, message.conversationId, message.message);
        break;
      case 'end_conversation':
        await this.handleEndConversation(ws, message.conversationId);
        break;
      default:
        const messageType = (message as any).type ?? 'undefined';
        console.warn(`Unknown message type: ${messageType}`, message);
        this.sendError(ws, `Unknown message type: ${messageType}`);
    }
  }

  /**
   * Handle start conversation - create application and conversation, send initial greeting
   */
  private async handleStartConversation(ws: WebSocket, userId: string, jobId: string): Promise<void> {
    try {
      const result = await handleInitialConversation(ws, userId, jobId, {
        applicationService: this.applicationService,
        greetingInitialHandler: this.greetingInitialHandler,
      });

      // Send status update after greeting completes
      this.sendMessage(ws, {
        type: 'status_update',
        conversationId: result.conversationId,
        status: result.newStatus,
      });
    } catch (error) {
      console.error('Error in handleStartConversation:', error);
      this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle send message - route to appropriate handler based on conversation status
   */
  private async handleSendMessage(ws: WebSocket, conversationId: string, userMessage: string): Promise<void> {
    try {
      // Get conversation to check status
      const conversation = await this.conversationRepo.getById(conversationId);
      if (!conversation) {
        this.sendError(ws, `Conversation ${conversationId} not found`);
        return;
      }

      // Create stream options for WebSocket
      const streamOptions = {
        onChunk: (chunk: string) => {
          this.sendMessage(ws, {
            type: 'message',
            conversationId,
            message: chunk,
          });
        },
        onComplete: () => {
          // Optional: send completion signal
        },
        onError: (error: Error) => {
          this.sendError(ws, error.message);
        },
      };

      // Route to appropriate handler based on conversation status
      let result;
      switch (conversation.conversation_status) {
        case ConversationStatus.PENDING:
          // User responding to initial greeting (yes/no)
          result = await handlePendingResponse(ws, conversationId, userMessage, {
            greetingResponseHandler: this.greetingResponseHandler,
            conversationRepo: this.conversationRepo,
          });
          break;
        case ConversationStatus.START:
          // START is a transient state - route to requirements handler
          // (shouldn't happen if GreetingResponseHandler sets ON_REQ, but handle it just in case)
          result = await handleRequirementsResponse(ws, conversationId, userMessage, {
            requirementHandler: this.requirementHandler,
            conversationRepo: this.conversationRepo,
            conversationJobRequirementRepo: this.conversationJobRequirementRepo,
          });
          break;
        case ConversationStatus.ON_REQ:
          // Handle requirement question response
          result = await handleRequirementsResponse(ws, conversationId, userMessage, {
            requirementHandler: this.requirementHandler,
            conversationRepo: this.conversationRepo,
            conversationJobRequirementRepo: this.conversationJobRequirementRepo,
          });
          break;
        case ConversationStatus.ON_JOB_QUESTIONS:
          // Handle job question
          result = await handleJobQuestionsResponse(ws, conversationId, userMessage, {
            jobQuestionsHandler: this.jobQuestionsHandler,
            completionHandler: this.completionHandler,
            conversationRepo: this.conversationRepo,
          });
          break;
        case ConversationStatus.DONE:
          // Conversation is done - send completion message
          result = await handleDoneConversation(ws, conversationId, {
            completionHandler: this.completionHandler,
          });
          break;
        default:
          this.sendError(ws, `Unknown conversation status: ${conversation.conversation_status}`);
          return;
      }

      // Send status update if status changed
      if (result) {
        this.sendMessage(ws, {
          type: 'status_update',
          conversationId,
          status: result.newStatus,
        });

        // Send conversation end if status is DONE
        if (result.newStatus === ConversationStatus.DONE) {
          this.sendMessage(ws, {
            type: 'conversation_end',
            conversationId,
            message: result.message,
            status: ConversationStatus.DONE,
          });
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
  }



  /**
   * Handle end conversation
   */
  private async handleEndConversation(ws: WebSocket, conversationId: string): Promise<void> {
    // Close connection or send confirmation
    this.sendMessage(ws, {
      type: 'conversation_end',
      conversationId,
      message: 'Conversation ended',
    });
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      error,
    });
  }

  /**
   * Gracefully shutdown server
   */
  async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close(() => {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new ChatWebSocketServer(port);
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await server.shutdown();
    process.exit(0);
  });
}
