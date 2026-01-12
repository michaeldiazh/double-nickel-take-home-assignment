/**
 * Tests for ConversationRepository
 */

import { Pool, QueryResult } from 'pg';
import { ConversationRepository } from '../../../src/entities/conversation/repository';
import { Conversation, ConversationStatus, ScreeningDecision, conversationSchema } from '../../../src/entities/conversation/domain';

describe('ConversationRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: ConversationRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new ConversationRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getByApplicationId', () => {
    it('should return conversation by application ID', async () => {
      const applicationId = '123e4567-e89b-4d3a-a456-426614174030';
      const conversationId = '123e4567-e89b-4d3a-a456-426614174031';
      
      const mockRow = {
        id: conversationId,
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.APPROVED,
        screening_summary: 'Candidate meets all requirements',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getByApplicationId(applicationId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[0]).toContain('WHERE application_id = $1');
      expect(callArgs[0]).toContain('ORDER BY created_at DESC');
      expect(callArgs[0]).toContain('LIMIT 1');
      expect(callArgs[1]).toEqual([applicationId]);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(conversationId);
        expect(result.application_id).toBe(applicationId);
        expect(result.screening_decision).toBe(ScreeningDecision.APPROVED);
      }
    });

    it('should return null when no conversation found', async () => {
      const applicationId = '123e4567-e89b-4d3a-a456-426614174032';

      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getByApplicationId(applicationId);

      expect(result).toBeNull();
    });

    it('should return the most recent conversation when multiple exist', async () => {
      const applicationId = '123e4567-e89b-4d3a-a456-426614174033';
      const newerConversationId = '123e4567-e89b-4d3a-a456-426614174034';
      
      const mockRow = {
        id: newerConversationId,
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.DONE,
        screening_decision: ScreeningDecision.DENIED,
        screening_summary: 'Latest conversation',
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-02'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getByApplicationId(applicationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [applicationId]
      );
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(newerConversationId);
        expect(result.created_at).toEqual(new Date('2024-01-02'));
      }
    });

    it('should handle all screening decision types', async () => {
      const applicationId = '123e4567-e89b-4d3a-a456-426614174035';
      const decisions = [
        ScreeningDecision.APPROVED,
        ScreeningDecision.DENIED,
        ScreeningDecision.PENDING,
        ScreeningDecision.USER_CANCELED,
      ];

      for (const decision of decisions) {
        const mockRow = {
          id: `123e4567-e89b-4d3a-a456-4266141740${decisions.indexOf(decision) + 40}`,
          application_id: applicationId,
          is_active: true,
          conversation_status: ConversationStatus.DONE,
          screening_decision: decision,
          screening_summary: `Summary for ${decision}`,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        };

        const mockResult = {
          rows: [mockRow],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        } as QueryResult;

        mockQuery.mockResolvedValue(mockResult);

        const result = await repository.getByApplicationId(applicationId);

        expect(result).not.toBeNull();
        if (result) {
          expect(result.screening_decision).toBe(decision);
        }

        jest.clearAllMocks();
      }
    });

    it('should handle null screening_summary', async () => {
      const applicationId = '123e4567-e89b-4d3a-a456-426614174036';
      const conversationId = '123e4567-e89b-4d3a-a456-426614174037';
      
      const mockRow = {
        id: conversationId,
        application_id: applicationId,
        is_active: true,
        conversation_status: ConversationStatus.ON_REQ,
        screening_decision: ScreeningDecision.PENDING,
        screening_summary: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getByApplicationId(applicationId);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.screening_summary).toBeNull();
      }
    });
  });
});
