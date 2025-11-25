import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { search = '', sector = 'all' } = req.query

      let query = db`
        SELECT * FROM articulos WHERE 1=1
      `

      if (search) {
        query = db`
          SELECT * FROM articulos 
          WHERE descripcion ILIKE ${'%' + search + '%'} 
             OR codigo ILIKE ${'%' + search + '%'}
        `
      }

      if (sector && sector !== 'all') {
        query = db`
          SELECT * FROM articulos 
          WHERE sector = ${sector}
          ${search ? db`AND (descripcion ILIKE ${'%' + search + '%'} OR codigo ILIKE ${'%' + search + '%'})` : db``}
        `
      }

      if (!search && sector === 'all') {
        query = db`SELECT * FROM articulos ORDER BY descripcion ASC`
      } else {
        query = db`${query} ORDER BY descripcion ASC`
      }

      const articulos = await query
      res.status(200).json(articulos)
    } else if (req.method === 'POST') {
      const { codigo, descripcion, sector, stock, stock_minimo, precio, imagen } = req.body

      const [articulo] = await db`
        INSERT INTO articulos (codigo, descripcion, sector, stock, stock_minimo, precio, imagen)
        VALUES (${codigo}, ${descripcion}, ${sector}, ${stock || 100}, ${stock_minimo || 10}, ${precio || 0}, ${imagen || null})
        RETURNING *
      `

      res.status(201).json(articulo)
    } else if (req.method === 'PUT') {
      const { id, ...updates } = req.body

      const setClause = []
      const values = []

      Object.keys(updates).forEach((key, index) => {
        setClause.push(`${key} = $${index + 1}`)
        values.push(updates[key])
      })

      if (setClause.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      values.push(id)
      const query = `UPDATE articulos SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`

      const [articulo] = await db.unsafe(query, values)
      res.status(200).json(articulo)
    } else if (req.method === 'DELETE') {
      const { id } = req.query

      await db`DELETE FROM articulos WHERE id = ${id}`

      res.status(200).json({ message: 'Deleted successfully' })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Stock API error:', error)
    res.status(500).json({ error: error.message })
  }
}

