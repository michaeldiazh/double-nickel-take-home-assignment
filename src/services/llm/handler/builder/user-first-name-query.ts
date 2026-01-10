/**
 * Query builder for loading user first name from an application ID.
 * Joins application -> user to get the user's first name.
 */

import { buildSelectQuery } from '../../../../database/query-builder/select';
import { generateWhereFilters } from '../../../filters/where-filter';
import type { Join } from '../../../../database/types/query-types';

/**
 * Builds the join clauses for user first name query.
 * Joins application -> user to get user data.
 * 
 * @returns Array of Join clause configurations
 */
const buildUserFirstNameJoinClauses = (): Join[] => {
  return [
    {
      joinOperator: 'join',
      sourceTable: 'application',
      targetTable: 'users',
      relationship: [['user_id', 'id']],
    },
  ];
};

/**
 * Builds a query to load user first name from an application ID.
 * Joins application -> user to get the user's first name.
 * 
 * @param appId - The UUID of the application
 * @returns Query object with query string and values array
 */
export const buildUserFirstNameQuery = (appId: string) => {
  const whereOptions = generateWhereFilters('application', {
    id: { equals: appId },
  });

  return buildSelectQuery({
    selectColumns: ['users.first_name'],
    fromTable: 'application',
    joinClauses: buildUserFirstNameJoinClauses(),
    whereClause: whereOptions,
    limit: 1,
  });
};

