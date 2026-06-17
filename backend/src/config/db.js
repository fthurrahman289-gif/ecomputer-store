require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL connection pool for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE}`,
  ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10s for Vercel cold-start
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit - let connection retry
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database: ' + process.env.DB_DATABASE);
});

const poolPromise = Promise.resolve(pool);

// Query helper function
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  pool,
  poolPromise,
  query
};
