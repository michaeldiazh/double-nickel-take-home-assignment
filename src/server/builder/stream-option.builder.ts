import {WebSocket} from "ws";
import {ServerStreamEvent} from "../types";

const buildActiveServerOnChuckFunction = (websocket: WebSocket, conversationId: string, serverEvent: ServerStreamEvent) => (chuck: string) => {
    if (websocket.readyState !== WebSocket.OPEN) return;
    const message: string = JSON.stringify({type: serverEvent, conversationId, message: chuck,});
    websocket.send(message);
};

const buildOnErrorFunction = (websocket: WebSocket, conversationId: string) => (error: Error) => {
    if (websocket.readyState !== WebSocket.OPEN) return;
    console.error(`Conversation ${conversationId} encountered error: `, error);
    websocket.send(JSON.stringify({
        type: 'error',
        conversationId,
        error: error.message,
    }));
};

const buildOnCompleteFunction = (severEvent: ServerStreamEvent, conversationId: string) => () => {
    console.log(`${severEvent} complete for conversation: `, conversationId);
};
export type StreamOptionsBuilder = (conversationId: string, serverEvent: ServerStreamEvent) => {
    onChunk: (chunk: string) => void;
    onError: (error: Error) => void;
    onComplete: () => void;
};
export const buildStreamOptionsForActiveStream = (webSocket: WebSocket) => (conversationId: string, serverEvent: ServerStreamEvent) => {
    return {
        onChunk: buildActiveServerOnChuckFunction(webSocket, conversationId, serverEvent),
        onError: buildOnErrorFunction(webSocket, conversationId),
        onComplete: buildOnCompleteFunction(serverEvent, conversationId),
    };
}