import {z} from "zod";
import {LLMClient} from "../llm/client";
import {ConversationRepository} from "../../entities";
import {ConversationContextService} from "../conversation-context";
import {ApplicationService} from "../application";
import {buildStreamOptionsForActiveStream} from "../../server/builder/stream-option.builder";

export type WebSocketGatewayServices = {
    llmClient: LLMClient;
    conversationRepository: ConversationRepository;
    conversationContextService: ConversationContextService; // Placeholder for actual service
    applicationService: ApplicationService;
    activeStreamOptionBuilder: ReturnType<typeof buildStreamOptionsForActiveStream>;
}

export enum ClientEventType {
    START_CONVERSATION = 'start_conversation',
    SEND_MESSAGE = 'send_message',
    FOLLOW_UP_MESSAGE = 'follow_up_message',
    END_CONVERSATION = 'end_conversation',
}

export const startConversationEventSchema = z.object({
    type: z.literal(ClientEventType.START_CONVERSATION),
    user_id: z.uuidv4(),
    job_id: z.uuidv4(),
});

export type StartConversationEvent = z.infer<typeof startConversationEventSchema>;

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

export type FollowUpMessageEvent = z.infer<typeof followUpMessageEventSchema>;

export type SendMessageEvent = z.infer<typeof sendMessageEventSchema>;

const endConversationEventSchema = z.object({
    type: z.literal(ClientEventType.END_CONVERSATION),
    conversation_id: z.uuidv4(),
});
export type EndConversationEvent = z.infer<typeof endConversationEventSchema>;

export const clientEventSchema = z.discriminatedUnion('type', [
    startConversationEventSchema,
    sendMessageEventSchema,
    followUpMessageEventSchema,
    endConversationEventSchema,
]);

export type ClientEvent = z.infer<typeof clientEventSchema>;