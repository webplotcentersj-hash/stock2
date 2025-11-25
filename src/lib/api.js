/**
 * API client for making requests to backend
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('auth_token')
}

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('auth_token', token)
}

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('auth_token')
}

// Make API request
const request = async (endpoint, options = {}) => {
  const token = getToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export default request

