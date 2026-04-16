import { createContext, useContext, useState, useEffect } from 'react'
import { userStorage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from sessionStorage
    const stored = sessionStorage.getItem('hcl_session')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem('hcl_session')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const found = userStorage.findByEmail(email)
    if (!found || found.password !== password) {
      return { success: false, error: 'Invalid email or password.' }
    }
    // Don't store password in session
    const { password: _pw, ...safeUser } = found
    setUser(safeUser)
    sessionStorage.setItem('hcl_session', JSON.stringify(safeUser))
    return { success: true, user: safeUser }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('hcl_session')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
