"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQueryFilterKey = exports.isDomainFilterKey = exports.isWhereCompositionOption = exports.createSetClause = exports.createPlaceholders = exports.getWhereFilterType = void 0;
const query_types_1 = require("./types/query-types");
const types_1 = require("./types");
/**
 * Mapping of domain filter keys to SQL WHERE filter operators
 */
const DomainFilterKeyToQueryFilterKey = {
    equals: '=',
    notEquals: '!=',
    like: 'like',
    iLike: 'ilike',
    in: 'in',
    notIn: 'not in',
    isNull: 'is null',
    isNotNull: 'is not null',
    greaterThan: '>',
    greaterThanEqualTo: '>=',
    lessThan: '<',
    lessThanEqualTo: '<=',
};
const getWhereFilterType = (key) => {
    if (!(0, exports.isDomainFilterKey)(key)) {
        throw new Error(`Unsupported filter operator: ${key}`);
    }
    return DomainFilterKeyToQueryFilterKey[key];
};
exports.getWhereFilterType = getWhereFilterType;
/**
 * Creates PostgreSQL parameter placeholders from a field list
 * @param fields - Array of field names (or any array with a length)
 * @param offset - Optional offset for parameter numbering (default: 1)
 * @returns Comma-separated string of placeholders (e.g., "$1, $2, $3")
 *
 * @example
 * createPlaceholders(['name', 'email', 'age']) // "$1, $2, $3"
 * createPlaceholders(['name', 'email'], 2) // "$2, $3"
 */
const createPlaceholders = (fields, offset = 1) => {
    return fields.map((_, index) => `$${index + offset}`).join(', ');
};
exports.createPlaceholders = createPlaceholders;
/**
 * Creates a SET clause for UPDATE queries by pairing fields with placeholders
 * @param fields - Array of field names
 * @param placeholders - Comma-separated string of placeholders (e.g., "$2, $3, $4")
 * @returns SET clause string (e.g., "field1 = $2, field2 = $3, field3 = $4")
 *
 * @example
 * createSetClause(['name', 'email'], '$2, $3') // "name = $2, email = $3"
 */
const createSetClause = (fields, placeholders) => {
    const placeholderArray = placeholders.split(', ');
    return fields.map((field, index) => `${String(field)} = ${placeholderArray[index]}`).join(', ');
};
exports.createSetClause = createSetClause;
/**
 * Checks if an option is a WhereCompositionOption
 * @param option - The option to check
 * @returns True if the option is a WhereCompositionOption, false otherwise
 */
const isWhereCompositionOption = (option) => {
    return typeof option === 'object' && option !== null && 'compositionOption' in option && 'whereOptions' in option;
};
exports.isWhereCompositionOption = isWhereCompositionOption;
/**
 * Checks if a filter key is a DomainFilterKey
 * @param filterKey
 */
const isDomainFilterKey = (filterKey) => types_1.DOMAIN_FILTER_KEY.includes(filterKey);
exports.isDomainFilterKey = isDomainFilterKey;
/**
 * Checks if a filter key is a QueryFilterKey
 * @param filterKey
 */
const isQueryFilterKey = (filterKey) => query_types_1.QUERY_FILTER_KEY.includes(filterKey);
exports.isQueryFilterKey = isQueryFilterKey;
