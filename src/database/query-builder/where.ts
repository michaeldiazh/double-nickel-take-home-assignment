import type {WhereOption, WhereCompositionOption, Placeholder, WhereBuilder} from '../types/query-types';
import {isWhereCompositionOption} from '../common';

/**
 * Result of building a WHERE condition
 * @property condition - SQL condition string
 * @property values - Array of values for the condition
 * @property placeholderCount - Number of placeholders used
 */
type WhereConditionResult = [condition: string, values: unknown[], placeholderCount: number];

/**
 * Checks if a filter operator is a null check operator (IS NULL or IS NOT NULL)
 * @param filter - Filter operator to check
 * @returns True if the filter is 'is null' or 'is not null', false otherwise
 */
const isNullOperator = (filter: string): boolean => {
    return filter === 'is null' || filter === 'is not null';
};

/**
 * Checks if a filter operator is an IN operator (IN or NOT IN)
 * @param filter - Filter operator to check
 * @returns True if the filter is 'in' or 'not in', false otherwise
 */
const isInOperator = (filter: string): boolean => {
    return filter === 'in' || filter === 'not in';
};

/**
 * Generates an array of SQL parameter placeholders
 * @param count - Number of placeholders to generate
 * @param offset - Starting offset for placeholder numbering (1-based)
 * @returns Array of placeholder strings (e.g., ['$1', '$2', '$3'] for count=3, offset=1)
 * @example generatePlaceholderArray(3, 1) // ['$1', '$2', '$3']
 * @example generatePlaceholderArray(2, 5) // ['$5', '$6']
 */
const generatePlaceholderArray = (count: number, offset: number): Placeholder[] => {
    const placeholders: Placeholder[] = [];
    for (let i = 0; i < count; i++) {
        placeholders.push(`$${offset + i}`);
    }
    return placeholders;
};

/**
 * Builds a comparison operator
 * @param columnRef - Column reference
 * @param filter - Comparison operator
 * @param placeholder - Parameter placeholder
 * @returns SQL condition string
 * @throws Error if the parameter placeholder is required for the filter operator
 * @example buildComparisonOperator('users.name', '=', '$1') // "users.name = $1"
 */
const buildComparisonOperator = (columnRef: string, filter: string, placeholder?: Placeholder | Placeholder[]): string => {
    if (placeholder === undefined) {
        throw new Error(`Parameter placeholder is required for filter operator: ${filter}`);
    }
    return `${columnRef} ${filter} ${placeholder}`;
}

/**
 * Builds an in operator
 * @param columnRef - Column reference
 * @param filter - IN operator
 * @param placeholder - Parameter placeholder
 * @returns SQL condition string
 * @throws Error if the parameter placeholder is required for the filter operator
 * @example buildInOperator('users.name', 'in', ['$1', '$2']) // "users.name in ($1, $2)"
 * @example buildInOperator('users.name', 'in', '$1') // "users.name in ($1)"
 */
const buildInOperator = (columnRef: string, filter: string, placeholder?: Placeholder | Placeholder[]): string => {
    if (placeholder === undefined || !Array.isArray(placeholder)) {
        throw new Error(`Array of parameter placeholders is required for filter operator: ${filter}`);
    }
    return `${columnRef} ${filter} (${placeholder.join(', ')})`;
}


/**
 * Builds a like operator
 * @param columnRef - Column reference
 * @param filter - LIKE operator
 * @param placeholder - Parameter placeholder
 * @returns SQL condition string
 * @throws Error if the parameter placeholder is required for the filter operator
 * @example buildLikeOperator('users.name', 'like', '$1') // "users.name LIKE $1"
 * @example buildLikeOperator('users.name', 'ilike', '$1') // "users.name ILIKE $1"
 */
const buildLikeOperator = (columnRef: string, filter: string, placeholder?: Placeholder | Placeholder[]): string => {
    if (placeholder === undefined) {
        throw new Error(`Parameter placeholder is required for filter operator: ${filter}`);
    }
    return `${columnRef} ${filter} ${placeholder}`;
}

/**
 * Builds a null operator
 * @param columnRef - Column reference
 * @param filter - IS NULL operator
 * @returns SQL condition string
 * @throws Error if the IS NULL operator is invalid
 * @example buildIsNullOperator('users.name', 'is null') // "users.name IS NULL"
 */
const buildIsNullOperator = (columnRef: string, filter: string): string => {
    return `${columnRef} ${filter}`;
}

const whereBuilders: Record<string, WhereBuilder> = {
    '>': buildComparisonOperator,
    '<': buildComparisonOperator,
    '>=': buildComparisonOperator,
    '<=': buildComparisonOperator,
    '=': buildComparisonOperator,
    '!=': buildComparisonOperator,
    'in': buildInOperator,
    'not in': buildInOperator,
    'like': buildLikeOperator,
    'ilike': buildLikeOperator,
    'is null': buildIsNullOperator,
    'is not null': buildIsNullOperator,
}

/**
 * Builds a where condition from a WhereOption
 * @param whereOption - WHERE condition option
 * @param placeholderOffset - Starting offset for placeholder numbering (1-based)
 * @returns WhereConditionResult containing condition string, values array, and placeholder count
 */
const buildWhereCondition = (whereOption: WhereOption, placeholderOffset: number): WhereConditionResult => {
    const {tableName, column, filter} = whereOption;
    const columnRef = `${tableName}.${column}`;
    if(!whereBuilders[filter]) {
        throw new Error(`Unsupported filter operator: ${filter}`);
    }
    const whereBuilder = whereBuilders[filter];
    if (isNullOperator(filter)) {
        return [whereBuilder(columnRef, filter), [], 0];
    }
    if (whereOption.value === undefined) {
        throw new Error(`Value is required for filter operator: ${filter}`);
    }
    const values = Array.isArray(whereOption.value) ? whereOption.value : [whereOption.value];
    const [placeholder, placeholderCount] = generatePlaceholders(filter, whereOption.value, placeholderOffset);
    const condition = whereBuilder(columnRef, filter, placeholder);
    return [condition, values, placeholderCount];
};

/**
 * Generates SQL parameter placeholders for a WHERE condition
 * @param filter - Filter operator type
 * @param value - Value(s) for the filter (can be single value or array)
 * @param placeholderOffset - Starting offset for placeholder numbering (1-based)
 * @returns Tuple of [placeholder(s), number of placeholders used]
 * @example generatePlaceholders('in', ['a', 'b', 'c'], 1) // [['$1', '$2', '$3'], 3]
 * @example generatePlaceholders('=', 'value', 1) // ['$1', 1]
 */
const generatePlaceholders = (
    filter: string,
    value: unknown | unknown[],
    placeholderOffset: number
): [Placeholder | Placeholder[], number] => {
    // Determine if value is an array and get the count
    const isArray = Array.isArray(value);
    const valueCount = isArray ? value.length : 1;
    if (valueCount === 0) {
        throw new Error(`Value is required for filter operator: ${filter}`);
    } else if(isInOperator(filter) && !isArray) {
        throw new Error(`Array value is required for filter operator: ${filter}`);
    } else if (isInOperator(filter)) {
        const placeholders = generatePlaceholderArray(valueCount, placeholderOffset);
        return [placeholders, valueCount];
    } else{
        return [`$${placeholderOffset}`, 1];
    }
}

/**
 * Builds conditions and collects values from an array of WhereOptions
 * @param whereOptions - Array of WHERE condition options
 * @returns Tuple of [conditions array, values array]
 */
const buildConditionsAndValues = (whereOptions: WhereOption[]): [string[], unknown[]] => {
    const values: unknown[] = []
    const conditions: string[] = []
    let placeholderOffset = 1;
    
    for (const option of whereOptions) {
        const [condition, optionValues, placeholderCount] = buildWhereCondition(option, placeholderOffset);
        values.push(...optionValues);
        conditions.push(condition);
        placeholderOffset += placeholderCount;
    }
    
    return [conditions, values];
};

/**
 * Builds a where composition clause
 * @param whereCompositionOption - WHERE composition option
 * @returns SQL condition string
 * @throws Error if the WHERE composition option is invalid
 * @example
 * buildWhereCompositionClause( { compositionOption: 'or', whereOptions: [
 *   { tableName: 'users', column: 'name', filter: '=', value: 'michael' },
 *   { tableName: 'users', column: 'email', filter: 'like', value: 'test@example.com' }
 * ] }) // "($users.name = $1 or users.email LIKE $2)" with corresponding values ['michael', 'test@example.com']
 *
 */
const buildWhereCompositionClause = (whereCompositionOption: WhereCompositionOption): [string, unknown[]] => {
    const {compositionOption, whereOptions} = whereCompositionOption;
    const [conditions, values] = buildConditionsAndValues(whereOptions);
    const text = `(${conditions.join(` ${compositionOption} `)})`;
    return [text, values];
};

/**
 * Builds a WHERE clause from WhereOption or WhereCompositionOption
 * @param whereClause - where clause definition (WhereOption or WhereCompositionOption)
 * @returns SQL where clause string
 * @throws Error if the where clause is invalid
 *
 * @example
 * buildWhereClause({
 *   compositionOption: 'and',
 *   whereOptions: [
 *     { tableName: 'users', column: 'name', filter: '=', value: 'michael' },
 *     { tableName: 'users', column: 'email', filter: 'like', value: 'test@example.com' },
 *   ],
 * }) // "($users.name = $1 and users.email LIKE $2)" with values ['michael', 'test@example.com']
 * @example
 * buildWhereClause([
 *   { tableName: 'users', column: 'name', filter: '=', value: 'michael' },
 *   { tableName: 'users', column: 'email', filter: 'like', value: 'test@example.com' },
 * ]) // "where users.name = $1 and users.email LIKE $2" with values ['michael', 'test@example.com']
 */
export const buildWhereClause = (whereClause: WhereOption[] | WhereCompositionOption): [string, unknown[]] => {
    // Handle WhereCompositionOption first
    if (isWhereCompositionOption(whereClause)) {
        return buildWhereCompositionClause(whereClause);
    } else {
        const [conditions, values] = buildConditionsAndValues(whereClause);
        const text = conditions.join(' and ');
        return ['where ' + text, values];
    }

};