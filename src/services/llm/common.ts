import {ChatMessage, MessageRole} from "./client";

export const buildUserChatMessage = (content: string): ChatMessage => (
    {role: MessageRole.USER, content}
)
export const buildAssistantChatMessage = (content: string): ChatMessage => (
    {role: MessageRole.ASSISTANT, content}
)