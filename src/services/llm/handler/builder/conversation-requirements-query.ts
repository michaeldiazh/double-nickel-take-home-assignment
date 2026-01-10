/**
 * Query builder for loading conversation requirements with nested job requirements.
 * Similar pattern to requirements-query.ts but loads conversation_requirements with full nested entities.
 */

import type { Join, GroupByOption, WhereOption } from '../../../../database/types/query-types';
import { buildSelectQuery } from '../../../../database/query-builder/select';

/**
 * Mapping of conversation requirement fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const conversationRequirementFields: [string, string][] = [
  ['id', 'conversation_requirements.id'],
  ['messageId', 'conversation_requirements.message_id'],
  ['status', 'conversation_requirements.status'],
  ['value', 'conversation_requirements.value'],
  ['lastUpdated', 'conversation_requirements.last_updated'],
  ['createdAt', 'conversation_requirements.created_at'],
];

/**
 * Mapping of application fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const applicationFields: [string, string][] = [
  ['id', 'application.id'],
  ['userId', 'application.user_id'],
  ['jobId', 'application.job_id'],
  ['appliedOn', 'application.applied_on'],
  ['status', 'application.status'],
];

/**
 * Mapping of conversation fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const conversationFields: [string, string][] = [
  ['id', 'conversation.id'],
  ['appId', 'conversation.app_id'],
  ['isActive', 'conversation.is_active'],
  ['screeningDecision', 'conversation.screening_decision'],
  ['screeningSummary', 'conversation.screening_summary'],
  ['screeningReasons', 'conversation.screening_reasons'],
  ['endedAt', 'conversation.ended_at'],
];

/**
 * Mapping of job requirement fields to their database column references.
 * Format: [['json_key', 'table.column'], ...]
 */
const jobRequirementFields: [string, string][] = [
  ['id', 'job_requirements.id'],
  ['criteria', 'job_requirements.criteria'],
  ['priority', 'job_requirements.priority'],
  ['createdAt', 'job_requirements.created_at'],
  ['updatedAt', 'job_requirements.updated_at'],
];

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
 * Builds the JSON object for application using PostgreSQL json_build_object.
 * 
 * @returns SQL expression string for building the application JSON object
 */
const buildApplicationJson = (): string => {
  return buildJsonObjectForAgg(applicationFields);
};

/**
 * Builds the JSON object for conversation (with nested application) using PostgreSQL json_build_object.
 * 
 * @returns SQL expression string for building the conversation JSON object
 */
const buildConversationJson = (): string => {
  const conversationFieldsWithApplication: [string, string][] = [
    ...conversationFields,
    ['application', buildApplicationJson()],
  ];
  
  return buildJsonObjectForAgg(conversationFieldsWithApplication);
};

/**
 * Builds the JSON object for requirement type using PostgreSQL json_build_object.
 * 
 * @returns SQL expression string for building the requirementType JSON object
 */
const buildRequirementTypeJson = (): string => {
  return buildJsonObjectForAgg(requirementTypeFields);
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
 * Builds the JSON object for job requirements (with nested job and jobRequirementType).
 * 
 * @returns SQL expression string for building the jobRequirements JSON object
 */
const buildJobRequirementsJson = (): string => {
  const jobRequirementFieldsWithObjects: [string, string][] = [
    ...jobRequirementFields,
    ['job', buildJobJson()],
    ['jobRequirementType', buildRequirementTypeJson()],
  ];
  
  return buildJsonObjectForAgg(jobRequirementFieldsWithObjects);
};

/**
 * Builds the select column expression for conversation requirements query.
 * Uses PostgreSQL JSON functions to return structured ConversationRequirements objects.
 * Uses json_agg (not jsonb_array_agg) as per user's working query.
 * 
 * @returns SQL expression string for the select column
 */
const buildConversationRequirementsSelectColumn = (): string => {
  // Build the main conversation requirement object fields
  const conversationRequirementFieldsWithObjects: [string, string][] = [
    ...conversationRequirementFields,
    ['conversation', buildConversationJson()],
    ['jobRequirements', buildJobRequirementsJson()],
  ];
  
  const conversationRequirementObject = buildJsonObjectForAgg(conversationRequirementFieldsWithObjects, '      ');
  
  // Use json_agg instead of jsonb_array_agg (as per user's working query)
  return `json_agg(
    ${conversationRequirementObject}
    ORDER BY job_requirements.priority ASC
  ) as conversation_requirements`;
};

/**
 * Builds the join clauses for conversation requirements query.
 * Joins conversation_requirements with job_requirements, job_requirement_type, job, conversation, and application.
 * 
 * @returns Array of Join clause configurations
 */
const buildConversationRequirementsJoinClauses = (): Join[] => {
  return [
    {
      joinOperator: 'join',
      sourceTable: 'conversation_requirements',
      targetTable: 'job_requirements',
      relationship: [['requirement_id', 'id']],
    },
    {
      joinOperator: 'join',
      sourceTable: 'job_requirements',
      targetTable: 'job_requirement_type',
      relationship: [['job_requirement_type_id', 'id']],
    },
    {
      joinOperator: 'join',
      sourceTable: 'job_requirements',
      targetTable: 'job',
      relationship: [['job_id', 'id']],
    },
    {
      joinOperator: 'join',
      sourceTable: 'conversation_requirements',
      targetTable: 'conversation',
      relationship: [['conversation_id', 'id']],
    },
    {
      joinOperator: 'join',
      sourceTable: 'conversation',
      targetTable: 'application',
      relationship: [['app_id', 'id']],
    },
  ];
};

/**
 * Builds the group by clause for conversation requirements query.
 * Groups by conversation_id since we're aggregating requirements per conversation.
 * 
 * @returns GroupByOption array
 */
const buildConversationRequirementsGroupBy = (): GroupByOption[] => {
  return [
    {
      tableName: 'conversation_requirements',
      column: 'conversation_id',
    },
  ];
};

/**
 * Builds a query to load conversation requirements with their job requirements for a given conversation ID.
 * Joins conversation_requirements with job_requirements, job_requirement_type, job, conversation, and application.
 * Aggregates results as JSON array.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Query object with query string and values array
 */
export const buildConversationRequirementsQuery = (conversationId: string) => {
  // Build WHERE clause directly since generateWhereFilters may not work correctly for this domain
  const whereClause: WhereOption[] = [
    {
      tableName: 'conversation_requirements',
      column: 'conversation_id',
      filter: '=',
      value: conversationId,
    },
  ];

  return buildSelectQuery({
    selectColumns: [buildConversationRequirementsSelectColumn()],
    fromTable: 'conversation_requirements',
    joinClauses: buildConversationRequirementsJoinClauses(),
    whereClause,
    groupBy: buildConversationRequirementsGroupBy(),
  });
};
