"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobFactsSchema = exports.simplifiedJobFactsSchema = exports.jobFactsShape = void 0;
const zod_1 = require("zod");
const job_1 = require("./job");
const job_facts_type_1 = require("./job-facts-type");
/**
 * JobFacts shape - base fields for simplified JobFacts objects
 * Excludes metadata timestamps
 * Uses jobId and factTypeId references instead of full objects to avoid infinite nesting
 */
exports.jobFactsShape = {
    id: zod_1.z.uuidv4(),
    jobId: zod_1.z.uuidv4(),
    factTypeId: zod_1.z.number().int().positive(),
    content: zod_1.z.string(),
};
/**
 * Simplified JobFacts object
 * Used when embedding job facts information in other entities
 * Contains only essential fields (excludes timestamps)
 */
exports.simplifiedJobFactsSchema = zod_1.z.object(exports.jobFactsShape);
/**
 * Zod schema for JobFacts entity
 * Use this for validating unknown data from the database
 * Uses simplified job and jobFactsType objects (with ID references, not full nested objects)
 * Extends jobFactsShape and replaces jobId/factTypeId with full objects
 */
exports.jobFactsSchema = zod_1.z.object(exports.jobFactsShape).extend({
    job: zod_1.z.object(job_1.jobShape),
    factType: zod_1.z.object(job_facts_type_1.jobFactsTypeShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ jobId: true, factTypeId: true });
