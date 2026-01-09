import type { Join, GroupByOption, OrderByOption } from '../../../database/types/query-types';
import { generateWhereFilters } from '../../filters/where-filter';
import { buildSelectQuery } from '../../../database/query-builder/select';

/**
 * Generic function to build a PostgreSQL jsonb_build_object expression from field mappings.
 * Handles both simple column references and nested JSON expressions.
 * 
 * @param fields - Array of [json_key, database_column_or_json_expression] tuples
 * @param indent - Optional indentation string (default: '    ')
 * @returns SQL expression string for jsonb_build_object
 */
export const buildJsonObject = (fields: [string, string][], indent: string = '    '): string => {
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
  
  return `jsonb_build_object(
${indent}${keyValuePairs}
  )`;
};

/**
 * Mapping of requirement type fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const requirementTypeFields: [string, string][] = [
  ['id', 'job_requirement_type.id'],
  ['requirementType', 'job_requirement_type.requirement_type'],
  ['requirementDescription', 'job_requirement_type.requirement_description'],
];

/**
 * Mapping of job requirement fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const jobRequirementFields: [string, string][] = [
  ['id', 'job_requirements.id'],
  ['jobId', 'job_requirements.job_id'],
  ['requirementTypeId', 'job_requirements.job_requirement_type_id'],
  ['criteria', 'job_requirements.criteria'],
  ['priority', 'job_requirements.priority'],
];

/**
 * Builds the JSON object for requirement type using PostgreSQL jsonb_build_object.
 * 
 * @returns SQL expression string for building the requirementType JSON object
 */
const buildRequirementTypeJson = (): string => {
  return buildJsonObject(requirementTypeFields);
};

/**
 * Builds the select column expression for job requirements query.
 * Uses PostgreSQL JSON functions to return structured JobRequirementWithType objects.
 * 
 * @returns SQL expression string for the select column
 */
const buildRequirementsSelectColumn = (): string => {
  // Build the main requirement object fields
  const requirementFieldsWithType: [string, string][] = [
    ...jobRequirementFields,
    ['requirementType', buildRequirementTypeJson()],
  ];
  
  const requirementObject = buildJsonObject(requirementFieldsWithType, '      ');
  
  return `jsonb_array_agg(
    ${requirementObject}
    ORDER BY job_requirements.priority ASC
  ) as requirements`;
};

/**
 * Builds the join clause for job requirements query.
 * Joins job_requirements with job_requirement_type to get requirement type information.
 * 
 * @returns Join clause configuration
 */
const buildRequirementsJoinClause = (): Join => {
  return {
    joinOperator: 'join',
    sourceTable: 'job_requirements',
    targetTable: 'job_requirement_type',
    relationship: [['job_requirement_type_id', 'id']],
  };
};

/**
 * Builds the group by clause for job requirements query.
 * Groups by job_id since we're aggregating requirements per job.
 * 
 * @returns GroupByOption array
 */
const buildRequirementsGroupBy = (): GroupByOption[] => {
  return [
    { tableName: 'job_requirements', column: 'job_id' },
  ];
};

/**
 * Builds a query to get the job_id from a conversation.
 * Joins conversation -> application to retrieve the job_id.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Query object with query string and values array
 */
export const buildJobIdFromConversationQuery = (conversationId: string) => {
  const whereOptions = generateWhereFilters('conversation', {
    id: { equals: conversationId },
  });

  return buildSelectQuery({
    selectColumns: ['application.job_id'],
    fromTable: 'conversation',
    joinClauses: [
      {
        joinOperator: 'join',
        sourceTable: 'conversation',
        targetTable: 'application',
        relationship: [['app_id', 'id']],
      },
    ],
    whereClause: whereOptions,
  });
};

/**
 * Builds a query to load job requirements with their types for a given job ID.
 * Joins job_requirements with job_requirement_type and aggregates results as JSON.
 * 
 * @param jobId - The UUID of the job
 * @returns Query object with query string and values array
 */
export const buildRequirementsByJobIdQuery = (jobId: string) => {
  const whereOptions = generateWhereFilters('jobRequirements', {
    job: {
      id: { equals: jobId }
    }
  });

  return buildSelectQuery({
    selectColumns: [buildRequirementsSelectColumn()],
    fromTable: 'job_requirements',
    joinClauses: [buildRequirementsJoinClause()],
    whereClause: whereOptions,
    groupBy: buildRequirementsGroupBy(),
  });
};

/**
 * Builds a query to get the top X most recently created active jobs.
 * Used for cache warm-up on application startup.
 * 
 * @param limit - Number of jobs to load (default: 10)
 * @returns Query object with query string and values array
 */
export const buildTopXActiveJobsQuery = (limit: number = 10) => {
  const whereOptions = generateWhereFilters('job', {
    isActive: { equals: true },
  });

  const orderBy: OrderByOption[] = [
    {
      tableName: 'job',
      column: 'created_at',
      orderOption: 'desc',
    },
  ];

  return buildSelectQuery({
    selectColumns: ['job.id'],
    fromTable: 'job',
    whereClause: whereOptions,
    orderBy,
    limit,
  });
};

