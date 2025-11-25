import request from '../lib/api.js'

// Stock/Articulos
export const stockAPI = {
  getAll: async (search = '', sector = 'all') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (sector) params.append('sector', sector)
    
    return request(`/stock?${params.toString()}`)
  },

  create: async (articulo) => {
    const dataToInsert = {
      ...articulo,
      stock: articulo.stock || articulo.stock_actual || 100,
    }
    if (dataToInsert.stock_actual) delete dataToInsert.stock_actual

    return request('/stock', {
      method: 'POST',
      body: JSON.stringify(dataToInsert),
    })
  },

  update: async (id, updates) => {
    const dataToUpdate = { ...updates, id }
    if (dataToUpdate.stock_actual !== undefined) {
      dataToUpdate.stock = dataToUpdate.stock_actual
      delete dataToUpdate.stock_actual
    }

    return request('/stock', {
      method: 'PUT',
      body: JSON.stringify(dataToUpdate),
    })
  },

  delete: async (id) => {
    return request(`/stock?id=${id}`, {
      method: 'DELETE',
    })
  },

  uploadImage: async (file, path) => {
    // For now, return a placeholder URL
    // You'll need to implement image upload to Cloudinary or similar
    return Promise.resolve(`https://via.placeholder.com/300?text=${encodeURIComponent(path)}`)
  },
}

// Pedidos
export const pedidosAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.approval_status) params.append('approval_status', filters.approval_status)
    if (filters.status) params.append('status', filters.status)
    
    return request(`/pedidos?${params.toString()}`)
  },

  create: async (pedido) => {
    return request('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedido),
    })
  },

  update: async (id, updates) => {
    return request('/pedidos', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    })
  },

  delete: async (id) => {
    return request(`/pedidos?id=${id}`, {
      method: 'DELETE',
    })
  },

  uploadImage: async (file, path) => {
    // For now, return a placeholder URL
    // You'll need to implement image upload to Cloudinary or similar
    return Promise.resolve(`https://via.placeholder.com/300?text=${encodeURIComponent(path)}`)
  },
}

// Pedidos Items
export const pedidosItemsAPI = {
  getByPedido: async (pedidoId) => {
    return request(`/pedidos-items?pedido_id=${pedidoId}`)
  },
}

// Compras/Órdenes
export const comprasAPI = {
  getAll: async (status = 'all') => {
    return request(`/compras?status=${status}`)
  },

  create: async (orden) => {
    return request('/compras', {
      method: 'POST',
      body: JSON.stringify(orden),
    })
  },

  update: async (id, updates) => {
    return request('/compras', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    })
  },

  delete: async (id) => {
    return request(`/compras?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Caja
export const cajaAPI = {
  getMovimientos: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
    
    return request(`/caja?${params.toString()}`)
  },

  getResumen: async () => {
    return request('/caja?summary=true')
  },

  create: async (movimiento) => {
    return request('/caja', {
      method: 'POST',
      body: JSON.stringify(movimiento),
    })
  },

  delete: async (id) => {
    return request(`/caja?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Dashboard
export const dashboardAPI = {
  getStats: async () => {
    return request('/dashboard')
  },
}

// Notificaciones
export const notificationsAPI = {
  getAll: async () => {
    // TODO: Implement notifications endpoint
    return []
  },

  markAsRead: async (id) => {
    // TODO: Implement mark as read endpoint
  },
}

// Usuarios
export const usersAPI = {
  getAll: async () => {
    return request('/users')
  },
}
