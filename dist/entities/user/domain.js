"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFiltersSchema = exports.userFilterShape = exports.userSchema = exports.simplifiedUserSchema = exports.userShape = void 0;
const zod_1 = require("zod");
const address_1 = require("../address");
const types_1 = require("../../database/types");
/**
 * User shape - base fields for simplified User objects
 * Excludes sensitive/tracking fields (passwordHash, lastLoggedIn, timestamps)
 * Uses addressId reference instead of full address object to avoid infinite nesting
 */
exports.userShape = {
    id: zod_1.z.uuidv4(),
    firstName: zod_1.z.string().max(50),
    lastName: zod_1.z.string().max(50),
    email: zod_1.z.email(),
    addressId: zod_1.z.uuidv4(),
};
/**
 * Simplified User object
 * Used when embedding user information in other entities
 * Contains only essential user fields (excludes passwordHash, lastLoggedIn, timestamps)
 */
exports.simplifiedUserSchema = zod_1.z.object(exports.userShape);
/**
 * Zod schema for User entity
 * Use this for validating unknown data from the database
 * Uses full address object (not just ID reference)
 * Extends userShape and omits addressId to replace it with full address object
 */
exports.userSchema = zod_1.z.object(exports.userShape).extend({
    address: zod_1.z.object(address_1.addressShape),
    passwordHash: zod_1.z.string(),
    lastLoggedIn: zod_1.z.date().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
}).omit({ addressId: true });
exports.userFilterShape = {
    id: types_1.stringFilterOperatorsSchema,
    firstName: types_1.stringFilterOperatorsSchema,
    lastName: types_1.stringFilterOperatorsSchema,
    email: types_1.stringFilterOperatorsSchema,
    address: zod_1.z.object(address_1.addressFilterShape).partial(),
    lastLoggedIn: types_1.dateFilterOperatorsSchema,
    createdAt: types_1.dateFilterOperatorsSchema,
    updatedAt: types_1.dateFilterOperatorsSchema,
};
exports.userFiltersSchema = zod_1.z.object(exports.userFilterShape).strict().partial();
