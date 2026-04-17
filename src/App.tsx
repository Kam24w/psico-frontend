import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import type { ReactNode } from 'react'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage     from './pages/ChatPage'

// Ruta protegida: redirige al login si no hay sesión
function RutaProtegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="app-loading">Cargando...</div>
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Navigate to="/chat" replace />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat"     element={
            <RutaProtegida>
              <ChatPage />
            </RutaProtegida>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
