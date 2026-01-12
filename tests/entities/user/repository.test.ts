/**
 * Tests for UserRepository
 */

import { Pool, QueryResult } from 'pg';
import { UserRepository } from '../../../src/entities/user/repository';

describe('UserRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: UserRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockPool = {
      query: mockQuery as any,
    } as any;

    repository = new UserRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user and return the ID', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        apt_num: 'Apt 4B',
        state: 'CA',
        zip_code: '90210',
      };

      const mockResult: QueryResult<{ id: string }> = {
        rows: [{ id: '123e4567-e89b-4d3a-a456-426614174000' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const userId = await repository.create(userData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.address,
          userData.apt_num,
          userData.state,
          userData.zip_code,
        ]
      );
      expect(userId).toBe('123e4567-e89b-4d3a-a456-426614174000');
    });

    it('should handle user without apt_num', async () => {
      const userData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        address: '456 Oak Ave',
        state: 'NY',
        zip_code: '10001',
      };

      const mockResult: QueryResult<{ id: string }> = {
        rows: [{ id: '223e4567-e89b-4d3a-a456-426614174001' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const userId = await repository.create(userData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.address,
          null, // apt_num should be null
          userData.state,
          userData.zip_code,
        ]
      );
      expect(userId).toBe('223e4567-e89b-4d3a-a456-426614174001');
    });
  });

  describe('getById', () => {
    it('should return a user when found', async () => {
      const userId = '123e4567-e89b-4d3a-a456-426614174000';
      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        apt_num: 'Apt 4B',
        state: 'CA',
        zip_code: '90210',
        created_at: new Date('2024-01-01'),
      };

      const mockResult: QueryResult<any> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const user = await repository.getById(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = '123e4567-e89b-4d3a-a456-426614174000';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const user = await repository.getById(userId);

      expect(user).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return a user when found by email', async () => {
      const email = 'john.doe@example.com';
      const mockUser = {
        id: '123e4567-e89b-4d3a-a456-426614174000',
        first_name: 'John',
        last_name: 'Doe',
        email: email,
        address: '123 Main St',
        apt_num: 'Apt 4B',
        state: 'CA',
        zip_code: '90210',
        created_at: new Date('2024-01-01'),
      };

      const mockResult: QueryResult<any> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const user = await repository.getByEmail(email);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [email]
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'notfound@example.com';

      const mockResult: QueryResult<any> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockQuery.mockResolvedValue(mockResult);

      const user = await repository.getByEmail(email);

      expect(user).toBeNull();
    });
  });
});
