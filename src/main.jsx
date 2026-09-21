import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/Common/ErrorBoundary'
import './index.css'

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

// Registro del Service Worker para funcionamiento 100% Offline PWA (Modo Avión y Campo)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('✅ Service Worker PWA activo en finca:', reg.scope);
        // Comprobar actualizaciones de inmediato
        reg.update().catch(() => null);

        // Detectar si se está instalando un nuevo worker
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('app-update-available', { detail: { version: '2.13.1' } }));
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('⚠️ Error registrando Service Worker PWA:', err);
      });

    // Escuchar mensajes emitidos por el nuevo Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        window.dispatchEvent(new CustomEvent('app-update-available', { detail: { version: event.data.version } }));
      }
    });
  });
}


