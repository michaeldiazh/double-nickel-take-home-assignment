"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressKeySchema = exports.createAddressSchema = exports.addressFilterSchema = exports.addressFilterShape = exports.addressSchema = exports.simplifiedAddressSchema = exports.addressShape = void 0;
const zod_1 = require("zod");
const types_1 = require("../../database/types");
/**
 * Address shape - base fields shared between full and simplified Address objects
 * Export this for use in other entities to avoid circular imports
 */
exports.addressShape = {
    id: zod_1.z.uuidv4(),
    address: zod_1.z.string(),
    city: zod_1.z.string(),
    aptNumber: zod_1.z.string().nullable(),
    state: zod_1.z.string().max(2),
    zipCode: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
};
/**
 * Simplified Address object
 * Used when embedding address information in other entities
 * Contains only essential address fields (excludes metadata timestamps)
 */
exports.simplifiedAddressSchema = zod_1.z.object(exports.addressShape);
/**
 * Zod schema for Address entity
 * Use this for validating unknown data from the database
 * Extends the base address fields with metadata timestamps
 */
exports.addressSchema = zod_1.z.object(exports.addressShape);
exports.addressFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    address: types_1.stringFilterOperatorsSchema,
    city: types_1.stringFilterOperatorsSchema,
    aptNumber: types_1.stringFilterOperatorsSchema,
    state: types_1.stringFilterOperatorsSchema,
    zipCode: types_1.stringFilterOperatorsSchema,
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.addressFilterSchema = zod_1.z.object(exports.addressFilterShape).partial();
/**
 * Schema for creating a new address (camelCase, excludes id)
 * Used for API input when creating addresses
 */
exports.createAddressSchema = zod_1.z.object({
    address: zod_1.z.string().nullable(),
    aptNumber: zod_1.z.string().nullable(),
    state: zod_1.z.string().max(2).nullable(),
    zipCode: zod_1.z.string().nullable(),
});
exports.addressKeySchema = exports.addressSchema.keyof();
