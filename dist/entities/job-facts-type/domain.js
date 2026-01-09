"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobFactsTypeKeySchema = exports.jobFactsTypeFilterSchema = exports.jobFactsTypeFilterShape = exports.jobFactsTypeSchema = exports.simplifiedJobFactsTypeSchema = exports.jobFactsTypeShape = void 0;
const zod_1 = require("zod");
const types_1 = require("../../database/types");
/**
 * JobFactsType shape - base fields for simplified JobFactsType objects
 * Excludes metadata timestamps
 */
exports.jobFactsTypeShape = {
    id: zod_1.z.number().int().positive(),
    factType: zod_1.z.string().max(50),
    factDescription: zod_1.z.string(),
};
/**
 * Simplified JobFactsType object
 * Used when embedding job facts type information in other entities
 * Contains only essential fields (excludes timestamps)
 */
exports.simplifiedJobFactsTypeSchema = zod_1.z.object(exports.jobFactsTypeShape);
/**
 * Zod schema for JobFactsType entity
 * Use this for validating unknown data from the database
 */
exports.jobFactsTypeSchema = zod_1.z.object(exports.jobFactsTypeShape).extend({
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.jobFactsTypeFilterShape = {
    id: types_1.numberFilterOperatorsSchema,
    factType: types_1.stringFilterOperatorsSchema,
    factDescription: types_1.stringFilterOperatorsSchema,
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.jobFactsTypeFilterSchema = zod_1.z.object(exports.jobFactsTypeFilterShape).partial();
exports.jobFactsTypeKeySchema = exports.jobFactsTypeSchema.keyof();
