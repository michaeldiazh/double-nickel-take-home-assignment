/**
 * Tests for JobRequirementRepository
 */

import { Pool, QueryResult } from 'pg';
import { JobRequirementRepository } from '../../../src/entities/job-requirement/repository';
import { JobRequirementType } from '../../../src/services/criteria/criteria-types';

describe('JobRequirementRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: JobRequirementRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new JobRequirementRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getByJobId', () => {
    it('should return job requirements for a job', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174000';
      const mockRequirements = [
        {
          id: '223e4567-e89b-4d3a-a456-426614174001',
          job_id: jobId,
          requirement_type: JobRequirementType.CDL_CLASS,
          requirement_description: 'Must have Class A CDL',
          criteria: { required: true, cdl_class: 'A' },
          priority: 1,
          created_at: new Date('2024-01-01'),
        },
        {
          id: '223e4567-e89b-4d3a-a456-426614174002',
          job_id: jobId,
          requirement_type: JobRequirementType.YEARS_EXPERIENCE,
          requirement_description: 'Minimum 2 years experience',
          criteria: { min_years: 2 },
          priority: 2,
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult: QueryResult<any> = {
        rows: mockRequirements,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirements = await repository.getByJobId(jobId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [jobId]
      );
      expect(requirements).toHaveLength(2);
      expect(requirements[0].requirement_type).toBe(JobRequirementType.CDL_CLASS);
      expect(requirements[1].requirement_type).toBe(JobRequirementType.YEARS_EXPERIENCE);
    });

    it('should return empty array when no requirements found', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirements = await repository.getByJobId(jobId);

      expect(requirements).toEqual([]);
    });
  });

  describe('getIdsByJobId', () => {
    it('should return job requirement IDs for a job', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174000';
      const mockIds = [
        { id: '223e4567-e89b-4d3a-a456-426614174001' },
        { id: '223e4567-e89b-4d3a-a456-426614174002' },
        { id: '223e4567-e89b-4d3a-a456-426614174003' },
      ];

      const mockResult: QueryResult<{ id: string }> = {
        rows: mockIds,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const ids = await repository.getIdsByJobId(jobId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id'),
        [jobId]
      );
      expect(ids).toEqual([
        '223e4567-e89b-4d3a-a456-426614174001',
        '223e4567-e89b-4d3a-a456-426614174002',
        '223e4567-e89b-4d3a-a456-426614174003',
      ]);
    });

    it('should return empty array when no requirements found', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<{ id: string }> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const ids = await repository.getIdsByJobId(jobId);

      expect(ids).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a job requirement when found', async () => {
      const requirementId = '223e4567-e89b-4d3a-a456-426614174001';
      const mockRequirement = {
        id: requirementId,
        job_id: '123e4567-e89b-4d3a-a456-426614174000',
        requirement_type: JobRequirementType.CDL_CLASS,
        requirement_description: 'Must have Class A CDL',
        criteria: { required: true, cdl_class: 'A' },
        priority: 1,
        created_at: new Date('2024-01-01'),
      };

      const mockResult: QueryResult<any> = {
        rows: [mockRequirement],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirement = await repository.getById(requirementId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [requirementId]
      );
      expect(requirement).toEqual(mockRequirement);
    });

    it('should return null when requirement not found', async () => {
      const requirementId = '223e4567-e89b-4d3a-a456-426614174001';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const requirement = await repository.getById(requirementId);

      expect(requirement).toBeNull();
    });
  });
});
