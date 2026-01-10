/**
 * Tests for LLM handler database loaders.
 * Tests all loader functions with mocked database responses.
 */

import {
  loadConversationBasic,
  loadUserFirstName,
  loadJobInfo,
  loadMessages,
  loadConversationRequirements,
  loadJobFacts,
} from '../../../../src/services/llm/handler/loaders';
import { pool } from '../../../../src/database/connection';
import type { QueryResult } from 'pg';

// Mock the database pool
jest.mock('../../../../src/database/connection', () => {
  const mockQuery = jest.fn<Promise<QueryResult<any>>, [string, unknown[]]>();
  return {
    pool: {
      query: mockQuery,
    },
  };
});

describe('LLM Handler Loaders', () => {
  // Get the mocked query function
  const mockPoolQuery = (pool.query as jest.Mock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConversationBasic', () => {
    it('should load conversation basic data successfully', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';
      const appId = '22222222-2222-4222-8222-222222222222';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: conversationId, app_id: appId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadConversationBasic(conversationId);

      expect(result).toEqual({
        conversationId,
        appId,
      });
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return null when conversation not found', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadConversationBasic(conversationId);

      expect(result).toBeNull();
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadUserFirstName', () => {
    it('should load user first name successfully', async () => {
      const appId = '22222222-2222-4222-8222-222222222222';
      const firstName = 'John';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ first_name: firstName }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadUserFirstName(appId);

      expect(result).toBe(firstName);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return null when application not found', async () => {
      const appId = '22222222-2222-4222-8222-222222222222';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadUserFirstName(appId);

      expect(result).toBeNull();
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadJobInfo', () => {
    it('should load job info successfully', async () => {
      const appId = '22222222-2222-4222-8222-222222222222';
      const jobId = '33333333-3333-4333-8333-333333333333';
      const jobTitle = 'Truck Driver';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: jobId, name: jobTitle }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadJobInfo(appId);

      expect(result).toEqual({
        jobId,
        jobTitle,
      });
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return null when application not found', async () => {
      const appId = '22222222-2222-4222-8222-222222222222';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadJobInfo(appId);

      expect(result).toBeNull();
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadMessages', () => {
    it('should load messages successfully and map sender to role', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [
          { sender: 'USER', content: 'Hello' },
          { sender: 'ASSISTANT', content: 'Hi there!' },
          { sender: 'SYSTEM', content: 'System message' },
        ],
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadMessages(conversationId);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'system', content: 'System message' },
      ]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no messages found', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadMessages(conversationId);

      expect(result).toEqual([]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle lowercase sender values', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [
          { sender: 'user', content: 'Hello' },
          { sender: 'assistant', content: 'Hi!' },
        ],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadMessages(conversationId);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ]);
    });
  });

  describe('loadConversationRequirements', () => {
    it('should load conversation requirements with date coercion', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';
      const appId = '22222222-2222-4222-8222-222222222222';
      const jobId = '33333333-3333-4333-8333-333333333333';
      const requirementId = '44444444-4444-4444-8444-444444444444';
      const messageId = '55555555-5555-4555-8555-555555555555';
      const userId = '66666666-6666-4666-8666-666666666666';
      const requirementTypeId = '77777777-7777-4777-8777-777777777777';

      const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const requirementTypeIdNum = 1;
      
      const mockData = [
        {
          id: '88888888-8888-4888-8888-888888888888',
          messageId: messageId,
          status: 'MET',
          value: { cdl_class: 'A', confirmed: true },
          lastUpdated: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          conversation: {
            id: conversationId,
            isActive: true,
            screeningDecision: 'PENDING',
            screeningSummary: null,
            screeningReasons: null,
            endedAt: null,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            application: {
              id: appId,
              userId: userId,
              jobId: jobId,
              appliedOn: '2024-01-01T00:00:00.000Z',
              status: 'SUBMITTED',
            },
          },
          jobRequirements: {
            id: requirementId,
            criteria: { cdl_class: 'A' },
            priority: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            job: {
              id: jobId,
              name: 'Truck Driver',
              description: 'Drive trucks',
              paymentType: 'HOUR',
              hourlyPay: 25.0,
              milesPay: null,
              salaryPay: null,
              addressId: addressId,
              isActive: true,
            },
            jobRequirementType: {
              id: requirementTypeIdNum,
              requirementType: 'CDL_CLASS',
              requirementDescription: 'CDL Class Requirement',
            },
          },
        },
      ];

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ conversation_requirements: mockData }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadConversationRequirements(conversationId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('88888888-8888-4888-8888-888888888888');
      expect(result[0].conversation.id).toBe(conversationId);
      expect(result[0].jobRequirements.id).toBe(requirementId);
      
      // Verify date coercion - should be Date objects, not strings
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].lastUpdated).toBeInstanceOf(Date);
      expect(result[0].conversation.createdAt).toBeInstanceOf(Date);
      expect(result[0].conversation.updatedAt).toBeInstanceOf(Date);
      expect(result[0].conversation.application.appliedOn).toBeInstanceOf(Date);
      expect(result[0].jobRequirements.createdAt).toBeInstanceOf(Date);
      expect(result[0].jobRequirements.updatedAt).toBeInstanceOf(Date);
      
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no conversation requirements found', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadConversationRequirements(conversationId);

      expect(result).toEqual([]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when conversation_requirements is null', async () => {
      const conversationId = '11111111-1111-4111-8111-111111111111';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ conversation_requirements: null }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadConversationRequirements(conversationId);

      expect(result).toEqual([]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadJobFacts', () => {
    it('should load job facts with date coercion', async () => {
      const jobId = '33333333-3333-4333-8333-333333333333';
      const factId = '99999999-9999-4999-8999-999999999999';
      const factTypeId = 1;
      const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      const mockData = [
        {
          id: factId,
          content: 'Full-time position with benefits',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          job: {
            id: jobId,
            name: 'Truck Driver',
            description: 'Drive trucks',
            paymentType: 'HOUR',
            hourlyPay: 25.0,
            milesPay: null,
            salaryPay: null,
            addressId: addressId,
            isActive: true,
          },
          factType: {
            id: factTypeId,
            factType: 'WORK_SCHEDULE',
            factDescription: 'Work Schedule Information',
          },
        },
      ];

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ job_facts: mockData }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadJobFacts(jobId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(factId);
      expect(result[0].job.id).toBe(jobId);
      expect(result[0].factType.id).toBe(factTypeId);
      expect(result[0].content).toBe('Full-time position with benefits');
      
      // Verify date coercion - should be Date objects, not strings
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no job facts found', async () => {
      const jobId = '33333333-3333-4333-8333-333333333333';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadJobFacts(jobId);

      expect(result).toEqual([]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when job_facts is null', async () => {
      const jobId = '33333333-3333-4333-8333-333333333333';

      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ job_facts: null }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as QueryResult);

      const result = await loadJobFacts(jobId);

      expect(result).toEqual([]);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });
  });
});
