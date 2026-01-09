/*
    Going to be used in application layer
    Main goal is to transform these filters to query types in the data layer
 */
import {z} from "zod";
import {ZodObject} from "zod/src/v4/classic/schemas";

export const DOMAIN_FILTER_KEY = [
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
] as const;

export type DomainFilterKey = typeof DOMAIN_FILTER_KEY[number];

export type FilterOperators = Partial<Record<DomainFilterKey, z.ZodType>>;


/**
 * Filter operators for string fields
 */
export const stringFilterOperatorsSchema = z.object<FilterOperators>({
    equals: z.string().optional(),
    notEquals: z.string().optional(),
    like: z.string().optional(),
    iLike: z.string().optional(),
    in: z.array(z.string()).optional(),
    notIn: z.array(z.string()).optional(),
    isNull: z.boolean().optional(),
    isNotNull: z.boolean().optional(),
}).strict().refine(
    (obj) => Object.values(obj).some(val => val !== undefined),
    {message: "At least one filter operator must be provided"}
);

/**
 * Filter operators for Number fields
 */
export const numberFilterOperatorsSchema = z.object<FilterOperators>({
    equals: z.number().optional(),
    notEquals: z.number().optional(),
    greaterThan: z.number().optional(),
    greaterThanEqualTo: z.number().optional(),
    lessThan: z.number().optional(),
    lessThanEqualTo: z.number().optional(),
    in: z.array(z.number()).optional(),
    notIn: z.array(z.number()).optional(),
}).strict().refine(
    (obj) => Object.values(obj).some(val => val !== undefined),
    {message: "At least one filter operator must be provided"}
);

/**
 * Filter operators for Number fields
 */
export const booleanFilterOperatorsSchema = z.object<FilterOperators>({
    equals: z.boolean().optional(),
    notEquals: z.boolean().optional(),
    isNull: z.boolean().optional(),
    isNotNull: z.boolean().optional(),
}).strict().refine(
    (obj) => Object.values(obj).some(val => val !== undefined),
    {message: "At least one filter operator must be provided"}
);

/**
 * Filter operators for Date fields
 */
export const dateFilterOperatorsSchema = z.object<FilterOperators>({
    equals: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    notEquals: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    greaterThan: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    greaterThanEqualTo: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    lessThan: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    lessThanEqualTo: z.preprocess((val) => typeof val === 'string' ? new Date(val) : val, z.date().optional()),
    in: z.preprocess(
        (val) => Array.isArray(val) ? val.map(item => typeof item === 'string' ? new Date(item) : item) : val,
        z.array(z.date()).optional()
    ),
    notIn: z.preprocess(
        (val) => Array.isArray(val) ? val.map(item => typeof item === 'string' ? new Date(item) : item) : val,
        z.array(z.date()).optional()
    ),
    isNull: z.boolean().optional(),
    isNotNull: z.boolean().optional(),
}).strict().refine(
    (obj) => Object.values(obj).some(val => val !== undefined),
    {message: "At least one filter operator must be provided"}
);