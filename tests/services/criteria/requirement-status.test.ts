/**
 * Tests for requirement-status module
 */

import {
  getRequirementStatusSummary,
  areAllTop3Met,
  hasAnyNotMet,
  getRequirementCounts,
  getTop3RequirementIds,
  areAllRequiredMet,
} from '../../../src/services/criteria/requirement-status';
import { RequirementStatus } from '../../../src/entities';

describe('getRequirementStatusSummary', () => {
  it('should calculate correct summary for all MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.MET, priority: 3, criteria: {} },
    ];

    const summary = getRequirementStatusSummary(requirements as any);
    expect(summary.total).toBe(3);
    expect(summary.met).toBe(3);
    expect(summary.notMet).toBe(0);
    expect(summary.pending).toBe(0);
    expect(summary.allMet).toBe(true);
    expect(summary.hasNotMet).toBe(false);
    expect(summary.allCompleted).toBe(true);
  });

  it('should calculate correct summary with mixed statuses', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.NOT_MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.PENDING, priority: 3, criteria: {} },
    ];

    const summary = getRequirementStatusSummary(requirements as any);
    expect(summary.total).toBe(3);
    expect(summary.met).toBe(1);
    expect(summary.notMet).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.allMet).toBe(false);
    expect(summary.hasNotMet).toBe(true);
    expect(summary.allCompleted).toBe(false);
  });

  it('should only consider top 3 requirements', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.MET, priority: 3, criteria: {} },
      { job_requirement_id: 'req-4', status: RequirementStatus.NOT_MET, priority: 4, criteria: {} },
    ];

    const summary = getRequirementStatusSummary(requirements as any);
    expect(summary.total).toBe(3);
    expect(summary.notMet).toBe(0);
  });
});

describe('areAllTop3Met', () => {
  it('should return true when all top 3 are MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.MET, priority: 3, criteria: {} },
    ];

    expect(areAllTop3Met(requirements as any)).toBe(true);
  });

  it('should return false when any top 3 is not MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.NOT_MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.MET, priority: 3, criteria: {} },
    ];

    expect(areAllTop3Met(requirements as any)).toBe(false);
  });
});

describe('hasAnyNotMet', () => {
  it('should return true when any requirement is NOT_MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.NOT_MET, priority: 2, criteria: {} },
    ];

    expect(hasAnyNotMet(requirements as any)).toBe(true);
  });

  it('should return false when no requirement is NOT_MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.PENDING, priority: 2, criteria: {} },
    ];

    expect(hasAnyNotMet(requirements as any)).toBe(false);
  });
});

describe('getRequirementCounts', () => {
  it('should return correct counts', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', status: RequirementStatus.NOT_MET, priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', status: RequirementStatus.PENDING, priority: 3, criteria: {} },
    ];

    const counts = getRequirementCounts(requirements as any);
    expect(counts.total).toBe(3);
    expect(counts.met).toBe(1);
    expect(counts.notMet).toBe(1);
    expect(counts.pending).toBe(1);
  });
});

describe('getTop3RequirementIds', () => {
  it('should return top 3 requirement IDs sorted by priority', () => {
    const requirements = [
      { job_requirement_id: 'req-3', priority: 3, criteria: {} },
      { job_requirement_id: 'req-1', priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', priority: 2, criteria: {} },
    ];

    const ids = getTop3RequirementIds(requirements as any);
    expect(ids).toEqual(['req-1', 'req-2', 'req-3']);
  });

  it('should only return top 3 even if more exist', () => {
    const requirements = [
      { job_requirement_id: 'req-1', priority: 1, criteria: {} },
      { job_requirement_id: 'req-2', priority: 2, criteria: {} },
      { job_requirement_id: 'req-3', priority: 3, criteria: {} },
      { job_requirement_id: 'req-4', priority: 4, criteria: {} },
    ];

    const ids = getTop3RequirementIds(requirements as any);
    expect(ids).toHaveLength(3);
    expect(ids).not.toContain('req-4');
  });
});

describe('areAllRequiredMet', () => {
  it('should return true when all required requirements are MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: { required: true } },
      { job_requirement_id: 'req-2', status: RequirementStatus.MET, priority: 2, criteria: { required: true } },
      { job_requirement_id: 'req-3', status: RequirementStatus.NOT_MET, priority: 3, criteria: { required: false } },
    ];

    expect(areAllRequiredMet(requirements as any)).toBe(true);
  });

  it('should return false when any required requirement is not MET', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: { required: true } },
      { job_requirement_id: 'req-2', status: RequirementStatus.NOT_MET, priority: 2, criteria: { required: true } },
    ];

    expect(areAllRequiredMet(requirements as any)).toBe(false);
  });

  it('should return true when no required requirements exist', () => {
    const requirements = [
      { job_requirement_id: 'req-1', status: RequirementStatus.MET, priority: 1, criteria: { required: false } },
    ];

    expect(areAllRequiredMet(requirements as any)).toBe(true);
  });
});
