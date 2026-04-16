import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthPayload, Usuario } from '../types/domain'

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  login: (data: AuthPayload) => void;
  logout: () => void;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const tokenGuardado  = localStorage.getItem('psico_token')
    const usuarioGuardado = localStorage.getItem('psico_usuario')
    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado)
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setCargando(false)
  }, [])

  const login = (data: AuthPayload) => {
    setToken(data.token)
    setUsuario({ id: data.usuarioId, nombre: data.nombre, email: data.email })
    localStorage.setItem('psico_token', data.token)
    localStorage.setItem('psico_usuario', JSON.stringify({
      id: data.usuarioId, nombre: data.nombre, email: data.email
    }))
  }

  const logout = () => {
    setToken(null)
    setUsuario(null)
    localStorage.removeItem('psico_token')
    localStorage.removeItem('psico_usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
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
