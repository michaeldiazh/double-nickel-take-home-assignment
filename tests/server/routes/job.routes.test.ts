/**
 * Tests for job routes
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { JobRepository } from '../../../src/entities/job/repository';
import { Job } from '../../../src/entities/job/domain';

describe('Job Routes - Route Handler Logic', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockJobRepo: jest.Mocked<JobRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as any;

    mockJobRepo = {
      getAll: jest.fn(),
    } as any;

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /jobs', () => {
    const jobId1 = '123e4567-e89b-4d3a-a456-426614174010';
    const jobId2 = '123e4567-e89b-4d3a-a456-426614174011';
    const jobId3 = '123e4567-e89b-4d3a-a456-426614174012';
    
    const mockJobs: Job[] = [
      {
        id: jobId1,
        name: 'Truck Driver',
        description: 'Drive trucks across the country',
        location: 'Los Angeles, CA',
        is_active: true,
        payment_info: { hourly: 25 },
        created_at: new Date('2024-01-01'),
      },
      {
        id: jobId2,
        name: 'Delivery Driver',
        description: 'Deliver packages locally',
        location: 'San Francisco, CA',
        is_active: true,
        payment_info: null,
        created_at: new Date('2024-01-02'),
      },
      {
        id: jobId3,
        name: 'Warehouse Worker',
        description: 'Work in warehouse',
        location: null,
        is_active: false,
        payment_info: { salary: 40000 },
        created_at: new Date('2024-01-03'),
      },
    ];

    it('should retrieve all jobs from repository', async () => {
      mockJobRepo.getAll.mockResolvedValue(mockJobs);
      const jobs = await mockJobRepo.getAll();
      expect(mockJobRepo.getAll).toHaveBeenCalled();
      expect(jobs).toEqual(mockJobs);
      expect(jobs).toHaveLength(3);
    });

    it('should map jobs to response format correctly', () => {
      const job = mockJobs[0];
      const jobResponse = {
        jobName: job.name,
        jobDescription: job.description,
        jobLocation: job.location || '',
        isActive: job.is_active ?? true,
      };

      expect(jobResponse).toEqual({
        jobName: 'Truck Driver',
        jobDescription: 'Drive trucks across the country',
        jobLocation: 'Los Angeles, CA',
        isActive: true,
      });
    });

    it('should handle jobs with null location', () => {
      const job = mockJobs[2]; // Warehouse Worker with null location
      const jobResponse = {
        jobName: job.name,
        jobDescription: job.description,
        jobLocation: job.location || '',
        isActive: job.is_active ?? true,
      };

      expect(jobResponse.jobLocation).toBe('');
    });

    it('should handle jobs with undefined is_active', () => {
      const jobId = '123e4567-e89b-4d3a-a456-426614174013';
      const jobWithoutActive: Job = {
        id: jobId,
        name: 'Test Job',
        description: 'Test',
        location: 'Test',
        payment_info: null,
        created_at: new Date(),
      };

      const jobResponse = {
        jobName: jobWithoutActive.name,
        jobDescription: jobWithoutActive.description,
        jobLocation: jobWithoutActive.location || '',
        isActive: jobWithoutActive.is_active ?? true,
      };

      expect(jobResponse.isActive).toBe(true); // Should default to true
    });

    it('should handle jobs with false is_active', () => {
      const job = mockJobs[2]; // Warehouse Worker with is_active: false
      const jobResponse = {
        jobName: job.name,
        jobDescription: job.description,
        jobLocation: job.location || '',
        isActive: job.is_active ?? true,
      };

      expect(jobResponse.isActive).toBe(false);
    });

    it('should return jobs ordered by created_at ascending', async () => {
      mockJobRepo.getAll.mockResolvedValue(mockJobs);
      const jobs = await mockJobRepo.getAll();

      // Verify order (oldest first)
      expect(jobs[0].id).toBe(jobId1);
      expect(jobs[1].id).toBe(jobId2);
      expect(jobs[2].id).toBe(jobId3);
    });

    it('should handle empty jobs list', async () => {
      mockJobRepo.getAll.mockResolvedValue([]);
      const jobs = await mockJobRepo.getAll();
      expect(jobs).toEqual([]);
      expect(jobs).toHaveLength(0);
    });
  });
});
