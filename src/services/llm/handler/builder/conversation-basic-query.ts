/**
 * Query builder for loading basic conversation data.
 * Gets conversation ID and application ID for a given conversation ID.
 */

import { buildSelectQuery } from '../../../../database/query-builder/select';
import { generateWhereFilters } from '../../../filters/where-filter';

/**
 * Builds a query to load basic conversation data (conversation ID and application ID).
 * 
 * @param conversationId - The UUID of the conversation
 * @returns Query object with query string and values array
 */
export const buildConversationBasicQuery = (conversationId: string) => {
  const whereOptions = generateWhereFilters('conversation', {
    id: { equals: conversationId },
  });

  return buildSelectQuery({
    selectColumns: ['conversation.id', 'conversation.app_id'],
    fromTable: 'conversation',
    whereClause: whereOptions,
    limit: 1,
  });
};

