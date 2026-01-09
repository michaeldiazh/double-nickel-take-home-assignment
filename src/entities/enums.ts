import { z } from 'zod';

/**
 * Payment type enum for Job table
 */
export enum PaymentType {
  HOUR = 'HOUR',
  MILES = 'MILES',
  SALARY = 'SALARY',
}

/**
 * Zod schema for PaymentType enum
 */
export const paymentTypeSchema = z.enum(Object.values(PaymentType) as [string, ...string[]]);

/**
 * Application status enum
 */
export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WITHDRAWN = 'WITHDRAWN',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

/**
 * Zod schema for ApplicationStatus enum
 */
export const applicationStatusSchema = z.enum(Object.values(ApplicationStatus) as [string, ...string[]]);

/**
 * Screening decision enum for Conversation table
 */
export enum ScreeningDecision {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
}

/**
 * Zod schema for ScreeningDecision enum
 */
export const screeningDecisionSchema = z.enum(Object.values(ScreeningDecision) as [string, ...string[]]);

/**
 * Message sender enum
 */
export enum MessageSender {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

/**
 * Zod schema for MessageSender enum
 */
export const messageSenderSchema = z.enum(Object.values(MessageSender) as [string, ...string[]]);

/**
 * Requirement status enum for ConversationRequirements
 */
export enum RequirementStatus {
  PENDING = 'PENDING',
  MET = 'MET',
  NOT_MET = 'NOT_MET',
}

/**
 * Zod schema for RequirementStatus enum
 */
export const requirementStatusSchema = z.enum(Object.values(RequirementStatus) as [string, ...string[]]);

