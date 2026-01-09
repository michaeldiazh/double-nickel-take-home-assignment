"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRequirementTypeSchema = exports.simplifiedJobRequirementTypeSchema = exports.jobRequirementTypeShape = void 0;
const zod_1 = require("zod");
/**
 * JobRequirementType shape - base fields for simplified JobRequirementType objects
 * Excludes metadata timestamps
 */
exports.jobRequirementTypeShape = {
    id: zod_1.z.number().int().positive(),
    requirementType: zod_1.z.string().max(50),
    requirementDescription: zod_1.z.string(),
};
/**
 * Simplified JobRequirementType object
 * Used when embedding job requirement type information in other entities
 * Contains only essential fields (excludes timestamps)
 */
exports.simplifiedJobRequirementTypeSchema = zod_1.z.object(exports.jobRequirementTypeShape);
/**
 * Zod schema for JobRequirementType entity
 * Use this for validating unknown data from the database
 */
exports.jobRequirementTypeSchema = zod_1.z.object(exports.jobRequirementTypeShape).extend({
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
