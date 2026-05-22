import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthPayload, User } from '../types/domain'

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (data: AuthPayload) => void;
  logout: () => void;
  loading: boolean;
  // Compatibility properties for Spanish transition
  usuario: User | null;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('psico_token')
    const savedUser = localStorage.getItem('psico_usuario')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (data: AuthPayload) => {
    const id = data.userId ?? data.usuarioId ?? 0
    const name = data.name ?? data.nombre ?? ''
    const localUser: User = { id, name, email: data.email }

    setToken(data.token)
    setUser(localUser)
    localStorage.setItem('psico_token', data.token)
    localStorage.setItem('psico_usuario', JSON.stringify(localUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('psico_token')
    localStorage.removeItem('psico_usuario')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      usuario: user,
      cargando: loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
