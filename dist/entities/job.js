"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSchema = exports.simplifiedJobSchema = exports.jobShape = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const domain_1 = require("./address/domain");
/**
 * Job shape - base fields for simplified Job objects
 * Excludes metadata timestamps
 * Uses addressId reference instead of full address object to avoid infinite nesting
 */
exports.jobShape = {
    id: zod_1.z.uuidv4(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    paymentType: enums_1.paymentTypeSchema,
    hourlyPay: zod_1.z.number().nullable(),
    milesPay: zod_1.z.number().nullable(),
    salaryPay: zod_1.z.number().nullable(),
    addressId: zod_1.z.uuidv4(),
    isActive: zod_1.z.boolean(),
};
/**
 * Simplified Job object
 * Used when embedding job information in other entities
 * Contains only essential job fields (excludes metadata timestamps)
 */
exports.simplifiedJobSchema = zod_1.z.object(exports.jobShape);
/**
 * Zod schema for Job entity
 * Use this for validating unknown data from the database
 * Uses full address object (not just ID reference)
 * Extends jobShape and omits addressId to replace it with full address object
 */
exports.jobSchema = zod_1.z.object(exports.jobShape).extend({
    address: zod_1.z.object(domain_1.addressShape),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ addressId: true });
