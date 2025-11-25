import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await dashboardAPI.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const chartData = {
    labels: stats.ventas_semana.map((v) => new Date(v.fecha).toLocaleDateString('es-AR', { weekday: 'short' })),
    datasets: [
      {
        label: 'Pedidos',
        data: stats.ventas_semana.map((v) => v.pedidos),
        borderColor: '#eb671b',
        backgroundColor: 'rgba(235, 103, 27, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Completados',
        data: stats.ventas_semana.map((v) => v.completados),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Hoy</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.stats_today.total_pedidos}
              </p>
            </div>
            <ShoppingCart className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.stats_today.pedidos_completados}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {stats.pedidos_pendientes}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.stock_bajo}</p>
            </div>
            <Package className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ventas de la Semana</h2>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {stats.actividad_reciente.map((actividad) => (
            <div
              key={actividad.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{actividad.client_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(actividad.created_at).toLocaleString('es-AR')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  actividad.status === 'Finalizado'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : actividad.status === 'En Proceso'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {actividad.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

