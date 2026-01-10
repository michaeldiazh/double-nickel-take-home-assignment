/**
 * Query builder for loading job info (job ID and title) from an application ID.
 * Joins application -> job to get job information.
 */

import { buildSelectQuery } from '../../../../database/query-builder/select';
import { generateWhereFilters } from '../../../filters/where-filter';
import type { Join } from '../../../../database/types/query-types';

/**
 * Builds the join clauses for job info query.
 * Joins application -> job to get job data.
 * 
 * @returns Array of Join clause configurations
 */
const buildJobInfoJoinClauses = (): Join[] => {
  return [
    {
      joinOperator: 'join',
      sourceTable: 'application',
      targetTable: 'job',
      relationship: [['job_id', 'id']],
    },
  ];
};

/**
 * Builds a query to load job info (job ID and title) from an application ID.
 * Joins application -> job to get job information.
 * 
 * @param appId - The UUID of the application
 * @returns Query object with query string and values array
 */
export const buildJobInfoQuery = (appId: string) => {
  const whereOptions = generateWhereFilters('application', {
    id: { equals: appId },
  });

  return buildSelectQuery({
    selectColumns: ['job.id', 'job.name'],
    fromTable: 'application',
    joinClauses: buildJobInfoJoinClauses(),
    whereClause: whereOptions,
    limit: 1,
  });
};

