/**
 * Criteria handlers module.
 * 
 * Each handler evaluates whether a job requirement is met based on the user's response.
 * Handlers take the requirement criteria and the user's response value, and return
 * whether the requirement is MET, NOT_MET, or PENDING.
 */

export * from './types';
export * from './cdl-class-handler';
export * from './years-experience-handler';
export * from './driving-record-handler';
export * from './endorsements-handler';
export * from './age-requirement-handler';
export * from './physical-exam-handler';
export * from './drug-test-handler';
export * from './background-check-handler';
export * from './geographic-restriction-handler';
export * from './router';

