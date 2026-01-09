"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.closePool = closePool;
const pg_1 = require("pg");
/**
 * Database connection pool configuration
 * Uses environment variables for connection details
 */
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
/**
 * PostgreSQL connection pool
 * Singleton instance for the application
 */
exports.pool = new pg_1.Pool(poolConfig);
// Handle pool errors
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
/**
 * Gracefully close the database connection pool
 */
async function closePool() {
    await exports.pool.end();
}
