/**
 * Tests for ApplicationService
 */

import { Pool } from 'pg';
import { ApplicationService } from '../../../src/services/application/service';
import { ApplicationRepository } from '../../../src/entities/application/repository';
import { ScreeningDecision } from '../../../src/entities';

// Mock the repository
jest.mock('../../../src/entities/application/repository');
jest.mock('../../../src/entities/conversation/repository');

describe('ApplicationService', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockApplicationRepo: jest.Mocked<ApplicationRepository>;
  let service: ApplicationService;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as any;

    mockApplicationRepo = {
      getApplicationsWithJobAndConversationByUserId: jest.fn(),
    } as any;

    // Mock constructor behavior
    (ApplicationRepository as jest.MockedClass<typeof ApplicationRepository>).mockImplementation(() => mockApplicationRepo);

    service = new ApplicationService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApplicationsWithJobAndConversationByUserId', () => {
    it('should call repository method and return applications', async () => {
      const userId = 'user-123';
      const mockApplications = [
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

      mockApplicationRepo.getApplicationsWithJobAndConversationByUserId.mockResolvedValue(mockApplications);

      const result = await service.getApplicationsWithJobAndConversationByUserId(userId);

      expect(mockApplicationRepo.getApplicationsWithJobAndConversationByUserId).toHaveBeenCalledWith(userId);
      expect(mockApplicationRepo.getApplicationsWithJobAndConversationByUserId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockApplications);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no applications', async () => {
      const userId = 'user-123';
      mockApplicationRepo.getApplicationsWithJobAndConversationByUserId.mockResolvedValue([]);

      const result = await service.getApplicationsWithJobAndConversationByUserId(userId);

      expect(mockApplicationRepo.getApplicationsWithJobAndConversationByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle applications with null screening_decision', async () => {
      const userId = 'user-123';
      const mockApplications = [
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

      mockApplicationRepo.getApplicationsWithJobAndConversationByUserId.mockResolvedValue(mockApplications);

      const result = await service.getApplicationsWithJobAndConversationByUserId(userId);

      expect(result).toEqual(mockApplications);
      expect(result[0].screening_decision).toBeNull();
    });

    it('should propagate repository errors', async () => {
      const userId = 'user-123';
      const error = new Error('Database connection failed');
      mockApplicationRepo.getApplicationsWithJobAndConversationByUserId.mockRejectedValue(error);

      await expect(service.getApplicationsWithJobAndConversationByUserId(userId)).rejects.toThrow('Database connection failed');
      expect(mockApplicationRepo.getApplicationsWithJobAndConversationByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
