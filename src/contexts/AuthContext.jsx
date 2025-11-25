import { createContext, useContext, useEffect, useState } from 'react'
import request, { setToken, removeToken } from '../lib/api.js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser({ id: userData.id, email: userData.email })
        setUserProfile(userData)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        removeToken()
        localStorage.removeItem('auth_user')
      }
    }

    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      setToken(data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setUser({ id: data.user.id, email: data.user.email })
      setUserProfile(data.user)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    removeToken()
    localStorage.removeItem('auth_user')
    setUser(null)
    setUserProfile(null)
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
