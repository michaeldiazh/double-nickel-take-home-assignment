/**
 * Tests for ConversationJobRequirementRepository
 */

import { Pool, QueryResult } from 'pg';
import { ConversationJobRequirementRepository } from '../../../src/entities/conversation-job-requirement/repository';
import { RequirementStatus } from '../../../src/entities/conversation-job-requirement/domain';

describe('ConversationJobRequirementRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: ConversationJobRequirementRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new ConversationJobRequirementRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createForConversation', () => {
    it('should create conversation requirements for top 3 job requirements', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobId = '223e4567-e89b-4d3a-a456-426614174001';

      const jobReqsResult: QueryResult<{ id: string }> = {
        rows: [
          { id: '333e4567-e89b-4d3a-a456-426614174001' },
          { id: '333e4567-e89b-4d3a-a456-426614174002' },
          { id: '333e4567-e89b-4d3a-a456-426614174003' },
        ],
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      const insertResult: QueryResult<any> = {
        rows: [],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      // First call: get job requirements
      mockQuery.mockResolvedValueOnce(jobReqsResult);
      // Next 3 calls: insert conversation requirements
      mockQuery.mockResolvedValue(insertResult);

      await repository.createForConversation(conversationId, jobId);

      // Should query for job requirements
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id'),
        [jobId]
      );

      // Should insert 3 conversation requirements
      expect(mockQuery).toHaveBeenCalledTimes(4); // 1 SELECT + 3 INSERTs
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO conversation_job_requirements'),
        [conversationId, '333e4567-e89b-4d3a-a456-426614174001']
      );
    });

    it('should throw error when no job requirements found', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobId = '223e4567-e89b-4d3a-a456-426614174001';

      const emptyResult: QueryResult<{ id: string }> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(emptyResult);

      await expect(repository.createForConversation(conversationId, jobId)).rejects.toThrow(
        `No job requirements found for job: ${jobId}`
      );
    });
  });

  describe('getConversationRequirements', () => {
    it('should return conversation requirements with job data', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const mockRequirements = [
        {
          conversation_job_requirement_id: '333e4567-e89b-4d3a-a456-426614174001',
          conversation_id: conversationId,
          job_requirement_id: '443e4567-e89b-4d3a-a456-426614174001',
          status: RequirementStatus.PENDING,
          requirement_type: 'CDL_CLASS',
          requirement_description: 'Must have Class A CDL',
        },
      ];

      const mockResult: QueryResult<any> = {
        rows: mockRequirements,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirements = await repository.getConversationRequirements(conversationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('get_conversation_requirements'),
        [conversationId]
      );
      expect(requirements).toEqual(mockRequirements);
    });

    it('should return empty array when no requirements found', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirements = await repository.getConversationRequirements(conversationId);

      expect(requirements).toEqual([]);
    });
  });

  describe('getNextPending', () => {
    it('should return next pending requirement', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobRequirementId = '443e4567-e89b-4d3a-a456-426614174001';

      const nextPendingResult: QueryResult<any> = {
        rows: [{ job_requirement_id: jobRequirementId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      const fullDataResult: QueryResult<any> = {
        rows: [
          {
            conversation_job_requirement_id: '333e4567-e89b-4d3a-a456-426614174001',
            conversation_id: conversationId,
            job_requirement_id: jobRequirementId,
            status: RequirementStatus.PENDING,
            requirement_type: 'CDL_CLASS',
            requirement_description: 'Must have Class A CDL',
          },
        ],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery
        .mockResolvedValueOnce(nextPendingResult)
        .mockResolvedValueOnce(fullDataResult);

      const requirement = await repository.getNextPending(conversationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('get_next_pending_requirement'),
        [conversationId]
      );
      expect(requirement).toEqual(fullDataResult.rows[0]);
    });

    it('should return null when no pending requirements found', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const emptyResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(emptyResult);

      const requirement = await repository.getNextPending(conversationId);

      expect(requirement).toBeNull();
    });
  });

  describe('update', () => {
    it('should update conversation requirement status', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobRequirementId = '443e4567-e89b-4d3a-a456-426614174001';

      const updateData = {
        status: RequirementStatus.MET,
      };

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      await repository.update(conversationId, jobRequirementId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversation_job_requirements'),
        expect.arrayContaining([RequirementStatus.MET, conversationId, jobRequirementId])
      );
    });

    it('should update extracted_value', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobRequirementId = '443e4567-e89b-4d3a-a456-426614174001';

      const updateData = {
        extracted_value: { cdl_class: 'A' },
      };

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      await repository.update(conversationId, jobRequirementId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversation_job_requirements'),
        expect.arrayContaining([JSON.stringify(updateData.extracted_value), conversationId, jobRequirementId])
      );
    });

    it('should update multiple fields', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobRequirementId = '443e4567-e89b-4d3a-a456-426614174001';
      const evaluatedAt = new Date('2024-01-01');

      const updateData = {
        status: RequirementStatus.MET,
        extracted_value: { cdl_class: 'A' },
        evaluated_at: evaluatedAt,
      };

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      await repository.update(conversationId, jobRequirementId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversation_job_requirements'),
        expect.arrayContaining([
          RequirementStatus.MET,
          JSON.stringify(updateData.extracted_value),
          evaluatedAt,
          conversationId,
          jobRequirementId,
        ])
      );
    });

    it('should return early when no updates provided', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';
      const jobRequirementId = '443e4567-e89b-4d3a-a456-426614174001';

      const updateData = {};

      await repository.update(conversationId, jobRequirementId, updateData);

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('areAllCompleted', () => {
    it('should return true when all requirements are completed', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<{ completed: boolean }> = {
        rows: [{ completed: true }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const completed = await repository.areAllCompleted(conversationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('are_all_requirements_completed'),
        [conversationId]
      );
      expect(completed).toBe(true);
    });

    it('should return false when requirements are not all completed', async () => {
      const conversationId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<{ completed: boolean }> = {
        rows: [{ completed: false }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const completed = await repository.areAllCompleted(conversationId);

      expect(completed).toBe(false);
    });
  });
});
