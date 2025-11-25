import postgres from 'postgres'

let sql = null

export const getDb = () => {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
    })
  }

  return sql
}

