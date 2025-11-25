import { supabase } from '../lib/supabase'

// Stock/Articulos
export const stockAPI = {
  getAll: async (search = '', sector = 'all') => {
    let query = supabase
      .from('articulos')
      .select('*')
      .order('descripcion', { ascending: true })

    if (search) {
      query = query.or(`descripcion.ilike.%${search}%,codigo.ilike.%${search}%`)
    }

    if (sector && sector !== 'all') {
      query = query.eq('sector', sector)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  create: async (articulo) => {
    const dataToInsert = {
      ...articulo,
      stock: articulo.stock || articulo.stock_actual || 100,
    }
    if (dataToInsert.stock_actual) delete dataToInsert.stock_actual

    const { data, error } = await supabase
      .from('articulos')
      .insert(dataToInsert)
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id, updates) => {
    const dataToUpdate = { ...updates }
    if (dataToUpdate.stock_actual !== undefined) {
      dataToUpdate.stock = dataToUpdate.stock_actual
      delete dataToUpdate.stock_actual
    }
    dataToUpdate.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('articulos')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('articulos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  uploadImage: async (file, path) => {
    const { data, error } = await supabase.storage
      .from('articulos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('articulos')
      .getPublicUrl(data.path)

    return publicUrl
  },
}

// Pedidos
export const pedidosAPI = {
  getAll: async (filters = {}) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('pedidos')
      .select(`
        *,
        user:users!pedidos_user_id_fkey(id, name, role)
      `)
      .order('created_at', { ascending: false })

    if (profile?.role !== 'administración' && profile?.role !== 'compras') {
      query = query.eq('user_id', user.id)
    }

    if (filters.approval_status && filters.approval_status !== 'all') {
      query = query.eq('approval_status', filters.approval_status)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  create: async (pedido) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'compras') {
      throw new Error('Compras no puede crear pedidos, solo aprobarlos.')
    }

    if (pedido.items && pedido.items.length > 0) {
      return await pedidosAPI.createWithItems(pedido, user.id)
    }

    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        client_name: pedido.client_name,
        description: pedido.description,
        image_url: pedido.image_url,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  createWithItems: async (pedido, userId) => {
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_name: pedido.client_name,
        description: pedido.description,
        image_url: pedido.image_url,
        user_id: userId,
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    const articulosSinStock = []
    const ordenesCompraCreadas = []

    for (const item of pedido.items) {
      const { data: articulo } = await supabase
        .from('articulos')
        .select('id, codigo, descripcion, stock, stock_minimo')
        .eq('id', item.articulo_id)
        .single()

      if (!articulo) continue

      await supabase
        .from('pedidos_items')
        .insert({
          pedido_id: pedidoData.id,
          articulo_id: item.articulo_id,
          cantidad: item.cantidad,
          stock_disponible: articulo.stock,
        })

      const faltante = item.cantidad - articulo.stock
      if (faltante > 0) {
        articulosSinStock.push({
          articulo_id: articulo.id,
          codigo: articulo.codigo,
          descripcion: articulo.descripcion,
          cantidad_pedida: item.cantidad,
          stock_actual: articulo.stock,
          faltante: faltante,
        })

        const { data: existingOrder } = await supabase
          .from('ordenes_compra')
          .select('id')
          .eq('articulo_id', articulo.id)
          .in('status', ['Pendiente', 'En Proceso'])
          .limit(1)
          .single()

        if (!existingOrder) {
          const { data: ordenData } = await supabase
            .from('ordenes_compra')
            .insert({
              articulo_id: articulo.id,
              cantidad: faltante,
              proveedor: 'Por definir',
              observaciones: `Orden automática por pedido #${pedidoData.id} - Cliente: ${pedido.client_name}. Faltante: ${faltante} unidades.`,
              solicitado_por: userId,
              pedido_id: pedidoData.id,
              status: 'Pendiente',
            })
            .select()
            .single()

          if (ordenData) {
            ordenesCompraCreadas.push({
              orden_id: ordenData.id,
              articulo: articulo.descripcion,
              cantidad: faltante,
            })
          }
        }
      }
    }

    return {
      ...pedidoData,
      articulos_sin_stock: articulosSinStock,
      ordenes_compra_creadas: ordenesCompraCreadas,
    }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  uploadImage: async (file, path) => {
    const { data, error } = await supabase.storage
      .from('pedidos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('pedidos')
      .getPublicUrl(data.path)

    return publicUrl
  },
}

// Pedidos Items
export const pedidosItemsAPI = {
  getByPedido: async (pedidoId) => {
    const { data, error } = await supabase
      .from('pedidos_items')
      .select(`
        *,
        articulo:articulos(id, codigo, descripcion, stock)
      `)
      .eq('pedido_id', pedidoId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },
}

// Compras/Órdenes
export const comprasAPI = {
  getAll: async (status = 'all') => {
    let query = supabase
      .from('ordenes_compra')
      .select(`
        *,
        articulo:articulos(*),
        solicitado_por:users!ordenes_compra_solicitado_por_fkey(id, name)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      const statusMap = {
        pendiente: 'Pendiente',
        aprobada: 'En Proceso',
        recibida: 'Completada',
      }
      query = query.eq('status', statusMap[status] || status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  create: async (orden) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('ordenes_compra')
      .insert({
        ...orden,
        solicitado_por: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('ordenes_compra')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (updates.status === 'Completada') {
      const { data: orden } = await supabase
        .from('ordenes_compra')
        .select('articulo_id, cantidad')
        .eq('id', id)
        .single()

      if (orden) {
        const { data: articulo } = await supabase
          .from('articulos')
          .select('stock')
          .eq('id', orden.articulo_id)
          .single()

        if (articulo) {
          await supabase
            .from('articulos')
            .update({ stock: articulo.stock + orden.cantidad })
            .eq('id', orden.articulo_id)
        }
      }
    }

    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('ordenes_compra')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Caja
export const cajaAPI = {
  getMovimientos: async (filters = {}) => {
    let query = supabase
      .from('movimientos_caja')
      .select(`
        *,
        usuario:users!movimientos_caja_user_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.tipo && filters.tipo !== 'all') {
      const tipoMap = {
        ingreso: 'Ingreso',
        egreso: 'Egreso',
      }
      query = query.eq('tipo', tipoMap[filters.tipo] || filters.tipo)
    }

    if (filters.fecha_desde) {
      query = query.gte('created_at', filters.fecha_desde)
    }

    if (filters.fecha_hasta) {
      query = query.lte('created_at', filters.fecha_hasta)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  getResumen: async () => {
    const { data: movimientos, error } = await supabase
      .from('movimientos_caja')
      .select('tipo, monto')

    if (error) throw error

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
    const { data: hoy } = await supabase
      .from('movimientos_caja')
      .select('tipo, monto')
      .gte('created_at', today)

    const hoyResumen = hoy?.reduce(
      (acc, mov) => {
        if (mov.tipo === 'Ingreso') {
          acc.Ingreso += parseFloat(mov.monto)
        } else {
          acc.Egreso += parseFloat(mov.monto)
        }
        return acc
      },
      { Ingreso: 0, Egreso: 0 }
    ) || { Ingreso: 0, Egreso: 0 }

    return { resumen, hoy: hoyResumen }
  },

  create: async (movimiento) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('movimientos_caja')
      .insert({
        ...movimiento,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('movimientos_caja')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Dashboard
export const dashboardAPI = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data: pedidosHoy, error: error1 } = await supabase
      .from('pedidos')
      .select('id, status')
      .gte('created_at', today)

    if (error1) throw error1

    const stats_today = {
      total_pedidos: pedidosHoy?.length || 0,
      pedidos_completados: pedidosHoy?.filter((p) => p.status === 'Finalizado').length || 0,
    }

    const { count: pedidos_pendientes, error: error2 } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pendiente')

    if (error2) throw error2

    const { data: articulos, error: error3 } = await supabase
      .from('articulos')
      .select('stock, stock_minimo')
    
    const stock_bajo = articulos?.filter(a => a.stock <= a.stock_minimo).length || 0

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: ventas_semana, error: error4 } = await supabase
      .from('pedidos')
      .select('created_at, status')
      .gte('created_at', weekAgo.toISOString())

    if (error4) throw error4

    const ventasPorDia = {}
    ventas_semana?.forEach((pedido) => {
      const fecha = pedido.created_at.split('T')[0]
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = { pedidos: 0, completados: 0 }
      }
      ventasPorDia[fecha].pedidos++
      if (pedido.status === 'Finalizado') {
        ventasPorDia[fecha].completados++
      }
    })

    const ventas_semana_formatted = Object.entries(ventasPorDia).map(([fecha, data]) => ({
      fecha,
      pedidos: data.pedidos,
      completados: data.completados,
    }))

    const { data: actividad_reciente, error: error5 } = await supabase
      .from('pedidos')
      .select('id, client_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error5) throw error5

    return {
      stats_today,
      pedidos_pendientes: pedidos_pendientes || 0,
      stock_bajo: stock_bajo || 0,
      ventas_semana: ventas_semana_formatted,
      actividad_reciente: actividad_reciente || [],
    }
  },
}

// Notificaciones
export const notificationsAPI = {
  getAll: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data
  },

  markAsRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) throw error
  },
}

// Usuarios
export const usersAPI = {
  getAll: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .neq('id', user.id)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },
}

