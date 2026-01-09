"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCreateAddressToInsertRow = exports.createAddressToInsertRowSchema = exports.mapAddressToRow = exports.addressToRowSchema = exports.mapRowToAddress = exports.addressRowToAddressSchema = void 0;
const index_1 = require("../../entities/address/index");
/**
 * Zod schema that transforms database row (snake_case) to Address entity (camelCase)
 */
exports.addressRowToAddressSchema = index_1.addressRowSchema.transform((row) => {
    return {
        id: row.id,
        address: row.address,
        aptNumber: row.apt_number,
        state: row.state,
        zipCode: row.zip_code,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
});
/**
 * Maps database row (snake_case) to Address entity (camelCase)
 * Uses Zod for validation and transformation
 */
const mapRowToAddress = (row) => {
    const transformed = exports.addressRowToAddressSchema.parse(row);
    return index_1.addressSchema.parse(transformed);
};
exports.mapRowToAddress = mapRowToAddress;
/**
 * Zod schema that transforms Address entity (camelCase) to database row (snake_case)
 */
exports.addressToRowSchema = index_1.addressSchema.transform((address) => {
    return {
        id: address.id,
        address: address.address,
        apt_number: address.aptNumber,
        state: address.state,
        zip_code: address.zipCode,
        created_at: address.createdAt,
        updated_at: address.updatedAt,
    };
});
/**
 * Maps Address entity (camelCase) to database row (snake_case)
 * Uses Zod for validation and transformation
 */
const mapAddressToRow = (address) => {
    // For partial updates, we need to handle undefined values
    const row = {};
    if (address.id !== undefined)
        row.id = address.id;
    if (address.address !== undefined)
        row.address = address.address;
    if (address.aptNumber !== undefined)
        row.apt_number = address.aptNumber;
    if (address.state !== undefined)
        row.state = address.state;
    if (address.zipCode !== undefined)
        row.zip_code = address.zipCode;
    return row;
};
exports.mapAddressToRow = mapAddressToRow;
/**
 * Zod schema that transforms CreateAddress (camelCase) to InsertAddressRow (snake_case)
 */
exports.createAddressToInsertRowSchema = index_1.createAddressSchema.transform((createAddress) => {
    return {
        address: createAddress.address,
        apt_number: createAddress.aptNumber,
        state: createAddress.state,
        zip_code: createAddress.zipCode,
    };
});
/**
 * Maps CreateAddress (camelCase) to InsertAddressRow (snake_case)
 * Uses Zod for validation and transformation
 */
const mapCreateAddressToInsertRow = (createAddress) => {
    return exports.createAddressToInsertRowSchema.parse(createAddress);
};
exports.mapCreateAddressToInsertRow = mapCreateAddressToInsertRow;
