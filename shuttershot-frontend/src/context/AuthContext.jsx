import { createContext, useContext, useState } from 'react'
import { AUTH_STORAGE_KEY } from '../services/api'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  function login(authResponse) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResponse))
    setUser(authResponse)
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
