"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRequirementsKeySchema = exports.jobRequirementsFilterSchema = exports.jobRequirementsFilterShape = exports.jobRequirementsSchema = exports.simplifiedJobRequirementsSchema = exports.jobRequirementsShape = void 0;
const zod_1 = require("zod");
const domain_1 = require("../job/domain");
const domain_2 = require("../job-requirement-type/domain");
const types_1 = require("../../database/types");
/**
 * JobRequirements shape - base fields for simplified JobRequirements objects
 * Excludes metadata timestamps
 * Uses jobId and requirementTypeId references instead of full objects to avoid infinite nesting
 */
exports.jobRequirementsShape = {
    id: zod_1.z.uuidv4(),
    jobId: zod_1.z.uuidv4(),
    requirementTypeId: zod_1.z.number().int().positive(),
    criteria: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    priority: zod_1.z.number().int(),
};
/**
 * Simplified JobRequirements object
 * Used when embedding job requirements information in other entities
 * Contains only essential fields (excludes timestamps)
 */
exports.simplifiedJobRequirementsSchema = zod_1.z.object(exports.jobRequirementsShape);
/**
 * Zod schema for JobRequirements entity
 * Use this for validating unknown data from the database
 * Uses simplified job and jobRequirementType objects (with ID references, not full nested objects)
 * Extends jobRequirementsShape and replaces jobId/requirementTypeId with full objects
 */
exports.jobRequirementsSchema = zod_1.z.object(exports.jobRequirementsShape).extend({
    job: zod_1.z.object(domain_1.jobShape),
    jobRequirementType: zod_1.z.object(domain_2.jobRequirementTypeShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ jobId: true, requirementTypeId: true });
exports.jobRequirementsFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    priority: types_1.numberFilterOperatorsSchema,
    job: zod_1.z.object(domain_1.jobFilterShape).partial(),
    jobRequirementType: zod_1.z.object(domain_2.jobRequirementTypeFilterShape).partial(),
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.jobRequirementsFilterSchema = zod_1.z.object(exports.jobRequirementsFilterShape).partial();
exports.jobRequirementsKeySchema = exports.jobRequirementsSchema.keyof();
