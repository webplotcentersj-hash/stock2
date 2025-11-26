import { useEffect, useState } from 'react'
import { stockAPI } from '../services/api'
import { Plus, Search, Edit, Trash2, Package, List } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const SECTORS = [
  { value: 'all', label: 'Todos', icon: List },
  { value: 'Gral', label: 'General', icon: Package },
  { value: 'Imprenta', label: 'Imprenta', icon: Package },
  { value: 'Mostrador', label: 'Mostrador', icon: Package },
  { value: 'Taller', label: 'Taller', icon: Package },
  { value: 'Compras', label: 'Compras', icon: Package },
]

export default function Stock() {
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    sector: 'Gral',
    stock_actual: 100,
    stock_minimo: 10,
    precio: 0,
    imagen: null,
  })

  useEffect(() => {
    loadArticulos()
  }, [search, selectedSector])

  const loadArticulos = async () => {
    try {
      setLoading(true)
      const data = await stockAPI.getAll(search, selectedSector)
      setArticulos(data)
    } catch (error) {
      console.error('Error loading articulos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        stock: formData.stock_actual,
      }
      delete dataToSave.stock_actual
      delete dataToSave.imagen

      if (editing) {
        await stockAPI.update(editing.id, dataToSave)
      } else {
        await stockAPI.create(dataToSave)
      }
      setShowModal(false)
      setEditing(null)
      setFormData({
        codigo: '',
        descripcion: '',
        sector: 'Gral',
        stock_actual: 100,
        stock_minimo: 10,
        precio: 0,
        imagen: null,
      })
      loadArticulos()
    } catch (error) {
      console.error('Error saving articulo:', error)
      alert(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return
    try {
      await stockAPI.delete(id)
      loadArticulos()
    } catch (error) {
      console.error('Error deleting articulo:', error)
      alert(error.message)
    }
  }

  const handleEdit = (articulo) => {
    setEditing(articulo)
    setFormData({
      codigo: articulo.codigo,
      descripcion: articulo.descripcion,
      sector: articulo.sector,
      stock_actual: articulo.stock || articulo.stock_actual,
      stock_minimo: articulo.stock_minimo,
      precio: articulo.precio,
      imagen: null,
    })
    setShowModal(true)
  }

  if (loading && articulos.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock</h1>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({
              codigo: '',
              descripcion: '',
              sector: 'Gral',
              stock_actual: 100,
              stock_minimo: 10,
              precio: 0,
              imagen: null,
            })
            setShowModal(true)
          }}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Artículo
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTORS.map((sector) => {
          const Icon = sector.icon
          return (
            <button
              key={sector.value}
              onClick={() => setSelectedSector(sector.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                selectedSector === sector.value
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:scale-105'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sector.label}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-striped">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {articulos.map((articulo) => (
                <tr key={articulo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {articulo.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{articulo.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {articulo.sector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        articulo.stock <= articulo.stock_minimo
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {articulo.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {articulo.stock_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${articulo.precio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(articulo)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(articulo.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sector</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Gral">General</option>
                    <option value="Imprenta">Imprenta</option>
                    <option value="Mostrador">Mostrador</option>
                    <option value="Taller">Taller</option>
                    <option value="Compras">Compras</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary text-white px-4 py-2 rounded-lg">
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


