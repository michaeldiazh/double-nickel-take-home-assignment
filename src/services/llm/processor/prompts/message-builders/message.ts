import {ChatMessage, MessageRole} from "../../../client";

export const buildSystemMessage = (content: string): ChatMessage => ({
    role: MessageRole.SYSTEM,
    content,
});