import { Pool, PoolConfig } from 'pg';

/**
 * Database connection pool configuration
 * Uses environment variables for connection details
 */
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'happy_hauler',
  user: process.env.DB_USER || 'michael.angelo.diaz',
  password: process.env.DB_PASSWORD || 'Gatito03151997?',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * PostgreSQL connection pool
 * Singleton instance for the application
 */
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Gracefully close the database connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

