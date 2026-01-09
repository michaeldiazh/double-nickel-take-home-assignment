"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeleteQuery = exports.buildUpdateQuery = exports.buildCreateQuery = exports.buildFindAllQuery = exports.buildFindByIdQuery = void 0;
const common_1 = require("../common");
/**
 * Base SELECT columns for address queries
 */
const SELECT_COLUMNS = `
  id,
  address,
  apt_number,
  state,
  zip_code,
  created_at,
  updated_at
`;
/**
 * Extracts fields, values, and placeholders from an UpdateData object
 * @param updateRow - The update row object
 * @returns Object containing fields array, values array, and placeholders string
 */
const extractUpdateFieldsAndValues = (updateRow) => {
    // Get keys directly from the object (order is preserved for string keys)
    const fields = Object.keys(updateRow);
    const values = fields.map((key) => updateRow[key]);
    // Generate placeholders starting from $2 (since $1 is the id parameter)
    const placeholders = (0, common_1.createPlaceholders)(fields, 2);
    return { fields, values, placeholders };
};
/**
 * Extracts fields, values, and placeholders from an InsertAddressRow object
 * @param insertRow - The insert row object
 * @returns Object containing fields array, values array, and placeholders string
 */
const extractInsertFieldsAndValues = (insertRow) => {
    // Get keys directly from the object (order is preserved for string keys)
    const fields = Object.keys(insertRow);
    const values = fields.map((key) => insertRow[key]);
    // Generate placeholders based on field count
    const placeholders = (0, common_1.createPlaceholders)(fields);
    return { fields, values, placeholders };
};
/**
 * Builds a SELECT query to find an address by ID
 */
const buildFindByIdQuery = () => {
    return {
        text: `
            SELECT ${SELECT_COLUMNS}
            FROM address
            WHERE id = $1
        `,
        paramCount: 1,
    };
};
exports.buildFindByIdQuery = buildFindByIdQuery;
/**
 * Builds a SELECT query to find all addresses
 */
const buildFindAllQuery = () => {
    return {
        text: `
            SELECT ${SELECT_COLUMNS}
            FROM address
            ORDER BY created_at DESC
        `,
        paramCount: 0,
    };
};
exports.buildFindAllQuery = buildFindAllQuery;
/**
 * Builds an INSERT query to create a new address
 * @param insertRow - The insert row object with all address fields (snake_case)
 * @returns Query text and values array in the correct order
 */
const buildCreateQuery = (insertRow) => {
    const { fields, values, placeholders } = extractInsertFieldsAndValues(insertRow);
    const columns = fields.join(', ');
    const text = `INSERT INTO address (${columns})
                  VALUES (${placeholders})
                  RETURNING *`;
    return { text, values };
};
exports.buildCreateQuery = buildCreateQuery;
/**
 * Builds an UPDATE query to update an existing address
 * @param updateRow - The update row object (snake_case, excludes id)
 * @returns Query text and values array in the correct order
 * @throws Error if no fields are provided for update
 */
const buildUpdateQuery = (updateRow) => {
    const { fields, values, placeholders } = extractUpdateFieldsAndValues(updateRow);
    if (fields.length === 0) {
        throw new Error('At least one field must be provided for update');
    }
    const setClause = (0, common_1.createSetClause)(fields, placeholders);
    const text = `UPDATE address
                  SET ${setClause},
                      updated_at = NOW()
                  WHERE id = $1
                  RETURNING *`;
    return { text, values };
};
exports.buildUpdateQuery = buildUpdateQuery;
/**
 * Builds a DELETE query to delete an address by ID
 */
const buildDeleteQuery = () => {
    return {
        text: `DELETE
               FROM address
               WHERE id = $1`,
        paramCount: 1,
    };
};
exports.buildDeleteQuery = buildDeleteQuery;
