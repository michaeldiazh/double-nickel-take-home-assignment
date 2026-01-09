"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressRepository = void 0;
const connection_1 = require("../connection");
const entity_builder_1 = require("./entity-builder");
const query_builder_1 = require("./query-builder");
/**
 * Repository for Address entity operations
 * Handles all database interactions for the address table
 */
class AddressRepository {
    constructor(db = connection_1.pool) {
        this.db = db;
    }
    /**
     * Find an address by ID
     */
    async findById(id) {
        const { text } = (0, query_builder_1.buildFindByIdQuery)();
        const result = await this.db.query(text, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return (0, entity_builder_1.mapRowToAddress)(result.rows[0]);
    }
    /**
     * Find all addresses
     */
    async findAll() {
        const { text } = (0, query_builder_1.buildFindAllQuery)();
        const result = await this.db.query(text);
        return result.rows.map((row) => (0, entity_builder_1.mapRowToAddress)(row));
    }
    /**
     * Create a new address
     */
    async create(addressData) {
        const insertRow = (0, entity_builder_1.mapCreateAddressToInsertRow)(addressData);
        const { text, values } = (0, query_builder_1.buildCreateQuery)(insertRow);
        const result = await this.db.query(text, values);
        return (0, entity_builder_1.mapRowToAddress)(result.rows[0]);
    }
    /**
     * Update an existing address
     * @throws Error if the address with the given id does not exist
     */
    async update(id, addressData) {
        // Transform from camelCase entity format to snake_case row format
        const updateRow = (0, entity_builder_1.mapAddressToRow)(addressData);
        const { text, values } = (0, query_builder_1.buildUpdateQuery)(updateRow);
        const result = await this.db.query(text, [id, ...values]);
        if (result.rows.length === 0) {
            throw new Error(`Address with id ${id} not found`);
        }
        return (0, entity_builder_1.mapRowToAddress)(result.rows[0]);
    }
    /**
     * Delete an address by ID
     */
    async delete(id) {
        const { text } = (0, query_builder_1.buildDeleteQuery)();
        const result = await this.db.query(text, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
}
exports.AddressRepository = AddressRepository;
