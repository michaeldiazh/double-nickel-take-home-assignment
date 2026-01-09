"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSelectQuery = void 0;
const join_1 = require("./join");
const where_1 = require("./where");
const generateJoinsClause = (joinClauses) => {
    if (!joinClauses)
        return '';
    return joinClauses.map((join) => (0, join_1.buildJoinClause)(join)).join(' ');
};
const generateWhereClause = (whereClause) => {
    if (!whereClause)
        return ['', []];
    return (0, where_1.buildWhereClause)(whereClause);
};
const generateOrderByClause = (orderBy) => {
    if (!orderBy)
        return '';
    const columns = orderBy.map((order) => `${order.tableName}.${order.column} ${order.orderOption}`).join(', ');
    return `order by ${columns}`;
};
const generateLimitClause = (limit) => {
    if (!limit)
        return '';
    return `limit ${limit}`;
};
const generateOffsetClause = (offset) => {
    if (!offset)
        return '';
    return `offset ${offset}`;
};
const generateGroupByClause = (groupBy) => {
    if (!groupBy)
        return '';
    const columns = groupBy.map((group) => `${group.tableName}.${group.column}`).join(', ');
    return `group by ${columns}`;
};
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
const buildSelectQuery = (options) => {
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
    return { query, values };
};
exports.buildSelectQuery = buildSelectQuery;
