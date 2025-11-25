import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Pedidos from './pages/Pedidos'
import Compras from './pages/Compras'
import Caja from './pages/Caja'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="stock" element={<Stock />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="compras" element={<Compras />} />
        <Route path="caja" element={<Caja />} />
      </Route>
    </Routes>
  )
}

export default App

