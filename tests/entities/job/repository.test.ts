/**
 * Tests for JobRepository
 */

import { Pool, QueryResult } from 'pg';
import { JobRepository } from '../../../src/entities/job/repository';
import { Job } from '../../../src/entities/job/domain';

describe('JobRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: JobRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new JobRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all jobs ordered by created_at ascending', async () => {
      const jobId1 = '123e4567-e89b-4d3a-a456-426614174000';
      const jobId2 = '123e4567-e89b-4d3a-a456-426614174001';
      
      const mockRows = [
        {
          id: jobId1,
          name: 'Truck Driver',
          description: 'Drive trucks',
          location: 'Los Angeles, CA',
          is_active: true,
          payment_info: { hourly: 25 },
          created_at: new Date('2024-01-01'),
        },
        {
          id: jobId2,
          name: 'Delivery Driver',
          description: 'Deliver packages',
          location: 'San Francisco, CA',
          is_active: true,
          payment_info: null,
          created_at: new Date('2024-01-02'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: mockRows.length,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[0]).toContain('ORDER BY created_at ASC');
      // No parameters passed when query has no placeholders
      expect(callArgs[1]).toBeUndefined();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(jobId1);
      expect(result[1].id).toBe(jobId2);
    });

    it('should handle jobs with null location', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174002';
      const mockRows = [
        {
          id: jobId,
          name: 'Warehouse Worker',
          description: 'Work in warehouse',
          location: null,
          is_active: true,
          payment_info: null,
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result[0].location).toBeNull();
    });

    it('should handle jobs with undefined is_active (backward compatibility)', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174003';
      const mockRows = [
        {
          id: jobId,
          name: 'Test Job',
          description: 'Test',
          location: 'Test',
          is_active: undefined,
          payment_info: null,
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result[0].is_active).toBe(true); // Should default to true
    });

    it('should handle jobs with false is_active', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174004';
      const mockRows = [
        {
          id: jobId,
          name: 'Inactive Job',
          description: 'This job is inactive',
          location: 'Test',
          is_active: false,
          payment_info: null,
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result[0].is_active).toBe(false);
    });

    it('should handle JSONB payment_info field', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174005';
      const mockRows = [
        {
          id: jobId,
          name: 'Test Job',
          description: 'Test',
          location: 'Test',
          is_active: true,
          payment_info: { hourly: 25, benefits: ['health', 'dental'] },
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result[0].payment_info).toEqual({ hourly: 25, benefits: ['health', 'dental'] });
    });

    it('should handle null payment_info', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174006';
      const mockRows = [
        {
          id: jobId,
          name: 'Test Job',
          description: 'Test',
          location: 'Test',
          is_active: true,
          payment_info: null,
          created_at: new Date('2024-01-01'),
        },
      ];

      const mockResult = {
        rows: mockRows,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result[0].payment_info).toBeNull();
    });

    it('should return empty array when no jobs exist', async () => {
      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return job by ID with backward compatibility', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174007';
      const mockRow = {
        id: jobId,
        name: 'Truck Driver',
        description: 'Drive trucks',
        location: 'Los Angeles, CA',
        is_active: true,
        payment_info: { hourly: 25 },
        created_at: new Date('2024-01-01'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getById(jobId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[0]).toContain('SELECT');
      expect(callArgs[1]).toEqual([jobId]);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(jobId);
        expect(result.name).toBe('Truck Driver');
      }
    });

    it('should return null when job not found', async () => {
      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle null location with backward compatibility', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174008';
      const mockRow = {
        id: jobId,
        name: 'Test Job',
        description: 'Test',
        location: null,
        is_active: true,
        payment_info: null,
        created_at: new Date('2024-01-01'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getById(jobId);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.location).toBeNull();
      }
    });

    it('should handle undefined is_active with default value', async () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174009';
      const mockRow = {
        id: jobId,
        name: 'Test Job',
        description: 'Test',
        location: 'Test',
        is_active: undefined,
        payment_info: null,
        created_at: new Date('2024-01-01'),
      };

      const mockResult = {
        rows: [mockRow],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getById(jobId);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.is_active).toBe(true); // Should default to true
      }
    });
  });
});
