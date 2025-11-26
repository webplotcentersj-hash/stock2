import { useEffect, useState } from 'react'
import { pedidosAPI, pedidosItemsAPI, stockAPI } from '../services/api'
import { Plus, Check, X, Trash2, Eye, Package } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const APPROVAL_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Aprobado', label: 'Aprobado' },
  { value: 'Rechazado', label: 'Rechazado' },
]

export default function Pedidos() {
  const { userProfile } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [pedidoItems, setPedidoItems] = useState([])
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [formData, setFormData] = useState({
    client_name: '',
    description: '',
    imagen: null,
    items: [],
  })

  useEffect(() => {
    loadPedidos()
    loadArticulos()
  }, [approvalFilter])

  const loadPedidos = async () => {
    try {
      setLoading(true)
      const data = await pedidosAPI.getAll({ approval_status: approvalFilter })
      setPedidos(data)
    } catch (error) {
      console.error('Error loading pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadArticulos = async () => {
    try {
      const data = await stockAPI.getAll()
      setArticulos(data)
    } catch (error) {
      console.error('Error loading articulos:', error)
    }
  }

  const loadPedidoItems = async (pedidoId) => {
    try {
      const items = await pedidosItemsAPI.getByPedido(pedidoId)
      setPedidoItems(items)
    } catch (error) {
      console.error('Error loading pedido items:', error)
    }
  }

  const handlePreview = async (pedido) => {
    setSelectedPedido(pedido)
    await loadPedidoItems(pedido.id)
    setShowPreview(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = null
      if (formData.imagen) {
        const file = formData.imagen
        const fileName = `pedido_${Date.now()}_${file.name}`
        imageUrl = await pedidosAPI.uploadImage(file, fileName)
      }

      const result = await pedidosAPI.create({
        client_name: formData.client_name,
        description: formData.description,
        image_url: imageUrl,
        items: formData.items,
      })

      if (result.articulos_sin_stock?.length > 0) {
        alert(
          `Pedido creado. Se crearon ${result.ordenes_compra_creadas?.length || 0} órdenes de compra automáticas por falta de stock.`
        )
      }

      setShowModal(false)
      setFormData({ client_name: '', description: '', imagen: null, items: [] })
      loadPedidos()
    } catch (error) {
      console.error('Error creating pedido:', error)
      alert(error.message)
    }
  }

  const handleApprove = async (id) => {
    try {
      await pedidosAPI.update(id, {
        approval_status: 'Aprobado',
        approved_by: userProfile?.id,
        approved_at: new Date().toISOString(),
      })
      loadPedidos()
    } catch (error) {
      console.error('Error approving pedido:', error)
      alert(error.message)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Motivo del rechazo:')
    if (!reason) return

    try {
      await pedidosAPI.update(id, {
        approval_status: 'Rechazado',
        approved_by: userProfile?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      loadPedidos()
    } catch (error) {
      console.error('Error rejecting pedido:', error)
      alert(error.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await pedidosAPI.update(id, { status: newStatus })
      loadPedidos()
    } catch (error) {
      console.error('Error updating pedido:', error)
      alert(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return
    try {
      await pedidosAPI.delete(id)
      loadPedidos()
    } catch (error) {
      console.error('Error deleting pedido:', error)
      alert(error.message)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { articulo_id: '', cantidad: 1 }],
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  if (loading && pedidos.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Pedido
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {APPROVAL_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setApprovalFilter(filter.value)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              approvalFilter === filter.value
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:scale-105'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft hover-lift">
            {pedido.image_url && (
              <img
                src={pedido.image_url}
                alt={pedido.client_name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{pedido.client_name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{pedido.description}</p>
            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  pedido.approval_status === 'Aprobado'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : pedido.approval_status === 'Rechazado'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {pedido.approval_status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(pedido.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(pedido)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver
              </button>
              {userProfile?.role === 'compras' && pedido.approval_status === 'Pendiente' && (
                <>
                  <button
                    onClick={() => handleApprove(pedido.id)}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    title="Aprobar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(pedido.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    title="Rechazar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {(userProfile?.role === 'administración' || pedido.user_id === userProfile?.id) && (
                <button
                  onClick={() => handleDelete(pedido.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPreview && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pedido #{selectedPedido.id}</h2>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedPedido(null)
                  setPedidoItems([])
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Cliente:</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedPedido.client_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Descripción:</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedPedido.description}</p>
              </div>
              {selectedPedido.image_url && (
                <div>
                  <img
                    src={selectedPedido.image_url}
                    alt={selectedPedido.client_name}
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Items:</h3>
                {pedidoItems.length > 0 ? (
                  <div className="space-y-2">
                    {pedidoItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-gray-700 p-3 rounded border dark:border-gray-600"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {item.articulo?.descripcion || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Código: {item.articulo?.codigo || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              ×{item.cantidad}
                            </p>
                            <p
                              className={`text-xs ${
                                (item.stock_disponible || 0) < item.cantidad
                                  ? 'text-red-500'
                                  : 'text-green-500'
                              }`}
                            >
                              Stock: {item.stock_disponible || 0}
                            </p>
                          </div>
                        </div>
                        {(item.stock_disponible || 0) < item.cantidad && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                            ⚠️ Faltante: {item.cantidad - (item.stock_disponible || 0)} unidades
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No hay items en este pedido</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nuevo Pedido</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imagen: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Artículo</label>
                        <select
                          value={item.articulo_id}
                          onChange={(e) => updateItem(index, 'articulo_id', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {articulos.map((art) => (
                            <option key={art.id} value={art.id}>
                              {art.codigo} - {art.descripcion} (Stock: {art.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.items.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay items. Haz clic en "Agregar Item" para comenzar.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary text-white px-4 py-2 rounded-lg">
                  Crear Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


