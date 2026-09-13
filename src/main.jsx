import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AuthScreen, { AuthLoading } from './auth/AuthScreen.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { CloudProfileProvider } from './cloud/CloudProfileContext.jsx'
import { SyncProvider } from './sync/SyncContext.jsx'
import './styles.css'

function TornadoRoot() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  return user ? (
    <CloudProfileProvider>
      <SyncProvider key={user.uid}>
        <App />
      </SyncProvider>
    </CloudProfileProvider>
  ) : <AuthScreen />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <TornadoRoot />
    </AuthProvider>
  </StrictMode>,
)
