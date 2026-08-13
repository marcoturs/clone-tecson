import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contextos/AuthContext.jsx'
import { TemaProvider, useTema } from './contextos/TemaContext.jsx'
import { ConfirmacaoProvider } from './contextos/ConfirmacaoContext.jsx'

function ToasterComTema() {
  const { tema } = useTema()
  return (
    <Toaster
      theme={tema === 'escuro' ? 'dark' : 'light'}
      position="top-right"
      richColors
      duration={3500}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <AuthProvider>
        <ConfirmacaoProvider>
          <ToasterComTema />
          <App />
        </ConfirmacaoProvider>
      </AuthProvider>
    </TemaProvider>
  </StrictMode>,
)
