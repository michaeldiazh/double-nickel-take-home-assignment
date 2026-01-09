"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateFilterOperatorsSchema = exports.booleanFilterOperatorsSchema = exports.numberFilterOperatorsSchema = exports.stringFilterOperatorsSchema = exports.DOMAIN_FILTER_KEY = void 0;
/*
    Going to be used in application layer
    Main goal is to transform these filters to query types in the data layer
 */
const zod_1 = require("zod");
exports.DOMAIN_FILTER_KEY = [
    'equals',
    'notEquals',
    'like',
    'iLike',
    'in',
    'notIn',
    'isNull',
    'isNotNull',
    'greaterThan',
    'greaterThanEqualTo',
    'lessThan',
    'lessThanEqualTo'
];
/**
 * Filter operators for string fields
 */
exports.stringFilterOperatorsSchema = zod_1.z.object({
    equals: zod_1.z.string().optional(),
    notEquals: zod_1.z.string().optional(),
    like: zod_1.z.string().optional(),
    iLike: zod_1.z.string().optional(),
    in: zod_1.z.array(zod_1.z.string()).optional(),
    notIn: zod_1.z.array(zod_1.z.string()).optional(),
    isNull: zod_1.z.boolean().optional(),
    isNotNull: zod_1.z.boolean().optional(),
}).strict().refine((obj) => Object.values(obj).some(val => val !== undefined), { message: "At least one filter operator must be provided" });
/**
 * Filter operators for Number fields
 */
exports.numberFilterOperatorsSchema = zod_1.z.object({
    equals: zod_1.z.number().optional(),
    notEquals: zod_1.z.number().optional(),
    greaterThan: zod_1.z.number().optional(),
    greaterThanEqualTo: zod_1.z.number().optional(),
    lessThan: zod_1.z.number().optional(),
    lessThanEqualTo: zod_1.z.number().optional(),
    in: zod_1.z.array(zod_1.z.number()).optional(),
    notIn: zod_1.z.array(zod_1.z.number()).optional(),
}).strict().refine((obj) => Object.values(obj).some(val => val !== undefined), { message: "At least one filter operator must be provided" });
/**
 * Filter operators for Number fields
 */
exports.booleanFilterOperatorsSchema = zod_1.z.object({
    equals: zod_1.z.boolean().optional(),
    notEquals: zod_1.z.boolean().optional(),
    isNull: zod_1.z.boolean().optional(),
    isNotNull: zod_1.z.boolean().optional(),
}).strict().refine((obj) => Object.values(obj).some(val => val !== undefined), { message: "At least one filter operator must be provided" });
/**
 * Filter operators for Date fields
 */
exports.dateFilterOperatorsSchema = zod_1.z.object({
    equals: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    notEquals: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    greaterThan: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    greaterThanEqualTo: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    lessThan: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    lessThanEqualTo: zod_1.z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, zod_1.z.date().optional()),
    in: zod_1.z.preprocess((val) => Array.isArray(val) ? val.map(item => typeof item === 'string' ? new Date(item) : item) : val, zod_1.z.array(zod_1.z.date()).optional()),
    notIn: zod_1.z.preprocess((val) => Array.isArray(val) ? val.map(item => typeof item === 'string' ? new Date(item) : item) : val, zod_1.z.array(zod_1.z.date()).optional()),
    isNull: zod_1.z.boolean().optional(),
    isNotNull: zod_1.z.boolean().optional(),
}).strict().refine((obj) => Object.values(obj).some(val => val !== undefined), { message: "At least one filter operator must be provided" });
