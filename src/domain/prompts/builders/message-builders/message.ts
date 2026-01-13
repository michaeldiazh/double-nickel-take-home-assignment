import {ChatMessage, MessageRole} from "../../../llm/client";

export const buildSystemMessage = (content: string): ChatMessage => ({
    role: MessageRole.SYSTEM,
    content,
});