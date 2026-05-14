import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Suprimir errores de TF/WebGL de face-api.js que no se pueden capturar con try-catch
// ya que provienen de promesas internas del bundle de face-api
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('backend') || 
      event.reason?.message?.includes('Cannot read properties of undefined')) {
    event.preventDefault() // Evitar que aparezca en consola
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // StrictMode removido: causaba doble montaje de componentes en dev,
  // lo que interrumpía el audio y re-inicializaba face-api dos veces
  <App />,
)
