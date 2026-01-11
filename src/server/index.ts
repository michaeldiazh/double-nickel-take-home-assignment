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
import { ConversationStatus } from '../entities/conversation/domain';

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
        const message: ClientMessage = JSON.parse(data.toString());
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
        this.sendError(ws, `Unknown message type: ${(message as any).type}`);
    }
  }

  /**
   * Handle start conversation - create application and conversation, send initial greeting
   */
  private async handleStartConversation(ws: WebSocket, userId: string, jobId: string): Promise<void> {
    try {
      // 1. Create application and conversation (status PENDING)
      const { applicationId, conversationId } = await this.applicationService.createApplication({
        user_id: userId,
        job_id: jobId,
      });

      // 2. Send initial greeting if status is PENDING
      const streamOptions = {
        onChunk: (chunk: string) => {
          this.sendMessage(ws, {
            type: 'greeting',
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

      const greeting = await this.greetingInitialHandler.sendInitialGreeting(conversationId, streamOptions);

      // Send status update after streaming completes (message content already sent via chunks)
      this.sendMessage(ws, {
        type: 'status_update',
        conversationId,
        status: ConversationStatus.PENDING,
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
      switch (conversation.conversation_status) {
        case ConversationStatus.PENDING:
          // User responding to initial greeting (yes/no)
          await this.handleStartStatus(ws, conversationId, userMessage, streamOptions);
          break;
        case ConversationStatus.START:
          // START status is set briefly after user accepts, then moves to ON_REQ
          // Route to requirement handler
          await this.handleOnReqStatus(ws, conversationId, userMessage, streamOptions);
          break;
        case ConversationStatus.ON_REQ:
          // Handle requirement question response
          await this.handleOnReqStatus(ws, conversationId, userMessage, streamOptions);
          break;
        case ConversationStatus.ON_JOB_QUESTIONS:
          // Handle job question
          await this.handleOnJobQuestionsStatus(ws, conversationId, userMessage, streamOptions);
          break;
        case ConversationStatus.DONE:
          // Conversation is done - send completion message if needed
          await this.handleDoneStatus(ws, conversationId, streamOptions);
          break;
        default:
          this.sendError(ws, `Unknown conversation status: ${conversation.conversation_status}`);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
  }


  /**
   * Handle PENDING/START status - user responded to greeting (yes/no)
   * GreetingResponseHandler handles both PENDING and START statuses
   */
  private async handleStartStatus(ws: WebSocket, conversationId: string, userMessage: string, streamOptions: any): Promise<void> {
    const result = await this.greetingResponseHandler.handleResponse(conversationId, userMessage, streamOptions);
    
    // result.status is 'DENIED' or 'START'
    // If DENIED, conversation status is DONE
    // If START, we move to ON_REQ (requirement handler sets this)
    const newStatus = result.status === 'DENIED' ? ConversationStatus.DONE : ConversationStatus.ON_REQ;
    
    // Send status update after streaming completes (message content already sent via chunks)
    this.sendMessage(ws, {
      type: 'status_update',
      conversationId,
      status: newStatus,
    });
  }

  /**
   * Handle ON_REQ status - handle requirement question response
   */
  private async handleOnReqStatus(ws: WebSocket, conversationId: string, userMessage: string, streamOptions: any): Promise<void> {
    const result = await this.requirementHandler.handleRequirementResponse(conversationId, userMessage, streamOptions);
    
    // Send status update after streaming completes (message content already sent via chunks)
    this.sendMessage(ws, {
      type: 'status_update',
      conversationId,
      status: result.newStatus,
    });
  }

  /**
   * Handle ON_JOB_QUESTIONS status - handle job question
   */
  private async handleOnJobQuestionsStatus(ws: WebSocket, conversationId: string, userMessage: string, streamOptions: any): Promise<void> {
    const result = await this.jobQuestionsHandler.handleJobQuestion(conversationId, userMessage, streamOptions);
    
    // Send status update after streaming completes (message content already sent via chunks)
    this.sendMessage(ws, {
      type: 'status_update',
      conversationId,
      status: result.newStatus,
    });
  }

  /**
   * Handle DONE status - send completion message
   */
  private async handleDoneStatus(ws: WebSocket, conversationId: string, streamOptions: any): Promise<void> {
    const completionMessage = await this.completionHandler.sendCompletionMessage(conversationId, streamOptions);
    
    this.sendMessage(ws, {
      type: 'conversation_end',
      conversationId,
      message: completionMessage,
      status: ConversationStatus.DONE,
    });
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
