import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    const db = getDb()

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const today = new Date().toISOString().split('T')[0]

    // Pedidos de hoy
    const pedidosHoy = await db`
      SELECT id, status FROM pedidos WHERE created_at >= ${today}
    `

    const stats_today = {
      total_pedidos: pedidosHoy.length,
      pedidos_completados: pedidosHoy.filter((p) => p.status === 'Finalizado').length,
    }

    // Pedidos pendientes
    const pedidosPendientes = await db`
      SELECT COUNT(*) as count FROM pedidos WHERE status = 'Pendiente'
    `

    // Stock bajo
    const articulos = await db`SELECT stock, stock_minimo FROM articulos`
    const stock_bajo = articulos.filter((a) => a.stock <= a.stock_minimo).length

    // Ventas de la semana
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const ventasSemana = await db`
      SELECT created_at, status FROM pedidos WHERE created_at >= ${weekAgo.toISOString()}
    `

    const ventasPorDia = {}
    ventasSemana.forEach((pedido) => {
      const fecha = pedido.created_at.toISOString().split('T')[0]
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = { pedidos: 0, completados: 0 }
      }
      ventasPorDia[fecha].pedidos++
      if (pedido.status === 'Finalizado') {
        ventasPorDia[fecha].completados++
      }
    })

    const ventas_semana = Object.entries(ventasPorDia).map(([fecha, data]) => ({
      fecha,
      pedidos: data.pedidos,
      completados: data.completados,
    }))

    // Actividad reciente
    const actividadReciente = await db`
      SELECT id, client_name, status, created_at 
      FROM pedidos 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    res.status(200).json({
      stats_today,
      pedidos_pendientes: parseInt(pedidosPendientes[0].count) || 0,
      stock_bajo,
      ventas_semana,
      actividad_reciente: actividadReciente,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    res.status(500).json({ error: error.message })
  }
}

