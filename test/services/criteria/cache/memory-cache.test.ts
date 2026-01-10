import { createMemoryRequirementsCache } from '../../../../src/services/criteria/cache/memory-cache';
import { JobRequirements, PaymentType } from '../../../../src/entities';
import { RequirementsCache } from '../../../../src/services/criteria/cache/interface';

describe('Memory Requirements Cache', () => {
  // Track caches with intervals for cleanup
  const cachesWithIntervals: RequirementsCache[] = [];

  afterAll(async () => {
    // Clean up all intervals
    await Promise.all(
      cachesWithIntervals.map(cache => cache.stop?.())
    );
    cachesWithIntervals.length = 0;
  });
  // Helper to create mock requirements
  const createMockRequirement = (
    id: string,
    jobId: string,
    requirementTypeId: number,
    priority: number,
    requirementType: string = 'CDL_CLASS'
  ): JobRequirements => ({
    id,
    job: {
      id: jobId,
      name: 'Test Job',
      description: 'Test job description',
      paymentType: PaymentType.HOUR,
      hourlyPay: 100,
      milesPay: null,
      salaryPay: null,
      addressId: '123e4567-e89b-12d3-a456-426614174000',
      isActive: true,
    },
    jobRequirementType: {
      id: requirementTypeId,
      requirementType,
      requirementDescription: `Requirement type ${requirementType}`,
    },
    criteria: { cdl_class: 'A', required: true } as unknown as Record<string, unknown>,
    priority,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('set', () => {
    it('should store top 3 requirements sorted by priority', async () => {
      const cache = createMemoryRequirementsCache(5, 0); // Disable cleanup for this test
      const jobId = 'job-1';
      
      const requirements = [
        createMockRequirement('req-3', jobId, 1, 3),
        createMockRequirement('req-1', jobId, 1, 1),
        createMockRequirement('req-4', jobId, 1, 4),
        createMockRequirement('req-2', jobId, 1, 2),
      ];

      await cache.set(jobId, requirements);
      // Pass higher threshold to get all 3 requirements (default is 2)
      const result = await cache.get(jobId, 3);

      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
      expect(result![0].priority).toBe(1);
      expect(result![1].priority).toBe(2);
      expect(result![2].priority).toBe(3);
    });

    it('should update existing entry when setting again', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const jobId = 'job-1';
      
      const initialRequirements = [
        createMockRequirement('req-1', jobId, 1, 1),
        createMockRequirement('req-2', jobId, 1, 2),
      ];

      await cache.set(jobId, initialRequirements);
      const firstGet = await cache.get(jobId);
      expect(firstGet).not.toBeNull();

      // Wait a bit to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedRequirements = [
        createMockRequirement('req-3', jobId, 1, 1),
        createMockRequirement('req-4', jobId, 1, 2),
      ];

      await cache.set(jobId, updatedRequirements);
      const secondGet = await cache.get(jobId);

      expect(secondGet).not.toBeNull();
      expect(secondGet!.length).toBe(2);
      expect(secondGet![0].id).toBe('req-3');
      expect(secondGet![1].id).toBe('req-4');
    });
  });

  describe('get', () => {
    it('should return null for cache miss', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const result = await cache.get('non-existent-job');
      expect(result).toBeNull();
    });

    it('should return cached requirements when entry exists', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const jobId = 'job-1';
      const requirements = [
        createMockRequirement('req-1', jobId, 1, 1),
        createMockRequirement('req-2', jobId, 1, 2),
      ];

      await cache.set(jobId, requirements);
      const result = await cache.get(jobId);

      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
    });

    it('should filter by priority threshold', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const jobId = 'job-1';
      const requirements = [
        createMockRequirement('req-1', jobId, 1, 1),
        createMockRequirement('req-2', jobId, 1, 2),
        createMockRequirement('req-3', jobId, 1, 3),
      ];

      await cache.set(jobId, requirements);
      
      // Default threshold is 2, so should return priority 1 and 2
      const result = await cache.get(jobId);
      expect(result!.length).toBe(2);
      expect(result!.every(r => r.priority <= 2)).toBe(true);

      // Explicit threshold of 1
      const resultThreshold1 = await cache.get(jobId, 1);
      expect(resultThreshold1!.length).toBe(1);
      expect(resultThreshold1![0].priority).toBe(1);
    });
  });

  describe('get with stale TTL', () => {
    it('should return null when cache entry is expired', async () => {
      // Use very short TTL (0.0001 minutes = 6ms)
      const cache = createMemoryRequirementsCache(0.0001, 0);
      const jobId = 'job-1';
      const requirements = [
        createMockRequirement('req-1', jobId, 1, 1),
      ];

      await cache.set(jobId, requirements);
      
      // Entry should still be valid immediately
      const immediateResult = await cache.get(jobId);
      expect(immediateResult).not.toBeNull();

      // Wait for TTL to expire (10ms should be enough)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Entry should now be expired and removed
      const expiredResult = await cache.get(jobId);
      expect(expiredResult).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove entry from cache when it exists', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const jobId = 'job-1';
      const requirements = [
        createMockRequirement('req-1', jobId, 1, 1),
      ];

      await cache.set(jobId, requirements);
      
      // Verify it exists
      const beforeInvalidate = await cache.get(jobId);
      expect(beforeInvalidate).not.toBeNull();

      // Invalidate
      await cache.invalidate(jobId);

      // Verify it's gone
      const afterInvalidate = await cache.get(jobId);
      expect(afterInvalidate).toBeNull();
    });

    it('should handle invalidate when entry does not exist', async () => {
      const cache = createMemoryRequirementsCache(5, 0);
      const jobId = 'non-existent-job';

      // Should not throw
      await expect(cache.invalidate(jobId)).resolves.not.toThrow();

      // Should still return null
      const result = await cache.get(jobId);
      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      // Use very short TTL and cleanup interval
      const cache = createMemoryRequirementsCache(0.001, 50); // 0.001 min TTL, 50ms cleanup
      cachesWithIntervals.push(cache);
      
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';
      
      const requirements1 = [createMockRequirement('req-1', jobId1, 1, 1)];
      const requirements2 = [createMockRequirement('req-2', jobId2, 1, 1)];

      await cache.set(jobId1, requirements1);
      await cache.set(jobId2, requirements2);

      // Both should exist immediately
      expect(await cache.get(jobId1)).not.toBeNull();
      expect(await cache.get(jobId2)).not.toBeNull();

      // Wait for TTL to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 100));

      // Both should be cleaned up
      expect(await cache.get(jobId1)).toBeNull();
      expect(await cache.get(jobId2)).toBeNull();
    }, 10000); // Increase timeout for this test

    it('should not remove non-expired entries during cleanup', async () => {
      // Use longer TTL but short cleanup interval
      const cache = createMemoryRequirementsCache(5, 50); // 5 min TTL, 50ms cleanup
      cachesWithIntervals.push(cache);
      
      const jobId = 'job-1';
      const requirements = [createMockRequirement('req-1', jobId, 1, 1)];

      await cache.set(jobId, requirements);

      // Wait for cleanup to run
      await new Promise(resolve => setTimeout(resolve, 100));

      // Entry should still exist (not expired)
      const result = await cache.get(jobId);
      expect(result).not.toBeNull();
    }, 10000); // Increase timeout for this test
  });
});

