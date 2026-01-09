import {z} from 'zod';
import {addressFilterShape, addressShape} from '../address';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema} from "../../database/types";

/**
 * User shape - base fields for simplified User objects
 * Excludes sensitive/tracking fields (passwordHash, lastLoggedIn, timestamps)
 * Uses addressId reference instead of full address object to avoid infinite nesting
 */
export const userShape = {
    id: z.uuidv4(),
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    email: z.email(),
    addressId: z.uuidv4(),
};

/**
 * Simplified User object
 * Used when embedding user information in other entities
 * Contains only essential user fields (excludes passwordHash, lastLoggedIn, timestamps)
 */
export const simplifiedUserSchema = z.object(userShape);
export type SimplifiedUser = z.infer<typeof simplifiedUserSchema>;

/**
 * Zod schema for User entity
 * Use this for validating unknown data from the database
 * Uses full address object (not just ID reference)
 * Extends userShape and omits addressId to replace it with full address object
 */
export const userSchema = z.object(userShape).extend({
    address: z.object(addressShape),
    passwordHash: z.string(),
    lastLoggedIn: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
}).omit({addressId: true});

/**
 * User Entity
 *
 * This entity represents a user of the system. It stores basic profile information
 * and is used to track user interactions with the system.
 *
 * Purpose:
 * - Stores user profile information (name, email, etc.)
 * - Tracks user activity (last logged in time, etc.)
 * - Provides a base entity for other user-related tables
 */
export type User = z.infer<typeof userSchema>;

export const userFilterShape = {
    id: stringFilterOperatorsSchema,
    firstName: stringFilterOperatorsSchema,
    lastName: stringFilterOperatorsSchema,
    email: stringFilterOperatorsSchema,
    address: z.object(addressFilterShape).partial(),
    lastLoggedIn: dateFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
};

export const userFiltersSchema = z.object(userFilterShape).strict().partial();

export type UserFilters = z.infer<typeof userFiltersSchema>;