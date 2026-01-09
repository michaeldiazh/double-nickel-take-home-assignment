/**
 * Generic type for the result of extracting fields and values from a row object
 * Used for both insert and update operations
 * @template T - The row type (e.g., InsertAddressRow, UpdateDataRow<AddressRow>, etc.)
 */
export type FieldsAndValues<T extends Record<string, unknown>> = {
    fields: (keyof T)[];
    values: T[keyof T][];
    placeholders: string;
};


/**
 * Generic type for the result of building a query with values
 * @template T - The row type (e.g., InsertAddressRow, UpdateDataRow<AddressRow>, etc.)
 * @deprecated - Use QueryValues instead
 */
export type QueryWithValues<T extends Record<string, unknown>> = {
    text: string;
    values: T[keyof T][];
};

export type QueryValues = {
    query: string;
    values: unknown[];
}



/**
 * Generic type for partial update data, excluding the id field
 * @template T - The entity type (e.g., SimplifiedAddress, SimplifiedUser, etc.)
 *
 * @example
 * UpdateData<SimplifiedAddress> // Partial<Omit<SimplifiedAddress, 'id'>>
 */
export type UpdateData<T extends { id?: unknown }> = Partial<Omit<T, 'id'>>;

/**
 * Generic type for partial update data in database row format, excluding id and timestamps
 * @template T - The database row type (e.g., AddressRow, UserRow, etc.)
 *
 * @example
 * UpdateDataRow<AddressRow> // Partial<Omit<AddressRow, 'id' | 'created_at' | 'updated_at'>>
 */
export type UpdateDataRow<T extends { id?: unknown; created_at?: unknown; updated_at?: unknown }> = Partial<
    Omit<T, 'id' | 'created_at' | 'updated_at'>
>;

