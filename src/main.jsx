import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

try {
  sessionStorage.removeItem('ganado_boot_autoreload');
  if (typeof window !== 'undefined' && window.location.search && (window.location.search.includes('_reset') || window.location.search.includes('_v'))) {
    localStorage.removeItem('ganado_active_ui_state');
  }
} catch (e) {}

// Auto-recuperación ante actualización de módulos compilados (Vite chunks)
window.addEventListener('error', (event) => {
  if (event?.message && (event.message.includes('dynamically imported module') || event.message.includes('Loading chunk') || event.message.includes('text/html'))) {
    if (!sessionStorage.getItem('chunk_reload_done')) {
      sessionStorage.setItem('chunk_reload_done', 'true');
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Desregistro proactivo de Service Workers y limpieza de CacheStorage para máxima estabilidad
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister().catch(() => {});
    }
  }).catch(() => {});
}
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  }).catch(() => {});
}


