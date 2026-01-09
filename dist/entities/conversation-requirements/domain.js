"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRequirementsKeySchema = exports.conversationRequirementsFilterSchema = exports.conversationRequirementsFilterShape = exports.conversationRequirementsSchema = exports.simplifiedConversationRequirementsSchema = exports.conversationRequirementsShape = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const types_1 = require("../../database/types");
const conversation_1 = require("../conversation");
const job_requirements_1 = require("../job-requirements");
/**
 * ConversationRequirements shape - base fields for simplified ConversationRequirements objects
 * Excludes metadata timestamps
 */
exports.conversationRequirementsShape = {
    id: zod_1.z.uuidv4(),
    conversationId: zod_1.z.uuidv4(),
    requirementId: zod_1.z.uuidv4(),
    messageId: zod_1.z.uuidv4().nullable(),
    status: enums_1.requirementStatusSchema,
    value: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullable(),
};
/**
 * Simplified ConversationRequirements object
 * Used when embedding conversation requirements information in other entities
 * Contains only essential fields (excludes timestamps)
 */
exports.simplifiedConversationRequirementsSchema = zod_1.z.object(exports.conversationRequirementsShape);
/**
 * Zod schema for ConversationRequirements entity
 * Use this for validating unknown data from the database
 * Uses simplified conversation and jobRequirements objects (with ID references, not full nested objects)
 * Extends conversationRequirementsShape and replaces conversationId/requirementId with full objects
 */
exports.conversationRequirementsSchema = zod_1.z.object(exports.conversationRequirementsShape).extend({
    conversation: conversation_1.conversationSchema,
    jobRequirements: job_requirements_1.jobRequirementsSchema,
    lastUpdated: zod_1.z.date(),
    createdAt: zod_1.z.date(),
}).omit({ conversationId: true, requirementId: true });
exports.conversationRequirementsFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    conversationId: types_1.stringFilterOperatorsSchema,
    requirementId: types_1.stringFilterOperatorsSchema,
    messageId: types_1.stringFilterOperatorsSchema,
    status: types_1.stringFilterOperatorsSchema,
    lastUpdated: types_1.dateFilterOperatorsSchema,
    createdAt: types_1.dateFilterOperatorsSchema,
    conversation: conversation_1.conversationFilterSchema,
    jobRequirements: job_requirements_1.jobRequirementsFilterSchema,
};
exports.conversationRequirementsFilterSchema = zod_1.z.object(exports.conversationRequirementsFilterShape).partial();
exports.conversationRequirementsKeySchema = exports.conversationRequirementsSchema.keyof();
