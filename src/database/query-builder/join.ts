import {Join} from '../types/query-types';

const generateJoinCondition = (columns: [string, string]): string => {
    const [sourceColumn, targetColumn] = columns;
    return `${sourceColumn} = ${targetColumn}`
};

const setupTableRelationships = (joins: Join): [string, string][] => {
    const {sourceTable, targetTable, relationship} = joins;
    return relationship.map(([sourceCol, targetCol]) => [`${sourceTable}.${sourceCol}`, `${targetTable}.${targetCol}`]);
};

/**
 * Builds a join clause
 * @param join - Join definition
 * @returns SQL join clause string
 * @throws Error if the join is invalid
 * @example buildJoinClause({ joinOperator: 'join', sourceTable: 'users', targetTable: 'address', relationship: [['address_id', 'id']] }) // "join address on users.address_id = address.id"
 */
export const buildJoinClause = (join: Join): string => {
    const relationships = setupTableRelationships(join);
    const conditions = relationships.map(generateJoinCondition).join(' and ');
    return `${join.joinOperator} ${join.targetTable} on ${conditions}`;
};
  
