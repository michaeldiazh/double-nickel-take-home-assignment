/**
 * Utility functions for checking requirement status and counts.
 * Provides clean state information about conversation requirements.
 */

import { RequirementStatus } from '../../entities/conversation-job-requirement/domain';
import { ConversationRequirementWithJob } from '../../entities/conversation-job-requirement/domain';

/**
 * Status summary of requirements for a conversation.
 */
export interface RequirementStatusSummary {
  /** Total number of requirements (top 3) */
  total: number;
  /** Number of requirements that are MET */
  met: number;
  /** Number of requirements that are NOT_MET */
  notMet: number;
  /** Number of requirements that are PENDING */
  pending: number;
  /** Whether all top 3 requirements are MET */
  allMet: boolean;
  /** Whether any requirement is NOT_MET */
  hasNotMet: boolean;
  /** Whether all requirements are completed (MET or NOT_MET, no PENDING) */
  allCompleted: boolean;
}

/**
 * Gets status summary for the top 3 requirements.
 * 
 * @param requirements - All conversation requirements (will filter to top 3)
 * @returns Status summary with counts and flags
 */
export function getRequirementStatusSummary(
  requirements: ConversationRequirementWithJob[]
): RequirementStatusSummary {
  // Get top 3 requirements (sorted by priority)
  const top3Requirements = requirements
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  const total = top3Requirements.length;
  const met = top3Requirements.filter(r => r.status === RequirementStatus.MET).length;
  const notMet = top3Requirements.filter(r => r.status === RequirementStatus.NOT_MET).length;
  const pending = top3Requirements.filter(r => r.status === RequirementStatus.PENDING).length;

  return {
    total,
    met,
    notMet,
    pending,
    allMet: total === 3 && met === 3,
    hasNotMet: notMet > 0,
    allCompleted: pending === 0,
  };
}

/**
 * Checks if all top 3 requirements are MET.
 * 
 * @param requirements - All conversation requirements
 * @returns True if all top 3 are MET
 */
export function areAllTop3Met(requirements: ConversationRequirementWithJob[]): boolean {
  const summary = getRequirementStatusSummary(requirements);
  return summary.allMet;
}

/**
 * Checks if any requirement is NOT_MET.
 * 
 * @param requirements - All conversation requirements
 * @returns True if any requirement is NOT_MET
 */
export function hasAnyNotMet(requirements: ConversationRequirementWithJob[]): boolean {
  const summary = getRequirementStatusSummary(requirements);
  return summary.hasNotMet;
}

/**
 * Gets the count of requirements by status.
 * 
 * @param requirements - All conversation requirements
 * @returns Object with counts for each status
 */
export function getRequirementCounts(requirements: ConversationRequirementWithJob[]): {
  total: number;
  met: number;
  notMet: number;
  pending: number;
} {
  const summary = getRequirementStatusSummary(requirements);
  return {
    total: summary.total,
    met: summary.met,
    notMet: summary.notMet,
    pending: summary.pending,
  };
}

/**
 * Gets the top 3 requirement IDs (sorted by priority).
 * 
 * @param requirements - All conversation requirements
 * @returns Array of job requirement IDs for the top 3 requirements
 */
export function getTop3RequirementIds(requirements: ConversationRequirementWithJob[]): string[] {
  return requirements
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(r => r.job_requirement_id);
}

/**
 * Checks if all required requirements (from top 3) are MET.
 * Non-required requirements being NOT_MET won't block progression.
 * 
 * @param requirements - All conversation requirements
 * @returns True if all required requirements from top 3 are MET
 */
export function areAllRequiredMet(requirements: ConversationRequirementWithJob[]): boolean {
  // Get top 3 requirements (sorted by priority)
  const top3Requirements = requirements
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
  
  // Filter to only required requirements (required !== false)
  const requiredRequirements = top3Requirements.filter(
    r => (r.criteria as { required?: boolean })?.required !== false
  );
  
  // If no required requirements, consider it met (edge case)
  if (requiredRequirements.length === 0) {
    return true;
  }
  
  // Check if all required requirements are MET
  return requiredRequirements.every(r => r.status === RequirementStatus.MET);
}
