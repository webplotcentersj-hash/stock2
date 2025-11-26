import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Package, ShoppingCart, DollarSign, LayoutDashboard } from 'lucide-react'

export default function Layout() {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/stock', label: 'Stock', icon: Package },
    { path: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { path: '/compras', label: 'Compras', icon: ShoppingCart },
    { path: '/caja', label: 'Caja', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <img
            src="https://plotcenter.com.ar/wp-content/uploads/2025/05/LOGO-Plot-Center-Horizontal_Mesa-de-trabajo-1-1-scaled.png"
            alt="Logo Plot Center"
            className="w-40 mb-2 bg-white/90 p-2 rounded-lg"
          />
          <h1 className="text-xl font-bold text-primary">Stock Plot Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">v2.0</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive ? 'active' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{userProfile?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        <Outlet />
      </main>
    </div>
  )
}


