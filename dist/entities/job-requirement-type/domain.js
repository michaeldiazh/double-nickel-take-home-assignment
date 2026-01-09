"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRequirementTypeKeySchema = exports.jobRequirementTypeFilterSchema = exports.jobRequirementTypeFilterShape = exports.jobRequirementTypeSchema = exports.simplifiedJobRequirementTypeSchema = exports.jobRequirementTypeShape = void 0;
const zod_1 = require("zod");
const types_1 = require("../../database/types");
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
exports.jobRequirementTypeFilterShape = {
    id: types_1.numberFilterOperatorsSchema,
    requirementType: types_1.stringFilterOperatorsSchema,
    requirementDescription: types_1.stringFilterOperatorsSchema,
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.jobRequirementTypeFilterSchema = zod_1.z.object(exports.jobRequirementTypeFilterShape).partial();
exports.jobRequirementTypeKeySchema = exports.jobRequirementTypeSchema.keyof();
