import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const users = await db`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE id != ${user.id}
      ORDER BY name ASC
    `

    res.status(200).json(users)
  } catch (error) {
    console.error('Users API error:', error)
    res.status(500).json({ error: error.message })
  }
}

