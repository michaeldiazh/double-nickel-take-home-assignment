import { z } from 'zod';
import { paymentTypeSchema } from '../enums';
import { addressShape, addressFilterShape } from '../address';
import {dateFilterOperatorsSchema, numberFilterOperatorsSchema, stringFilterOperatorsSchema, booleanFilterOperatorsSchema} from "../../database/types";

/**
 * Job shape - base fields for simplified Job objects
 * Excludes metadata timestamps
 * Uses addressId reference instead of full address object to avoid infinite nesting
 */
export const jobShape = {
  id: z.uuidv4(),
  name: z.string(),
  description: z.string(),
  paymentType: paymentTypeSchema,
  hourlyPay: z.number().nullable(),
  milesPay: z.number().nullable(),
  salaryPay: z.number().nullable(),
  addressId: z.uuidv4(),
  isActive: z.boolean(),
};

/**
 * Simplified Job object
 * Used when embedding job information in other entities
 * Contains only essential job fields (excludes metadata timestamps)
 */
export const simplifiedJobSchema = z.object(jobShape);

export type SimplifiedJob = z.infer<typeof simplifiedJobSchema>;

/**
 * Zod schema for Job entity
 * Use this for validating unknown data from the database
 * Uses full address object (not just ID reference)
 * Extends jobShape and omits addressId to replace it with full address object
 */
export const jobSchema = z.object(jobShape).extend({
  address: z.object(addressShape),
  createdAt: z.date(),
  updatedAt: z.date(),
}).omit({ addressId: true });

/**
 * Job entity
 * 
 * This entity represents a job posting in the system. It stores details about the job
 * such as name, description, payment type, hourly pay, miles pay, salary pay, address,
 * and is active status.
 * 
 * Purpose:
 * - Stores details about a job posting
 * - Tracks job status (active, inactive, etc.)
 * - Provides a base entity for other job-related tables
 */
export type Job = z.infer<typeof jobSchema>;

export const jobFilterShape = {
  id: stringFilterOperatorsSchema,
  name: stringFilterOperatorsSchema,
  description: stringFilterOperatorsSchema,
  paymentType: stringFilterOperatorsSchema,
  hourlyPay: numberFilterOperatorsSchema,
  milesPay: numberFilterOperatorsSchema,
  salaryPay: numberFilterOperatorsSchema,
  address: z.object(addressFilterShape).partial(),
  isActive: booleanFilterOperatorsSchema,
  createdAt: dateFilterOperatorsSchema,
  updatedAt: dateFilterOperatorsSchema,
};

export const jobFilterSchema: z.ZodObject = z.object(jobFilterShape).partial();

export const jobKeySchema = jobSchema.keyof();
export type JobKey = z.infer<typeof jobKeySchema>;


