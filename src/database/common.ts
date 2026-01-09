import {QUERY_FILTER_KEY, QueryFilterKey, WhereCompositionOption, WhereOption} from "./types/query-types";
import {DOMAIN_FILTER_KEY, DomainFilterKey} from "./types";

/**
 * Mapping of domain filter keys to SQL WHERE filter operators
 */
const DomainFilterKeyToQueryFilterKey: Record<DomainFilterKey, QueryFilterKey> = {
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

export const getWhereFilterType = (key: string): QueryFilterKey => {
    if(!isDomainFilterKey(key)) {
        throw new Error(`Unsupported filter operator: ${key}`);
    }
    return DomainFilterKeyToQueryFilterKey[key];
}

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
export const createPlaceholders = (fields: readonly unknown[], offset: number = 1): string => {
    return fields.map((_, index) => `$${index + offset}`).join(', ');
};

/**
 * Creates a SET clause for UPDATE queries by pairing fields with placeholders
 * @param fields - Array of field names
 * @param placeholders - Comma-separated string of placeholders (e.g., "$2, $3, $4")
 * @returns SET clause string (e.g., "field1 = $2, field2 = $3, field3 = $4")
 *
 * @example
 * createSetClause(['name', 'email'], '$2, $3') // "name = $2, email = $3"
 */
export const createSetClause = (fields: readonly (string | number | symbol)[], placeholders: string): string => {
    const placeholderArray = placeholders.split(', ');
    return fields.map((field, index) => `${String(field)} = ${placeholderArray[index]}`).join(', ');
};

/**
 * Checks if an option is a WhereCompositionOption
 * @param option - The option to check
 * @returns True if the option is a WhereCompositionOption, false otherwise
 */
export const isWhereCompositionOption = (option: unknown): option is WhereCompositionOption => {
    return typeof option === 'object' && option !== null && 'compositionOption' in option && 'whereOptions' in option;
};


/**
 * Checks if a filter key is a DomainFilterKey
 * @param filterKey
 */
export const isDomainFilterKey = (filterKey: any): filterKey is DomainFilterKey =>
    DOMAIN_FILTER_KEY.includes(filterKey);

/**
 * Checks if a filter key is a QueryFilterKey
 * @param filterKey
 */
export const isQueryFilterKey = (filterKey: any): filterKey is QueryFilterKey =>
    QUERY_FILTER_KEY.includes(filterKey);
