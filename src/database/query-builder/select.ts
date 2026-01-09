import type {
    GroupByOption,
    Join,
    OrderByOption,
    WhereCompositionOption,
    WhereOption,
    BuildSelectQueryOptions
} from '../types/query-types';
import {buildJoinClause} from './join';
import {buildWhereClause} from './where';
import {QueryValues} from "../types";

const generateJoinsClause = (joinClauses?: Join[]): string => {
    if (!joinClauses) return '';
    return joinClauses.map((join) => buildJoinClause(join)).join(' ');
}

const generateWhereClause = (whereClause?: WhereOption[] | WhereCompositionOption): [string, unknown[]] => {
    if (!whereClause) return ['', []];
    return buildWhereClause(whereClause)
}

const generateOrderByClause = (orderBy?: OrderByOption[]): string => {
    if (!orderBy) return '';
    const columns = orderBy.map((order) => `${order.tableName}.${order.column} ${order.orderOption}`).join(', ');
    return `order by ${columns}`;
}

const generateLimitClause = (limit?: number): string => {
    if (!limit) return '';
    return `limit ${limit}`;
}

const generateOffsetClause = (offset?: number): string => {
    if (!offset) return '';
    return `offset ${offset}`;
}

const generateGroupByClause = (groupBy?: GroupByOption[]): string => {
    if (!groupBy) return '';
    const columns = groupBy.map((group) => `${group.tableName}.${group.column}`).join(', ');
    return `group by ${columns}`;
}

/**
 * Builds a select query
 * @param options - BuildSelectQueryOptions
 * @returns SQL select query string
 * @throws Error if the options are invalid
 * @example
 * buildSelectQuery({
 *   selectColumns: ['id', 'name', 'email'],
 *   fromTable: 'users',
 *   joinClauses: [{ joinOperator: 'join', sourceTable: 'users', targetTable: 'address', relationship: [['address_id', 'id']] }],
 *   whereClause: { tableName: 'users', column: 'name', filter: '=', placeholder: '$1' },
 *   orderBy: [{ tableName: 'users', column: 'created_at', orderOption: 'desc' }],
 *   limit: 10,
 *   offset: 0,
 * }) // "select id, name, email from users join address on users.address_id = address.id where users.name = $1 order by users.created_at desc limit 10 offset 0"
 *    // with corresponding values ['michael']
 */
export const buildSelectQuery = (options: BuildSelectQueryOptions): QueryValues => {
    const [whereClause, values] = generateWhereClause(options.whereClause);
    const query = `
    select ${options.selectColumns.join(', ')}
    from ${options.fromTable}
    ${generateJoinsClause(options.joinClauses)}
    ${whereClause}
    ${generateGroupByClause(options.groupBy)}
    ${generateOrderByClause(options.orderBy)}
    ${generateLimitClause(options.limit)}
    ${generateOffsetClause(options.offset)}
  `.trim(); // trim trailing whitespace
    return {query, values};
}

