require('dotenv').config();
const { Pool } = require('pg');

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL environment variable is not set!');
  console.error('Please add DATABASE_URL to Vercel environment variables.');
  process.exit(1);
}

// PostgreSQL connection pool for Supabase - Optimized for Vercel Serverless
// IMPORTANT: Use Supabase's pgBouncer pooling endpoint, NOT the direct endpoint
// In Supabase dashboard: Settings > Database > Connection pooling > Copy Connection String (PgBouncer)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  // ⚠️ SERVERLESS OPTIMIZATION: Reduced pool size for Vercel
  max: 3,  // Max connections per function instance
  min: 0,  // No idle connections to avoid timeouts
  idleTimeoutMillis: 5000,  // Close idle connections quickly
  connectionTimeoutMillis: 15000,  // Extended timeout for cold starts
  statement_timeout: 30000,  // Query timeout
  keepalives: true,
  keepalivesIdleTimeout: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Database Pool Error:', {
    code: err.code,
    message: err.message,
    severity: err.severity
  });
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
});

pool.on('remove', () => {
  console.log('⚠️ Connection removed from pool');
});

// Query helper function with better error handling
const query = (text, params) => {
  return pool.query(text, params).catch((err) => {
    console.error('❌ Query Error:', {
      message: err.message,
      code: err.code,
      query: text.substring(0, 100),
      details: err.detail || 'No additional details'
    });
    throw err;
  });
};

module.exports = {
  pool,
  query
};
