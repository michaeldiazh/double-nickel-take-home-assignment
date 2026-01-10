/**
 * Query builder for loading messages for a conversation.
 * Orders messages by creation time ascending.
 */

import { buildSelectQuery } from '../../../../database/query-builder/select';
import type { WhereOption, OrderByOption } from '../../../../database/types/query-types';

/**
 * Builds the WHERE clause for messages query.
 * Filters messages by conversation ID.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Array of WhereOption configurations
 */
const buildMessagesWhereClause = (conversationId: string): WhereOption[] => {
  return [
    {
      tableName: 'message',
      column: 'conversation_id',
      filter: '=',
      value: conversationId,
    },
  ];
};

/**
 * Builds the ORDER BY clause for messages query.
 * Orders messages by creation time ascending.
 * 
 * @returns Array of OrderByOption configurations
 */
const buildMessagesOrderBy = (): OrderByOption[] => {
  return [
    {
      tableName: 'message',
      column: 'created_at',
      orderOption: 'asc',
    },
  ];
};

/**
 * Builds a query to load messages for a conversation, ordered by creation time.
 * Builds WHERE clause directly since 'message' domain is not in WhereFilterConfigurations.
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Query object with query string and values array
 */
export const buildMessagesQuery = (conversationId: string) => {
  return buildSelectQuery({
    selectColumns: ['message.sender', 'message.content'],
    fromTable: 'message',
    whereClause: buildMessagesWhereClause(conversationId),
    orderBy: buildMessagesOrderBy(),
  });
};

