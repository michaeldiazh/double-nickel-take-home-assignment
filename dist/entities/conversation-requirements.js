"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRequirementsSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
/**
 * Zod schema for ConversationRequirements entity
 * Use this for validating unknown data from the database
 */
exports.conversationRequirementsSchema = zod_1.z.object({
    conversationId: zod_1.z.uuidv4(),
    requirementId: zod_1.z.uuidv4(),
    messageId: zod_1.z.uuidv4().nullable(),
    status: enums_1.requirementStatusSchema,
    value: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable(),
    lastUpdated: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
