/**
 * Database connection for Neon PostgreSQL
 * This is used only in serverless functions, not in the frontend
 */

export const getDbConnection = () => {
  const connectionString = process.env.DATABASE_URL || import.meta.env.VITE_DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // For serverless functions, we'll use postgres.js
  // This file is imported only in API routes
  return connectionString
}

