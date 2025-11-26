import { useEffect, useState } from 'react'
import { comprasAPI, stockAPI } from '../services/api'
import { Plus, Check, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Compras() {
  const [ordenes, setOrdenes] = useState([])
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    articulo_id: '',
    cantidad: 1,
    proveedor: 'Por definir',
    observaciones: '',
  })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordenesData, articulosData] = await Promise.all([
        comprasAPI.getAll(statusFilter),
        stockAPI.getAll(),
      ])
      setOrdenes(ordenesData)
      setArticulos(articulosData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await comprasAPI.create(formData)
      setShowModal(false)
      setFormData({ articulo_id: '', cantidad: 1, proveedor: 'Por definir', observaciones: '' })
      loadData()
    } catch (error) {
      console.error('Error creating orden:', error)
      alert(error.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await comprasAPI.update(id, { status: newStatus })
      loadData()
    } catch (error) {
      console.error('Error updating orden:', error)
      alert(error.message)
    }
  }

  if (loading && ordenes.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Órdenes de Compra</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Orden
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'aprobada', label: 'En Proceso' },
          { value: 'recibida', label: 'Completada' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              statusFilter === filter.value
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md hover:shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:scale-105'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-striped">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Artículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {orden.articulo?.descripcion || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{orden.cantidad}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{orden.proveedor}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orden.status === 'Completada'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : orden.status === 'En Proceso'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {orden.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {orden.status !== 'Completada' && orden.status !== 'Cancelada' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(orden.id, 'Completada')}
                          className="text-green-600 hover:text-green-800"
                          title="Completar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(orden.id, 'Cancelada')}
                          className="text-red-600 hover:text-red-800"
                          title="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nueva Orden de Compra</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Artículo</label>
                <select
                  value={formData.articulo_id}
                  onChange={(e) => setFormData({ ...formData, articulo_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccionar artículo...</option>
                  {articulos.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.codigo} - {art.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedor</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


