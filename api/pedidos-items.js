import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { pedido_id } = req.query

      if (!pedido_id) {
        return res.status(400).json({ error: 'pedido_id is required' })
      }

      const items = await db`
        SELECT pi.*, a.id as articulo_id, a.codigo, a.descripcion, a.stock
        FROM pedidos_items pi
        LEFT JOIN articulos a ON pi.articulo_id = a.id
        WHERE pi.pedido_id = ${pedido_id}
        ORDER BY pi.created_at ASC
      `

      // Format response
      const formattedItems = items.map(item => ({
        id: item.id,
        pedido_id: item.pedido_id,
        articulo_id: item.articulo_id,
        cantidad: item.cantidad,
        stock_disponible: item.stock_disponible,
        articulo: {
          id: item.articulo_id,
          codigo: item.codigo,
          descripcion: item.descripcion,
          stock: item.stock,
        },
      }))

      res.status(200).json(formattedItems)
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Pedidos Items API error:', error)
    res.status(500).json({ error: error.message })
  }
}

