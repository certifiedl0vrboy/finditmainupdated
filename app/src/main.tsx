import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

// Register the service worker for PWA support
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" richColors closeButton />
  </StrictMode>,
)
