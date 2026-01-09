export const QUERY_FILTER_KEY = [
    '>', '<', '>=', '<=', '=', '!=', 'in', 'not in', 'like', 'ilike', 'is null', 'is not null'
] as const;

export type QueryFilterKey = typeof QUERY_FILTER_KEY[number];

/**
 * Join type
 */
export type Join = {
    joinOperator: 'join' | 'left join' | 'right join';
    sourceTable: string;
    targetTable: string;
    relationship: [string, string][];
};

export type Placeholder = `$${number}`;

/**
 * Individual WHERE condition option
 * @property tableName - Name of the table
 * @property column - Name of the column
 * @property filter - Comparison operator
 * @property value - Value(s) for the filter. Can be a single value or array for 'in'/'not in' operators. Not required for 'is null'/'is not null'
 */
export type WhereOption = {
    tableName: string;
    column: string;
    filter: QueryFilterKey;
    value?: unknown | unknown[];
};


/**
 * Composition of WHERE conditions with AND/OR logic
 * @property compositionOption - Logical operator to combine conditions
 * @property whereOptions - Array of WHERE conditions to combine
 */
export type WhereCompositionOption = {
    compositionOption: 'and' | 'or';
    whereOptions: WhereOption[];
};


export type WhereBuilder = (columnRef: string, filter: string, placeholder?: Placeholder | Placeholder[]) => string;

/**
 * Group by option
 * @property tableName - Name of the table
 * @property column - Name of the column
 */
export type GroupByOption = {
    tableName: string;
    column: string;
};

/**
 * Order by option
 * @property tableName - Name of the table
 * @property column - Name of the column
 * @property orderOption - Order option ('asc' or 'desc')
 */
export type OrderByOption = {
    tableName: string;
    column: string;
    orderOption: 'asc' | 'desc';
};


export type SetClause = {
    column: string;
    placeholder: Placeholder;
    value: unknown;
}

/**
 * Options for building a select query
 * @property selectColumns - Columns to select
 * @property fromTable - Table to select from
 * @property joinClauses - Optional join clauses
 * @property whereClause - Optional where clause
 * @property groupBy - Optional group BY options
 * @property orderBy - Optional order BY options
 * @property limit - Optional limit value
 * @property offset - Optional offset value
 */
export type BuildSelectQueryOptions = {
    selectColumns: string[];
    fromTable: string;
    joinClauses?: Join[];
    whereClause?: WhereOption[] | WhereCompositionOption;
    groupBy?: GroupByOption[];
    orderBy?: OrderByOption[];
    limit?: number;
    offset?: number;
};


/**
 * Options for building an update query
 * @property fromTable - Table to update
 * @property joinClauses - Optional join clauses
 * @property whereClause - Optional where clause
 */
export type BuildUpdateQueryOptions = {
    tableName: string;
    setClauses: SetClause[];
    joinClauses?: Join[];
    whereClause: WhereOption[] | WhereCompositionOption;
};