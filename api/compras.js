import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { status = 'all' } = req.query

      let ordenes

      if (status !== 'all') {
        const statusMap = {
          pendiente: 'Pendiente',
          aprobada: 'En Proceso',
          recibida: 'Completada',
        }
        const mappedStatus = statusMap[status] || status
        ordenes = await db`
          SELECT oc.*, a.*, u.name as solicitado_por_name
          FROM ordenes_compra oc
          LEFT JOIN articulos a ON oc.articulo_id = a.id
          LEFT JOIN users u ON oc.solicitado_por = u.id
          WHERE oc.status = ${mappedStatus}
          ORDER BY oc.created_at DESC
        `
      } else {
        ordenes = await db`
          SELECT oc.*, a.*, u.name as solicitado_por_name
          FROM ordenes_compra oc
          LEFT JOIN articulos a ON oc.articulo_id = a.id
          LEFT JOIN users u ON oc.solicitado_por = u.id
          ORDER BY oc.created_at DESC
        `
      }

      // Format response
      const formatted = ordenes.map(orden => ({
        id: orden.id,
        articulo_id: orden.articulo_id,
        cantidad: orden.cantidad,
        proveedor: orden.proveedor,
        observaciones: orden.observaciones,
        solicitado_por: orden.solicitado_por,
        pedido_id: orden.pedido_id,
        status: orden.status,
        created_at: orden.created_at,
        updated_at: orden.updated_at,
        articulo: {
          id: orden.articulo_id,
          codigo: orden.codigo,
          descripcion: orden.descripcion,
          stock: orden.stock,
          stock_minimo: orden.stock_minimo,
          sector: orden.sector,
          precio: orden.precio,
        },
        solicitado_por: {
          id: orden.solicitado_por,
          name: orden.solicitado_por_name,
        },
      }))

      res.status(200).json(formatted)
    } else if (req.method === 'POST') {
      const user = await requireAuth(req)
      const { articulo_id, cantidad, proveedor, observaciones } = req.body

      const [orden] = await db`
        INSERT INTO ordenes_compra (articulo_id, cantidad, proveedor, observaciones, solicitado_por, status)
        VALUES (${articulo_id}, ${cantidad}, ${proveedor || 'Por definir'}, ${observaciones || ''}, ${user.id}, 'Pendiente')
        RETURNING *
      `

      res.status(201).json(orden)
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

      const query = `UPDATE ordenes_compra SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
      const [orden] = await db.unsafe(query, updateValues)

      // If status is Completada, update stock
      if (updates.status === 'Completada') {
        const [ordenData] = await db`SELECT articulo_id, cantidad FROM ordenes_compra WHERE id = ${id}`
        
        if (ordenData) {
          await db`
            UPDATE articulos 
            SET stock = stock + ${ordenData.cantidad}, updated_at = NOW()
            WHERE id = ${ordenData.articulo_id}
          `
        }
      }

      res.status(200).json(orden)
    } else if (req.method === 'DELETE') {
      const { id } = req.query
      await db`DELETE FROM ordenes_compra WHERE id = ${id}`
      res.status(200).json({ message: 'Deleted successfully' })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Compras API error:', error)
    res.status(500).json({ error: error.message })
  }
}

