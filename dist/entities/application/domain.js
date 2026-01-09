"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationKeySchema = exports.applicationFilterSchema = exports.applicationFilterShape = exports.applicationSchema = exports.simplifiedApplicationSchema = exports.applicationShape = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const domain_1 = require("../user/domain");
const domain_2 = require("../job/domain");
const types_1 = require("../../database/types");
/**
 * Application shape - base fields for simplified Application objects
 * Excludes metadata timestamps
 * Uses userId and jobId references instead of full objects to avoid infinite nesting
 */
exports.applicationShape = {
    id: zod_1.z.uuidv4(),
    userId: zod_1.z.uuidv4(),
    jobId: zod_1.z.uuidv4(),
    appliedOn: zod_1.z.date(),
    status: enums_1.applicationStatusSchema,
};
/**
 * Simplified Application object
 * Used when embedding application information in other entities
 * Contains only essential application fields (excludes timestamps)
 */
exports.simplifiedApplicationSchema = zod_1.z.object(exports.applicationShape);
/**
 * Zod schema for Application entity
 * Use this for validating unknown data from the database
 * Uses simplified user and job objects (with ID references, not full nested objects)
 * Extends applicationShape and replaces userId/jobId with full user/job objects
 */
exports.applicationSchema = zod_1.z.object(exports.applicationShape).extend({
    user: zod_1.z.object(domain_1.userShape),
    job: zod_1.z.object(domain_2.jobShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ userId: true, jobId: true });
exports.applicationFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    userId: types_1.stringFilterOperatorsSchema,
    jobId: types_1.stringFilterOperatorsSchema,
    appliedOn: types_1.dateFilterOperatorsSchema,
    status: types_1.stringFilterOperatorsSchema,
    user: zod_1.z.object(domain_1.userFilterShape).partial(),
    job: zod_1.z.object(domain_2.jobFilterShape).partial(),
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.applicationFilterSchema = zod_1.z.object(exports.applicationFilterShape).partial();
exports.applicationKeySchema = exports.applicationSchema.keyof();
