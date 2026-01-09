"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageKeySchema = exports.messageFilterSchema = exports.messageFilterShape = exports.messageSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const domain_1 = require("../conversation/domain");
const types_1 = require("../../database/types");
/**
 * Zod schema for Message entity
 * Use this for validating unknown data from the database
 * Uses simplified conversation object (with ID references, not full nested objects)
 */
exports.messageSchema = zod_1.z.object({
    id: zod_1.z.uuidv4(),
    conversation: zod_1.z.object(domain_1.conversationShape),
    sender: enums_1.messageSenderSchema,
    content: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
exports.messageFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    conversationId: types_1.stringFilterOperatorsSchema,
    sender: types_1.stringFilterOperatorsSchema,
    content: types_1.stringFilterOperatorsSchema,
    conversation: zod_1.z.object(domain_1.conversationFilterShape).partial(),
    createdAt: types_1.dateFilterOperatorsSchema,
};
exports.messageFilterSchema = zod_1.z.object(exports.messageFilterShape).partial();
exports.messageKeySchema = exports.messageSchema.keyof();
