"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const conversation_1 = require("./conversation");
/**
 * Zod schema for Message entity
 * Use this for validating unknown data from the database
 * Uses simplified conversation object (with ID references, not full nested objects)
 */
exports.messageSchema = zod_1.z.object({
    id: zod_1.z.uuidv4(),
    conversation: zod_1.z.object(conversation_1.conversationShape),
    sender: enums_1.messageSenderSchema,
    content: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
