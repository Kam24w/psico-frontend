import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken]     = useState(null)
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

  const login = (data) => {
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

export const useAuth = () => useContext(AuthContext)
