import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import React, { Suspense } from 'react'
import type { ReactNode } from 'react'
import { UI_TEXTS } from './constants/texts'

// Componentes de página cargados de forma perezosa (Lazy Loading)
const LoginPage     = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage  = React.lazy(() => import('./pages/RegisterPage'))
const ChatPage      = React.lazy(() => import('./pages/ChatPage'))
const CallPage      = React.lazy(() => import('./pages/CallPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const MemoriesPage  = React.lazy(() => import('./pages/MemoriesPage'))
const ProfilePage   = React.lazy(() => import('./pages/ProfilePage'))

// Fallback visual mientras se carga el chunk
const PageLoader = () => (
  <div className="app-loading">
    <div className="light-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
  </div>
)

// Ruta protegida: redirige al login si no hay sesión
function RutaProtegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="app-loading">{UI_TEXTS.app.loading}</div>
  return usuario ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"         element={<Navigate to="/dashboard" replace />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={
                <RutaProtegida>
                  <DashboardPage />
                </RutaProtegida>
              } />
              <Route path="/memories" element={
                <RutaProtegida>
                  <MemoriesPage />
                </RutaProtegida>
              } />
              <Route path="/chat"     element={
                <RutaProtegida>
                  <ChatPage />
                </RutaProtegida>
              } />
              <Route path="/call"     element={
                <RutaProtegida>
                  <CallPage />
                </RutaProtegida>
              } />
              <Route path="/profile"  element={
                <RutaProtegida>
                  <ProfilePage />
                </RutaProtegida>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

