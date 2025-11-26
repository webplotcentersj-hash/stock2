/**
 * Utility helper functions
 */

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getStatusColor = (status) => {
  const colors = {
    Pendiente: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'En Proceso': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Finalizado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Completada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[status] || colors.Pendiente
}

export const hasPermission = (userRole, requiredRole) => {
  if (requiredRole === 'authenticated') return true
  if (requiredRole === 'administración') return userRole === 'administración'
  return userRole === requiredRole || userRole === 'administración'
}

export const generateFileName = (prefix, originalName) => {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}_${random}.${extension}`
}

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}


