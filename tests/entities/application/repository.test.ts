/**
 * Tests for ApplicationRepository
 */

import { Pool, QueryResult } from 'pg';
import { ApplicationRepository } from '../../../src/entities/application/repository';
import { ScreeningDecision } from '../../../src/entities';

describe('ApplicationRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: ApplicationRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new ApplicationRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApplicationsWithJobAndConversationByUserId', () => {
    it('should return applications with job and conversation data', async () => {
      const userId = 'user-123';
      const mockRows = [
        {
          application_id: 'app-1',
          job_id: 'job-1',
          created_at: new Date('2024-01-01'),
          job_name: 'Truck Driver',
          job_description: 'Drive trucks',
          job_location: 'Los Angeles, CA',
          screening_decision: ScreeningDecision.APPROVED,
        },
        {
          application_id: 'app-2',
          job_id: 'job-2',
          created_at: new Date('2024-01-02'),
          job_name: 'Delivery Driver',
          job_description: 'Deliver packages',
          job_location: 'San Francisco, CA',
          screening_decision: ScreeningDecision.PENDING,
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

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY a.created_at DESC'),
        [userId]
      );
      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
    });

    it('should handle applications with null screening_decision', async () => {
      const userId = 'user-123';
      const mockRows = [
        {
          application_id: 'app-1',
          job_id: 'job-1',
          created_at: new Date('2024-01-01'),
          job_name: 'Truck Driver',
          job_description: 'Drive trucks',
          job_location: 'Los Angeles, CA',
          screening_decision: null,
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

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result).toEqual(mockRows);
      expect(result[0].screening_decision).toBeNull();
    });

    it('should handle applications with null job_location', async () => {
      const userId = 'user-123';
      const mockRows = [
        {
          application_id: 'app-1',
          job_id: 'job-1',
          created_at: new Date('2024-01-01'),
          job_name: 'Truck Driver',
          job_description: 'Drive trucks',
          job_location: null,
          screening_decision: ScreeningDecision.APPROVED,
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

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result).toEqual(mockRows);
      expect(result[0].job_location).toBeNull();
    });

    it('should return empty array when user has no applications', async () => {
      const userId = 'user-123';
      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      } as QueryResult;

      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle applications without conversations (LEFT JOIN)', async () => {
      const userId = 'user-123';
      const mockRows = [
        {
          application_id: 'app-1',
          job_id: 'job-1',
          created_at: new Date('2024-01-01'),
          job_name: 'Truck Driver',
          job_description: 'Drive trucks',
          job_location: 'Los Angeles, CA',
          screening_decision: null, // No conversation exists
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

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result).toEqual(mockRows);
      expect(result[0].screening_decision).toBeNull();
    });

    it('should order applications by created_at DESC', async () => {
      const userId = 'user-123';
      const mockRows = [
        {
          application_id: 'app-2',
          job_id: 'job-2',
          created_at: new Date('2024-01-02'),
          job_name: 'Delivery Driver',
          job_description: 'Deliver packages',
          job_location: 'San Francisco, CA',
          screening_decision: ScreeningDecision.PENDING,
        },
        {
          application_id: 'app-1',
          job_id: 'job-1',
          created_at: new Date('2024-01-01'),
          job_name: 'Truck Driver',
          job_description: 'Drive trucks',
          job_location: 'Los Angeles, CA',
          screening_decision: ScreeningDecision.APPROVED,
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

      const result = await repository.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result[0].application_id).toBe('app-2');
      expect(result[1].application_id).toBe('app-1');
    });
  });
});
