import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { search = '', sector = 'all' } = req.query

      let articulos

      if (search && sector !== 'all') {
        articulos = await db`
          SELECT * FROM articulos 
          WHERE sector = ${sector}
            AND (descripcion ILIKE ${'%' + search + '%'} OR codigo ILIKE ${'%' + search + '%'})
          ORDER BY descripcion ASC
        `
      } else if (search) {
        articulos = await db`
          SELECT * FROM articulos 
          WHERE descripcion ILIKE ${'%' + search + '%'} 
             OR codigo ILIKE ${'%' + search + '%'}
          ORDER BY descripcion ASC
        `
      } else if (sector !== 'all') {
        articulos = await db`
          SELECT * FROM articulos 
          WHERE sector = ${sector}
          ORDER BY descripcion ASC
        `
      } else {
        articulos = await db`SELECT * FROM articulos ORDER BY descripcion ASC`
      }
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

      // Build update query dynamically
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      Object.keys(updates).forEach((key) => {
        if (key !== 'id') {
          updateFields.push(`${key} = $${paramIndex}`)
          updateValues.push(updates[key])
          paramIndex++
        }
      })

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updateFields.push(`updated_at = NOW()`)
      updateValues.push(id)

      const query = `UPDATE articulos SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
      const [articulo] = await db.unsafe(query, updateValues)
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

