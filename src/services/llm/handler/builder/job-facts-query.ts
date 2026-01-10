/**
 * Query builder for loading job facts with nested job and fact type.
 * Similar pattern to conversation-requirements-query.ts but loads job_facts.
 */

import type { Join, GroupByOption, WhereOption } from '../../../../database/types/query-types';
import { buildSelectQuery } from '../../../../database/query-builder/select';

/**
 * Mapping of job fact fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const jobFactFields: [string, string][] = [
  ['id', 'job_facts.id'],
  ['content', 'job_facts.content'],
];

/**
 * Mapping of job facts type fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const jobFactsTypeFields: [string, string][] = [
  ['id', 'job_facts_type.id'],
  ['factType', 'job_facts_type.fact_type'],
  ['factDescription', 'job_facts_type.fact_description'],
];

/**
 * Mapping of job fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const jobFields: [string, string][] = [
  ['id', 'job.id'],
  ['name', 'job.name'],
  ['description', 'job.description'],
  ['paymentType', 'job.payment_type'],
  ['hourlyPay', 'job.hourly_pay'],
  ['milesPay', 'job.miles_pay'],
  ['salaryPay', 'job.salary_pay'],
  ['addressId', 'job.address_id'],
  ['isActive', 'job.is_active'],
];

/**
 * Builds a PostgreSQL json_build_object expression (not jsonb_build_object).
 * Similar to buildJsonObject but uses json_build_object for consistency with json_agg.
 * 
 * @param fields - Array of [json_key, database_column_or_json_expression] tuples
 * @param indent - Optional indentation string (default: '    ')
 * @returns SQL expression string for json_build_object
 */
const buildJsonObjectForAgg = (fields: [string, string][], indent: string = '    '): string => {
  const keyValuePairs = fields
    .map(([key, value]) => {
      // If value contains newlines, it's a nested JSON object - indent it properly
      if (value.includes('\n')) {
        const indentedValue = value
          .split('\n')
          .map((line, index) => index === 0 ? line : `${indent}${line}`)
          .join('\n');
        return `'${key}', ${indentedValue}`;
      }
      return `'${key}', ${value}`;
    })
    .join(`,\n${indent}`);
  
  return `json_build_object(
${indent}${keyValuePairs}
  )`;
};

/**
 * Builds the JSON object for job facts type using PostgreSQL json_build_object.
 * 
 * @returns SQL expression string for building the factType JSON object
 */
const buildFactTypeJson = (): string => {
  return buildJsonObjectForAgg(jobFactsTypeFields);
};

/**
 * Builds the JSON object for job using PostgreSQL json_build_object.
 * 
 * @returns SQL expression string for building the job JSON object
 */
const buildJobJson = (): string => {
  return buildJsonObjectForAgg(jobFields);
};

/**
 * Builds the select column expression for job facts query.
 * Uses PostgreSQL JSON functions to return structured JobFacts objects.
 * Uses json_agg (not jsonb_array_agg) as per pattern.
 * 
 * @returns SQL expression string for the select column
 */
const buildJobFactsSelectColumn = (): string => {
  // Build the main job fact object fields
  const jobFactFieldsWithObjects: [string, string][] = [
    ...jobFactFields,
    ['job', buildJobJson()],
    ['factType', buildFactTypeJson()],
    ['createdAt', 'job_facts.created_at'],
    ['updatedAt', 'job_facts.updated_at'],
  ];
  
  const jobFactObject = buildJsonObjectForAgg(jobFactFieldsWithObjects, '      ');
  
  // Use json_agg instead of jsonb_array_agg (as per pattern)
  return `json_agg(
    ${jobFactObject}
    ORDER BY job_facts.created_at ASC
  ) as job_facts`;
};

/**
 * Builds the join clauses for job facts query.
 * Joins job_facts with job_facts_type and job to get full entity information.
 * 
 * @returns Array of Join clause configurations
 */
const buildJobFactsJoinClauses = (): Join[] => {
  return [
    {
      joinOperator: 'join',
      sourceTable: 'job_facts',
      targetTable: 'job_facts_type',
      relationship: [['fact_type_id', 'id']],
    },
    {
      joinOperator: 'join',
      sourceTable: 'job_facts',
      targetTable: 'job',
      relationship: [['job_id', 'id']],
    },
  ];
};

/**
 * Builds the group by clause for job facts query.
 * Groups by job_id since we're aggregating facts per job.
 * 
 * @returns GroupByOption array
 */
const buildJobFactsGroupBy = (): GroupByOption[] => {
  return [
    {
      tableName: 'job_facts',
      column: 'job_id',
    },
  ];
};

/**
 * Builds a query to load job facts with their job and fact type for a given job ID.
 * Joins job_facts with job_facts_type and job.
 * Aggregates results as JSON array.
 * 
 * @param jobId - The UUID of the job
 * @returns Query object with query string and values array
 */
export const buildJobFactsQuery = (jobId: string) => {
  // Build WHERE clause directly since 'jobFacts' domain is not in WhereFilterConfigurations
  const whereClause: WhereOption[] = [
    {
      tableName: 'job_facts',
      column: 'job_id',
      filter: '=',
      value: jobId,
    },
  ];

  return buildSelectQuery({
    selectColumns: [buildJobFactsSelectColumn()],
    fromTable: 'job_facts',
    joinClauses: buildJobFactsJoinClauses(),
    whereClause,
    groupBy: buildJobFactsGroupBy(),
  });
};
