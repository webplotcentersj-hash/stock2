import { getDb } from './db.js'
import { comparePassword, createToken } from './auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const db = getDb()
    const [user] = await db`
      SELECT id, email, password, name, role FROM users WHERE email = ${email}
    `

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = await createToken(user.id, user.email)

    // Remove password from response
    delete user.password

    res.status(200).json({
      user,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: error.message })
  }
}

