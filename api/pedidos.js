import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const user = await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { approval_status = 'all', status = 'all' } = req.query

      let pedidos

      // Role-based filtering
      if (user.role !== 'administración' && user.role !== 'compras') {
        if (approval_status !== 'all' && status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${user.id}
              AND p.approval_status = ${approval_status}
              AND p.status = ${status}
            ORDER BY p.created_at DESC
          `
        } else if (approval_status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${user.id}
              AND p.approval_status = ${approval_status}
            ORDER BY p.created_at DESC
          `
        } else if (status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${user.id}
              AND p.status = ${status}
            ORDER BY p.created_at DESC
          `
        } else {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${user.id}
            ORDER BY p.created_at DESC
          `
        }
      } else {
        if (approval_status !== 'all' && status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.approval_status = ${approval_status}
              AND p.status = ${status}
            ORDER BY p.created_at DESC
          `
        } else if (approval_status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.approval_status = ${approval_status}
            ORDER BY p.created_at DESC
          `
        } else if (status !== 'all') {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.status = ${status}
            ORDER BY p.created_at DESC
          `
        } else {
          pedidos = await db`
            SELECT p.*, u.name as user_name, u.role as user_role
            FROM pedidos p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
          `
        }
      }
      res.status(200).json(pedidos)
    } else if (req.method === 'POST') {
      const { client_name, description, image_url, items } = req.body

      if (user.role === 'compras') {
        return res.status(403).json({ error: 'Compras no puede crear pedidos' })
      }

      // Create pedido
      const [pedido] = await db`
        INSERT INTO pedidos (client_name, description, image_url, user_id, status, approval_status)
        VALUES (${client_name}, ${description}, ${image_url || null}, ${user.id}, 'Pendiente', 'Pendiente')
        RETURNING *
      `

      // Create items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          const [articulo] = await db`
            SELECT id, codigo, descripcion, stock, stock_minimo FROM articulos WHERE id = ${item.articulo_id}
          `

          if (articulo) {
            await db`
              INSERT INTO pedidos_items (pedido_id, articulo_id, cantidad, stock_disponible)
              VALUES (${pedido.id}, ${item.articulo_id}, ${item.cantidad}, ${articulo.stock})
            `

            // Check if stock is low and create orden_compra
            const faltante = item.cantidad - articulo.stock
            if (faltante > 0) {
              const existingOrder = await db`
                SELECT id FROM ordenes_compra 
                WHERE articulo_id = ${articulo.id} 
                  AND status IN ('Pendiente', 'En Proceso')
                LIMIT 1
              `

              if (existingOrder.length === 0) {
                await db`
                  INSERT INTO ordenes_compra (articulo_id, cantidad, proveedor, observaciones, solicitado_por, pedido_id, status)
                  VALUES (${articulo.id}, ${faltante}, 'Por definir', 
                    ${`Orden automática por pedido #${pedido.id} - Cliente: ${client_name}. Faltante: ${faltante} unidades.`},
                    ${user.id}, ${pedido.id}, 'Pendiente')
                `
              }
            }
          }
        }
      }

      res.status(201).json(pedido)
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

      const query = `UPDATE pedidos SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
      const [pedido] = await db.unsafe(query, updateValues)
      res.status(200).json(pedido)
    } else if (req.method === 'DELETE') {
      const { id } = req.query

      // Check permissions
      const [pedido] = await db`SELECT user_id FROM pedidos WHERE id = ${id}`
      
      if (user.role !== 'administración' && pedido.user_id !== user.id) {
        return res.status(403).json({ error: 'No permission to delete this pedido' })
      }

      await db`DELETE FROM pedidos WHERE id = ${id}`
      res.status(200).json({ message: 'Deleted successfully' })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Pedidos API error:', error)
    res.status(500).json({ error: error.message })
  }
}

