import 'dotenv/config';
import express from 'express';
import {createServer} from 'http';
import {WebSocketServer, WebSocket} from 'ws';
import {Pool} from 'pg';
import {pool} from '../database';
import {createLLMClient, LLMProvider} from '../services/llm/client/factory';
import {ApplicationService} from '../services/application/service';
import {GreetingInitialHandler} from '../services/llm/greeting/initial-handler';
import {GreetingResponseHandler} from '../services/llm/greeting/response-handler';
import {RequirementHandler} from '../services/llm/requirement/handler';
import {JobQuestionsHandler} from '../services/llm/job-questions/handler';
import {CompletionHandler} from '../services/llm/completion/handler';
import {ConversationRepository} from '../entities/conversation/repository';
import {ConversationJobRequirementRepository} from '../entities/conversation-job-requirement/repository';
import {ConversationStatus} from '../entities/conversation/domain';
import {
    handleInitialConversation,
    handlePendingResponse,
    handleRequirementsResponse,
    handleJobQuestionsResponse,
    handleDoneConversation,
} from '../services/sender/handler';
import {ConversationContextService} from '../services/conversation-context/service';
import {createUserRoutes} from './routes/user.routes';
import {createJobRoutes} from './routes/job.routes';
import {createApplicationRoutes} from './routes/application.routes';
import {createConversationSummaryRoutes} from './routes/conversation-summary.routes';

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

interface PauseConversationMessage {
    type: 'pause_conversation';
    conversationId: string;
}

interface ContinueConversationMessage {
    type: 'continue_conversation';
    conversationId: string;
}

type ClientMessage = StartConversationMessage | SendMessageMessage | EndConversationMessage | PauseConversationMessage | ContinueConversationMessage;

interface ServerMessage {
    type: 'greeting' | 'message' | 'error' | 'status_update' | 'conversation_end' | 'conversation_paused' | 'conversation_resumed';
    conversationId?: string;
    message?: string;
    status?: ConversationStatus;
    error?: string;
    // Include conversation completion data when status is DONE
    screeningDecision?: string;
    screeningSummary?: string | null;
    conversationComplete?: boolean;
}

/**
 * Server dependencies - all services and handlers needed by the server
 */
interface ServerDependencies {
    applicationService: ApplicationService;
    greetingInitialHandler: GreetingInitialHandler;
    greetingResponseHandler: GreetingResponseHandler;
    requirementHandler: RequirementHandler;
    jobQuestionsHandler: JobQuestionsHandler;
    completionHandler: CompletionHandler;
    conversationRepo: ConversationRepository;
    conversationJobRequirementRepo: ConversationJobRequirementRepository;
    conversationContextService: ConversationContextService;
}

/**
 * Parses and validates a raw WebSocket message.
 * 
 * @param rawMessage - The raw message string from WebSocket
 * @returns Parsed and validated ClientMessage, or null if invalid
 */
const parseClientMessage = (rawMessage: string): ClientMessage | null => {
    if (!rawMessage || rawMessage.trim().length === 0) {
        console.warn('Received empty message');
        return null;
    }

    try {
        const parsed = JSON.parse(rawMessage);

        // Check if this is a server message (has 'event' field) - ignore it
        if ('event' in parsed && !('type' in parsed)) {
            // This is a server message being echoed back, ignore it
            return null;
        }

        // Validate it has a type field
        if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
            console.warn('Received message without type field:', parsed);
            return null;
        }

        return parsed as ClientMessage;
    } catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
};

/**
 * Sends a message to the WebSocket client if the connection is open.
 * 
 * @param ws - The WebSocket connection
 * @param message - The message to send
 */
const sendMessage = (ws: WebSocket, message: ServerMessage): void => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
};

/**
 * Sends an error message to the WebSocket client.
 * 
 * @param ws - The WebSocket connection
 * @param error - The error message
 */
const sendError = (ws: WebSocket, error: string): void => {
    sendMessage(ws, {
        type: 'error',
        error,
    });
};

/**
 * Initializes all server dependencies (services and handlers).
 * 
 * @returns Initialized dependencies
 */
const initializeDependencies = (): ServerDependencies => {
    const llmClient = createLLMClient({
        provider: LLMProvider.OPENAI,
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || ''
    });

    return {
        applicationService: new ApplicationService(pool),
        greetingInitialHandler: new GreetingInitialHandler(pool, llmClient),
        greetingResponseHandler: new GreetingResponseHandler(pool, llmClient),
        requirementHandler: new RequirementHandler(pool, llmClient),
        jobQuestionsHandler: new JobQuestionsHandler(pool, llmClient),
        completionHandler: new CompletionHandler(pool, llmClient),
        conversationRepo: new ConversationRepository(pool),
        conversationJobRequirementRepo: new ConversationJobRequirementRepository(pool),
        conversationContextService: new ConversationContextService(pool),
    };
};

/**
 * Handles the start_conversation message type.
 * 
 * @param ws - The WebSocket connection
 * @param userId - The user ID
 * @param jobId - The job ID
 * @param deps - Server dependencies
 */
const handleStartConversation = async (
    ws: WebSocket,
    userId: string,
    jobId: string,
    deps: ServerDependencies
): Promise<void> => {
    try {
        const result = await handleInitialConversation(ws, userId, jobId, {
            applicationService: deps.applicationService,
            greetingInitialHandler: deps.greetingInitialHandler
        });

        // Track conversationId on this WebSocket connection for disconnect handling
        (ws as any).conversationId = result.conversationId;

        // Send status update after greeting completes
        sendMessage(ws, {
            type: 'status_update',
            conversationId: result.conversationId,
            status: result.newStatus,
        });
    } catch (error) {
        console.error('Error in handleStartConversation:', error);
        sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
};

/**
 * Status handler function type - handles messages for a specific conversation status
 */
type StatusHandler = (
    ws: WebSocket,
    conversationId: string,
    userMessage: string,
    deps: ServerDependencies
) => Promise<{ newStatus: ConversationStatus; message: string } | undefined>;

/**
 * Creates a status handler map that routes messages based on conversation status.
 * 
 * @param deps - Server dependencies
 * @returns Record mapping ConversationStatus to handler functions
 */
const createStatusHandlerMap = (deps: ServerDependencies): Partial<Record<ConversationStatus, StatusHandler>> => ({
    [ConversationStatus.PENDING]: async (ws, conversationId, userMessage) => {
        // User responding to initial greeting (yes/no)
        return await handlePendingResponse(ws, conversationId, userMessage, {
            greetingResponseHandler: deps.greetingResponseHandler,
            conversationRepo: deps.conversationRepo,
        });
    },
    [ConversationStatus.START]: async (ws, conversationId, userMessage) => {
        // START is a transient state - route to requirements handler
        // (shouldn't happen if GreetingResponseHandler sets ON_REQ, but handle it just in case)
        return await handleRequirementsResponse(ws, conversationId, userMessage, {
            requirementHandler: deps.requirementHandler,
            completionHandler: deps.completionHandler,
            conversationRepo: deps.conversationRepo,
            conversationJobRequirementRepo: deps.conversationJobRequirementRepo,
        });
    },
    [ConversationStatus.ON_REQ]: async (ws, conversationId, userMessage) => {
        // Handle requirement question response
        return await handleRequirementsResponse(ws, conversationId, userMessage, {
            requirementHandler: deps.requirementHandler,
            completionHandler: deps.completionHandler,
            conversationRepo: deps.conversationRepo,
            conversationJobRequirementRepo: deps.conversationJobRequirementRepo,
        });
    },
    [ConversationStatus.ON_JOB_QUESTIONS]: async (ws, conversationId, userMessage) => {
        // Handle job question
        return await handleJobQuestionsResponse(ws, conversationId, userMessage, {
            jobQuestionsHandler: deps.jobQuestionsHandler,
            completionHandler: deps.completionHandler,
            conversationRepo: deps.conversationRepo,
        });
    },
    [ConversationStatus.DONE]: async (ws, conversationId) => {
        // Conversation is done - send completion message
        // Note: DONE handler doesn't use userMessage, but we include it for type consistency
        return await handleDoneConversation(ws, conversationId, {
            completionHandler: deps.completionHandler,
        });
    },
});

/**
 * Routes a send_message to the appropriate handler based on conversation status.
 * 
 * @param ws - The WebSocket connection
 * @param conversationId - The conversation ID
 * @param userMessage - The user's message
 * @param deps - Server dependencies
 */
const routeSendMessage = async (
    ws: WebSocket,
    conversationId: string,
    userMessage: string,
    deps: ServerDependencies
): Promise<void> => {
    try {
        // Track conversationId on this WebSocket connection for disconnect handling
        (ws as any).conversationId = conversationId;

        // Get conversation to check status
        const conversation = await deps.conversationRepo.getById(conversationId);
        if (!conversation) {
            sendError(ws, `Conversation ${conversationId} not found`);
            return;
        }

        // Get handler for this status
        const statusHandlerMap = createStatusHandlerMap(deps);
        const handler = statusHandlerMap[conversation.conversation_status];

        if (!handler) {
            sendError(ws, `Unknown conversation status: ${conversation.conversation_status}`);
            return;
        }

        // Execute handler
        const result = await handler(ws, conversationId, userMessage, deps);

        // Send status update if status changed
        if (result) {
            const statusUpdateMessage: ServerMessage = {
                type: 'status_update',
                conversationId,
                status: result.newStatus,
            };

            // If conversation is complete, include screening decision and summary
            if (result.newStatus === ConversationStatus.DONE) {
                const updatedConversation = await deps.conversationRepo.getById(conversationId);
                if (updatedConversation) {
                    statusUpdateMessage.conversationComplete = true;
                    statusUpdateMessage.screeningDecision = updatedConversation.screening_decision;
                    statusUpdateMessage.screeningSummary = updatedConversation.screening_summary;
                }
            }

            sendMessage(ws, statusUpdateMessage);
        }
    } catch (error) {
        console.error('Error in routeSendMessage:', error);
        sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
};

/**
 * Handles the end_conversation message type.
 * 
 * @param ws - The WebSocket connection
 * @param conversationId - The conversation ID
 */
const handleEndConversation = (ws: WebSocket, conversationId: string): void => {
    sendMessage(ws, {
        type: 'conversation_end',
        conversationId,
        message: 'Conversation ended',
    });
};

/**
 * Handles the pause_conversation message type.
 * Acknowledges the pause and sends current conversation status.
 * 
 * @param ws - The WebSocket connection
 * @param conversationId - The conversation ID
 * @param deps - Server dependencies
 */
const handlePauseConversation = async (
    ws: WebSocket,
    conversationId: string,
    deps: ServerDependencies
): Promise<void> => {
    try {
        const conversation = await deps.conversationRepo.getById(conversationId);
        if (!conversation) {
            sendError(ws, `Conversation ${conversationId} not found`);
            return;
        }

        // Check if there are pending requirements
        const nextPending = await deps.conversationJobRequirementRepo.getNextPending(conversationId);
        const hasPendingRequirements = nextPending !== null;

        sendMessage(ws, {
            type: 'conversation_paused',
            conversationId,
            status: conversation.conversation_status,
            message: 'Conversation paused',
        });
    } catch (error) {
        console.error('Error in handlePauseConversation:', error);
        sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
};

/**
 * Handles the continue_conversation message type.
 * Resumes the conversation from where it left off.
 * 
 * @param ws - The WebSocket connection
 * @param conversationId - The conversation ID
 * @param deps - Server dependencies
 */
const handleContinueConversation = async (
    ws: WebSocket,
    conversationId: string,
    deps: ServerDependencies
): Promise<void> => {
    try {
        const conversation = await deps.conversationRepo.getById(conversationId);
        if (!conversation) {
            sendError(ws, `Conversation ${conversationId} not found`);
            return;
        }

        // Send resume acknowledgment with current status
        sendMessage(ws, {
            type: 'conversation_resumed',
            conversationId,
            status: conversation.conversation_status,
            message: 'Conversation resumed',
        });

        // If conversation is DONE, send completion info
        if (conversation.conversation_status === ConversationStatus.DONE) {
            sendMessage(ws, {
                type: 'status_update',
                conversationId,
                status: ConversationStatus.DONE,
                conversationComplete: true,
                screeningDecision: conversation.screening_decision,
                screeningSummary: conversation.screening_summary,
            });
            return;
        }

        // For other statuses, the frontend can continue sending messages
        // The existing handlers will route based on conversation status
    } catch (error) {
        console.error('Error in handleContinueConversation:', error);
        sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
};

/**
 * Handles incoming client messages and routes them to the appropriate handler.
 * 
 * @param ws - The WebSocket connection
 * @param message - The parsed client message
 * @param deps - Server dependencies
 */
const handleClientMessage = async (
    ws: WebSocket,
    message: ClientMessage,
    deps: ServerDependencies
): Promise<void> => {
    switch (message.type) {
        case 'start_conversation':
            await handleStartConversation(ws, message.userId, message.jobId, deps);
            break;
        case 'send_message':
            await routeSendMessage(ws, message.conversationId, message.message, deps);
            break;
        case 'end_conversation':
            handleEndConversation(ws, message.conversationId);
            break;
        case 'pause_conversation':
            await handlePauseConversation(ws, message.conversationId, deps);
            break;
        case 'continue_conversation':
            await handleContinueConversation(ws, message.conversationId, deps);
            break;
        default:
            const messageType = (message as any).type ?? 'undefined';
            console.warn(`Unknown message type: ${messageType}`, message);
            sendError(ws, `Unknown message type: ${messageType}`);
    }
};

/**
 * Sets up WebSocket event handlers for a new connection.
 * 
 * @param ws - The WebSocket connection
 * @param deps - Server dependencies
 */
const setupWebSocketHandlers = (ws: WebSocket, deps: ServerDependencies): void => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
        try {
            const rawMessage = data.toString();
            const parsedMessage = parseClientMessage(rawMessage);

            if (!parsedMessage) {
                // parseClientMessage already logged the issue
                if (rawMessage && rawMessage.trim().length > 0) {
                    // Only send error if it was a real message (not empty or server echo)
                    sendError(ws, 'Invalid message format');
                }
                return;
            }

            await handleClientMessage(ws, parsedMessage, deps);
        } catch (error) {
            console.error('Error handling message:', error);
            sendError(ws, error instanceof Error ? error.message : 'Unknown error');
        }
    });

    ws.on('close', async () => {
        console.log('WebSocket connection closed');
        
        // If conversation was just started (PENDING or START status), delete the application
        const conversationId = (ws as any).conversationId;
        if (conversationId) {
            try {
                const conversation = await deps.conversationRepo.getById(conversationId);
                if (conversation && 
                    (conversation.conversation_status === ConversationStatus.PENDING || 
                     conversation.conversation_status === ConversationStatus.START)) {
                    // User disconnected early - delete the application (cascades to conversation)
                    const applicationId = conversation.application_id;
                    const deleted = await deps.applicationService.deleteApplication(applicationId);
                    if (deleted) {
                        console.log(`Application ${applicationId} and conversation ${conversationId} deleted due to early disconnect`);
                    }
                }
            } catch (error) {
                console.error('Error handling disconnect cleanup:', error);
                // Don't throw - this is cleanup, shouldn't affect the close
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
};

/**
 * Application Gateway - unified entry point for HTTP REST API and WebSocket connections
 * Routes HTTP requests to REST endpoints and WebSocket messages to chat handlers
 * The WebSocket server attaches to the HTTP server instance
 */
export class ApplicationGateway {
    private app: express.Application;
    private server: ReturnType<typeof createServer>;
    private wss: WebSocketServer;
    private deps: ServerDependencies;

    constructor(port: number = 3000) {
        // Initialize Express app
        this.app = express();
        this.app.use(express.json());

        // Enable CORS for local development - allow all origins
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            
            next();
        });

        // Register HTTP routes
        this.registerRoutes(pool);

        // Create HTTP server
        this.server = createServer(this.app);

        // Create WebSocket server
        this.wss = new WebSocketServer({server: this.server});

        // Initialize dependencies
        this.deps = initializeDependencies();

        // Setup WebSocket connection handling
        this.wss.on('connection', (ws: WebSocket) => {
            setupWebSocketHandlers(ws, this.deps);
        });

        // Start server
        this.server.listen(port, () => {
            console.log(`Server listening on port ${port}`);
            console.log(`WebSocket server ready on ws://localhost:${port}`);
        });
    }

    /**
     * Register all HTTP routes
     */
    private registerRoutes(pool: Pool): void {
        this.app.use('/', createUserRoutes(pool));
        this.app.use('/', createJobRoutes(pool));
        this.app.use('/', createApplicationRoutes(pool));
        this.app.use('/', createConversationSummaryRoutes(pool));
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
    const server = new ApplicationGateway(port);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully');
        await server.shutdown();
        process.exit(0);
    });
}
