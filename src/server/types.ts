import {WebSocket} from "ws";
import {StreamOptions} from "../services/llm/client";
import {ConversationStatus} from "../entities";

export enum UserEvent {
    START_CONVERSATION = 'start_conversation',
    SEND_MESSAGE = 'send_message',
    END_CONVERSATION = 'end_conversation',
}

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
