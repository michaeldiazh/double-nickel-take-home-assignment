import {z} from 'zod';
import {dateFilterOperatorsSchema, stringFilterOperatorsSchema} from "../../database/types";

/**
 * Address shape - base fields shared between full and simplified Address objects
 * Export this for use in other entities to avoid circular imports
 */
export const addressShape = {
    id: z.uuidv4(),
    address: z.string(),
    city: z.string(),
    aptNumber: z.string().nullable(),
    state: z.string().max(2),
    zipCode: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
};


/**
 * Simplified Address object
 * Used when embedding address information in other entities
 * Contains only essential address fields (excludes metadata timestamps)
 */
export const simplifiedAddressSchema = z.object(addressShape);


export type SimplifiedAddress = z.infer<typeof simplifiedAddressSchema>;

/**
 * Zod schema for Address entity
 * Use this for validating unknown data from the database
 * Extends the base address fields with metadata timestamps
 */
export const addressSchema = z.object(addressShape);

/**
 * Address entity
 * Stores address details for users and jobs
 */
export type Address = z.infer<typeof addressSchema>;

export const addressFilterShape = {
    id: stringFilterOperatorsSchema,
    address: stringFilterOperatorsSchema,
    city: stringFilterOperatorsSchema,
    aptNumber: stringFilterOperatorsSchema,
    state: stringFilterOperatorsSchema,
    zipCode: stringFilterOperatorsSchema,
    createdAt: dateFilterOperatorsSchema,
    updatedAt: dateFilterOperatorsSchema,
}

export const addressFilterSchema: z.ZodObject = z.object(addressFilterShape).partial();

/**
 * Schema for creating a new address (camelCase, excludes id)
 * Used for API input when creating addresses
 */
export const createAddressSchema = z.object({
    address: z.string().nullable(),
    aptNumber: z.string().nullable(),
    state: z.string().max(2).nullable(),
    zipCode: z.string().nullable(),
});

export type CreateAddress = z.infer<typeof createAddressSchema>;
export const addressKeySchema = addressSchema.keyof();
export type AddressKey = z.infer<typeof addressKeySchema>;