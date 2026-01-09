"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationSchema = exports.simplifiedConversationSchema = exports.conversationShape = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const application_1 = require("./application");
/**
 * Conversation shape - base fields for simplified Conversation objects
 * Excludes metadata timestamps
 * Uses appId reference instead of full application object to avoid infinite nesting
 */
exports.conversationShape = {
    id: zod_1.z.uuidv4(),
    appId: zod_1.z.uuidv4(),
    isActive: zod_1.z.boolean(),
    screeningDecision: enums_1.screeningDecisionSchema,
    screeningSummary: zod_1.z.string().nullable(),
    screeningReasons: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable(),
    endedAt: zod_1.z.date().nullable(),
};
/**
 * Simplified Conversation object
 * Used when embedding conversation information in other entities
 * Contains only essential conversation fields (excludes timestamps)
 */
exports.simplifiedConversationSchema = zod_1.z.object(exports.conversationShape);
/**
 * Zod schema for Conversation entity
 * Use this for validating unknown data from the database
 * Uses simplified application object (with ID references, not full nested objects)
 * Extends conversationShape and replaces appId with full application object
 */
exports.conversationSchema = zod_1.z.object(exports.conversationShape).extend({
    application: zod_1.z.object(application_1.applicationShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ appId: true });
