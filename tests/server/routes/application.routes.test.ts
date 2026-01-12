/**
 * Tests for application routes
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { ApplicationRepository } from '../../../src/entities/application/repository';
import { createApplicationRoutes } from '../../../src/server/routes/application.routes';

describe('Application Routes', () => {
  let mockPool: jest.Mocked<Pool>;
  let router: ReturnType<typeof createApplicationRoutes>;
  let mockApplicationRepo: {
    delete: jest.Mock;
  };

  beforeEach(() => {
    mockApplicationRepo = {
      delete: jest.fn(),
    };

    // Mock ApplicationRepository constructor
    jest.spyOn(ApplicationRepository.prototype, 'delete').mockImplementation(mockApplicationRepo.delete);

    mockPool = {} as any;
    router = createApplicationRoutes(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /application/:applicationId', () => {
    const validApplicationId = '123e4567-e89b-4d3a-a456-426614174000';

    it('should delete an application successfully', async () => {
      mockApplicationRepo.delete.mockResolvedValue(true);

      const req = {
        params: { applicationId: validApplicationId },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next: NextFunction = jest.fn();

      // Call the route handler
      const route = router.stack.find((r: any) => r.route?.path === '/application/:applicationId' && r.route?.methods.delete);
      expect(route).toBeDefined();

      if (route && route.route && route.route.stack[0]) {
        await route.route.stack[0].handle(req, res, next);
      }

      expect(mockApplicationRepo.delete).toHaveBeenCalledWith(validApplicationId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Application deleted successfully' });
    });

    it('should return 404 when application not found', async () => {
      mockApplicationRepo.delete.mockResolvedValue(false);

      const req = {
        params: { applicationId: validApplicationId },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next: NextFunction = jest.fn();

      const route = router.stack.find((r: any) => r.route?.path === '/application/:applicationId' && r.route?.methods.delete);
      if (route && route.route && route.route.stack[0]) {
        await route.route.stack[0].handle(req, res, next);
      }

      expect(mockApplicationRepo.delete).toHaveBeenCalledWith(validApplicationId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Application not found' });
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidApplicationId = 'invalid-uuid';

      const req = {
        params: { applicationId: invalidApplicationId },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next: NextFunction = jest.fn();

      const route = router.stack.find((r: any) => r.route?.path === '/application/:applicationId' && r.route?.methods.delete);
      if (route && route.route && route.route.stack[0]) {
        await route.route.stack[0].handle(req, res, next);
      }

      expect(mockApplicationRepo.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid application ID format (must be UUID v4)',
      });
    });

    it('should return 500 on server error', async () => {
      mockApplicationRepo.delete.mockRejectedValue(new Error('Database error'));

      const req = {
        params: { applicationId: validApplicationId },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next: NextFunction = jest.fn();

      const route = router.stack.find((r: any) => r.route?.path === '/application/:applicationId' && r.route?.methods.delete);
      if (route && route.route && route.route.stack[0]) {
        await route.route.stack[0].handle(req, res, next);
      }

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
