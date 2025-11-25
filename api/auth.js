import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
}

export async function requireAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    throw new Error('No token provided')
  }

  const decoded = await verifyToken(token)
  
  if (!decoded) {
    throw new Error('Invalid token')
  }

  const db = getDb()
  const [user] = await db`
    SELECT id, email, name, role FROM users WHERE id = ${decoded.userId}
  `

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

