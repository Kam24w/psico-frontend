import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthPayload, User } from '../types/domain'

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (data: AuthPayload) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('mindsee_token')
    const savedUser = localStorage.getItem('mindsee_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (data: AuthPayload) => {
    const localUser: User = { id: data.userId, name: data.name, email: data.email }

    setToken(data.token)
    setUser(localUser)
    localStorage.setItem('mindsee_token', data.token)
    localStorage.setItem('mindsee_user', JSON.stringify(localUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('mindsee_token')
    localStorage.removeItem('mindsee_user')
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading
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
