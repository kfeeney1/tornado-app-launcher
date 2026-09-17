import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppWithDevices from './devices/AppWithDevices.jsx'
import AuthScreen, { AuthLoading } from './auth/AuthScreen.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { CloudProfileProvider } from './cloud/CloudProfileContext.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { runStartupConfigRecovery } from './config/startupRecovery.js'
import { DeviceProvider } from './devices/DeviceContext.jsx'
import AndroidLifecycleBoundary from './platform/AndroidLifecycleBoundary.jsx'
import { SyncProvider } from './sync/SyncContext.jsx'
import './styles.css'

runStartupConfigRecovery()

function TornadoRoot() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  return user ? (
    <CloudProfileProvider>
      <SyncProvider key={user.uid}>
        <DeviceProvider>
          <AppWithDevices />
        </DeviceProvider>
      </SyncProvider>
    </CloudProfileProvider>
  ) : <AuthScreen />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <AndroidLifecycleBoundary />
        <TornadoRoot />
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
