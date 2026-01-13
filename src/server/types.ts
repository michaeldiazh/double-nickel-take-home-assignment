import {WebSocket} from "ws";
import {z} from "zod";
import {StreamOptions} from "../domain/llm/client";
import {ConversationStatus} from "../entities";
import {LLMClient} from "../domain/llm/client";
import {ConversationRepository} from "../entities";
import {ConversationContextService} from "../domain/conversation-context";
import {ApplicationService} from "../domain/application";
import {buildStreamOptionsForActiveStream} from "./builder/stream-option.builder";

export enum UserEvent {
    START_CONVERSATION = 'start_conversation',
    SEND_MESSAGE = 'send_message',
    END_CONVERSATION = 'end_conversation',
}

/**
 * Client event types (matches UserEvent but with Zod validation)
 */
export enum ClientEventType {
    START_CONVERSATION = 'start_conversation',
    SEND_MESSAGE = 'send_message',
    FOLLOW_UP_MESSAGE = 'follow_up_message',
    END_CONVERSATION = 'end_conversation',
}

/**
 * WebSocket Gateway Services - dependencies for the gateway
 */
export type WebSocketGatewayServices = {
    llmClient: LLMClient;
    conversationRepository: ConversationRepository;
    conversationContextService: ConversationContextService;
    applicationService: ApplicationService;
    activeStreamOptionBuilder: ReturnType<typeof buildStreamOptionsForActiveStream>;
}

/**
 * Zod schemas for WebSocket client events
 */
export const startConversationEventSchema = z.object({
    type: z.literal(ClientEventType.START_CONVERSATION),
    user_id: z.uuidv4(),
    job_id: z.uuidv4(),
});

export const sendMessageEventSchema = z.object({
    type: z.literal(ClientEventType.SEND_MESSAGE),
    conversation_id: z.uuidv4(),
    message: z.string()
});

export const followUpMessageEventSchema = z.object({
    type: z.literal(ClientEventType.FOLLOW_UP_MESSAGE),
    conversation_id: z.uuidv4(),
    message: z.string()
});

const endConversationEventSchema = z.object({
    type: z.literal(ClientEventType.END_CONVERSATION),
    conversation_id: z.uuidv4(),
});

export const clientEventSchema = z.discriminatedUnion('type', [
    startConversationEventSchema,
    sendMessageEventSchema,
    followUpMessageEventSchema,
    endConversationEventSchema,
]);

/**
 * Type-safe client event types
 */
export type StartConversationEvent = z.infer<typeof startConversationEventSchema>;
export type SendMessageEvent = z.infer<typeof sendMessageEventSchema>;
export type FollowUpMessageEvent = z.infer<typeof followUpMessageEventSchema>;
export type EndConversationEvent = z.infer<typeof endConversationEventSchema>;
export type ClientEvent = z.infer<typeof clientEventSchema>;

export enum ServerStreamEvent {
    GREETING = 'greeting',
    MESSAGE = 'message',
    ERROR = 'error',
    STATUS_UPDATE = 'status_update',
    NEED_FOLLOW_UP = 'need_follow_up',
    CONVERSATION_END = 'conversation_end',
}

/**
 * Request structure for processing a user message through the LLM.
 */
export interface LLMMessageRequest {
    ws: WebSocket;
    conversationId: string;
    userMessage: string
    streamOptions?: StreamOptions
}

export interface BaseUserStreamMessage<Type extends UserEvent> {
    type: Type,
}

export type UserStreamMessage =
    | BaseUserStreamMessage<UserEvent.START_CONVERSATION>
    | (BaseUserStreamMessage<UserEvent.SEND_MESSAGE> & { message: string })
    | BaseUserStreamMessage<UserEvent.END_CONVERSATION>;

export interface ServerMessage {
    event: 'greeting' | 'message' | 'error' | 'status_update' | 'conversation_end'| 'need_follow_up';
    conversationId: string;
    message?: string;
    status?: ConversationStatus;
    error?: string;
}

export type LLMRouterPort = (request: LLMMessageRequest) => Promise<void>;
