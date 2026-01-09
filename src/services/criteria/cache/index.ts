/**
 * Cache module for job requirements.
 * 
 * Provides interfaces and implementations for caching job requirements.
 * Currently supports in-memory caching, with Redis support planned for production.
 */

export { RequirementsCache } from './interface';
export { createMemoryRequirementsCache } from './memory-cache';

