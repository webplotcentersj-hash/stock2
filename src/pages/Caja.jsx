import { useEffect, useState } from 'react'
import { cajaAPI } from '../services/api'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

export default function Caja() {
  const { userProfile } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'Ingreso',
    categoria: 'General',
    concepto: '',
    monto: 0,
    metodo_pago: 'Efectivo',
    observaciones: '',
  })

  useEffect(() => {
    loadData()
  }, [tipoFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [movimientosData, resumenData] = await Promise.all([
        cajaAPI.getMovimientos({ tipo: tipoFilter }),
        cajaAPI.getResumen(),
      ])
      setMovimientos(movimientosData)
      setResumen(resumenData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await cajaAPI.create(formData)
      setShowModal(false)
      setFormData({
        tipo: 'Ingreso',
        categoria: 'General',
        concepto: '',
        monto: 0,
        metodo_pago: 'Efectivo',
        observaciones: '',
      })
      loadData()
    } catch (error) {
      console.error('Error creating movimiento:', error)
      alert(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return
    try {
      await cajaAPI.delete(id)
      loadData()
    } catch (error) {
      console.error('Error deleting movimiento:', error)
      alert(error.message)
    }
  }

  if (loading && !resumen) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Caja</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Movimiento
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'ingreso', label: 'Ingresos' },
          { value: 'egreso', label: 'Egresos' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setTipoFilter(filter.value)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              tipoFilter === filter.value
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:scale-105'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Ingresos</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  ${resumen.resumen.total_ingresos.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Egresos</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  ${resumen.resumen.total_egresos.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Actual</p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    resumen.resumen.saldo_actual >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  ${resumen.resumen.saldo_actual.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-striped">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Usuario
                </th>
                {userProfile?.role === 'administración' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(mov.created_at).toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        mov.tipo === 'Ingreso'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{mov.concepto}</td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      mov.tipo === 'Ingreso'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {mov.tipo === 'Ingreso' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {mov.metodo_pago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {mov.usuario?.name || 'N/A'}
                  </td>
                  {userProfile?.role === 'administración' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(mov.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nuevo Movimiento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Ingreso">Ingreso</option>
                  <option value="Egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concepto</label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
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
                  Crear Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


