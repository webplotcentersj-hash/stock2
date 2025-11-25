import { getDb } from './db.js'
import { requireAuth } from './auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    if (req.method === 'GET') {
      const { tipo = 'all', fecha_desde, fecha_hasta } = req.query

      let movimientos

      if (tipo !== 'all') {
        const tipoMap = {
          ingreso: 'Ingreso',
          egreso: 'Egreso',
        }
        const mappedTipo = tipoMap[tipo] || tipo
        
        if (fecha_desde && fecha_hasta) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.tipo = ${mappedTipo}
              AND mc.created_at >= ${fecha_desde}
              AND mc.created_at <= ${fecha_hasta}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else if (fecha_desde) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.tipo = ${mappedTipo}
              AND mc.created_at >= ${fecha_desde}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else if (fecha_hasta) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.tipo = ${mappedTipo}
              AND mc.created_at <= ${fecha_hasta}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.tipo = ${mappedTipo}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        }
      } else {
        if (fecha_desde && fecha_hasta) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.created_at >= ${fecha_desde}
              AND mc.created_at <= ${fecha_hasta}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else if (fecha_desde) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.created_at >= ${fecha_desde}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else if (fecha_hasta) {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            WHERE mc.created_at <= ${fecha_hasta}
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        } else {
          movimientos = await db`
            SELECT mc.*, u.name as usuario_name
            FROM movimientos_caja mc
            LEFT JOIN users u ON mc.user_id = u.id
            ORDER BY mc.created_at DESC
            LIMIT 100
          `
        }
      }

      // Format response
      const formatted = movimientos.map(mov => ({
        ...mov,
        usuario: {
          id: mov.user_id,
          name: mov.usuario_name,
        },
      }))

      res.status(200).json(formatted)
    } else if (req.method === 'GET' && req.query.summary === 'true') {
      // Get summary
      const movimientos = await db`SELECT tipo, monto FROM movimientos_caja`

      const resumen = movimientos.reduce(
        (acc, mov) => {
          if (mov.tipo === 'Ingreso') {
            acc.total_ingresos += parseFloat(mov.monto)
            acc.saldo_actual += parseFloat(mov.monto)
          } else {
            acc.total_egresos += parseFloat(mov.monto)
            acc.saldo_actual -= parseFloat(mov.monto)
          }
          return acc
        },
        { total_ingresos: 0, total_egresos: 0, saldo_actual: 0 }
      )

      const today = new Date().toISOString().split('T')[0]
      const hoy = await db`
        SELECT tipo, monto FROM movimientos_caja WHERE created_at >= ${today}
      `

      const hoyResumen = hoy.reduce(
        (acc, mov) => {
          if (mov.tipo === 'Ingreso') {
            acc.Ingreso += parseFloat(mov.monto)
          } else {
            acc.Egreso += parseFloat(mov.monto)
          }
          return acc
        },
        { Ingreso: 0, Egreso: 0 }
      )

      res.status(200).json({ resumen, hoy: hoyResumen })
    } else if (req.method === 'POST') {
      const { tipo, categoria, concepto, monto, metodo_pago, observaciones } = req.body

      const [movimiento] = await db`
        INSERT INTO movimientos_caja (tipo, categoria, concepto, monto, metodo_pago, observaciones, user_id)
        VALUES (${tipo}, ${categoria || 'General'}, ${concepto}, ${monto}, ${metodo_pago || 'Efectivo'}, ${observaciones || ''}, ${user.id})
        RETURNING *
      `

      res.status(201).json(movimiento)
    } else if (req.method === 'DELETE') {
      if (user.role !== 'administración') {
        return res.status(403).json({ error: 'Only administrators can delete movements' })
      }

      const { id } = req.query
      await db`DELETE FROM movimientos_caja WHERE id = ${id}`
      res.status(200).json({ message: 'Deleted successfully' })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Caja API error:', error)
    res.status(500).json({ error: error.message })
  }
}

