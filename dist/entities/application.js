"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSchema = exports.simplifiedApplicationSchema = exports.applicationShape = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const user_1 = require("./user");
const job_1 = require("./job");
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
    user: zod_1.z.object(user_1.userShape),
    job: zod_1.z.object(job_1.jobShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ userId: true, jobId: true });
