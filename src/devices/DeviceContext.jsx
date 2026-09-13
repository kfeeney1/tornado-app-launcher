import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useSync } from '../sync/SyncContext.jsx'
import { buildCurrentDeviceMetadata, getOrCreateDeviceId } from './deviceIdentity.js'
import { createDeviceRegistryService } from './deviceRegistry.js'

const DeviceContext = createContext(null)

export function DeviceProvider({ children }) {
  const { user } = useAuth()
  const { migration } = useSync()
  const uid = user?.uid
  const migrationState = migration.state
  const [deviceId] = useState(() => getOrCreateDeviceId())
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const serviceRef = useRef(createDeviceRegistryService())
  const activeRef = useRef(true)

  const refreshDevices = useCallback(async () => {
    if (!uid) return
    try {
      const next = await serviceRef.current.listDevices(uid, deviceId)
      if (!activeRef.current) return
      setDevices(next)
      setError('')
    } catch {
      if (!activeRef.current) return
      setError('Unable to load devices right now.')
    } finally {
      if (activeRef.current) setIsLoading(false)
    }
  }, [uid, deviceId])

  const register = useCallback(async ({ force = false } = {}) => {
    if (!uid || migrationState !== 'complete' || navigator.onLine === false) return
    try {
      await serviceRef.current.registerCurrentDevice(uid, deviceId, buildCurrentDeviceMetadata(), { force })
      await refreshDevices()
    } catch {
      if (!activeRef.current) return
      setError('Unable to update device activity right now.')
      setIsLoading(false)
    }
  }, [uid, migrationState, deviceId, refreshDevices])

  const removeDevice = useCallback(async targetDeviceId => {
    if (!uid || targetDeviceId === deviceId) return false
    try {
      await serviceRef.current.removeDevice(uid, targetDeviceId)
      await refreshDevices()
      return true
    } catch {
      if (activeRef.current) setError('Unable to remove that device right now.')
      return false
    }
  }, [uid, deviceId, refreshDevices])

  useEffect(() => {
    activeRef.current = true
    if (migrationState === 'complete') register({ force: true })
    return () => { activeRef.current = false }
  }, [migrationState, register])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') register().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onVisibility)
    }
  }, [register])

  const registryLoading = migrationState === 'offline' ? false : isLoading
  const value = useMemo(() => ({ deviceId, devices, isLoading: registryLoading, error, refreshDevices, removeDevice }), [deviceId, devices, registryLoading, error, refreshDevices, removeDevice])
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevices() {
  const value = useContext(DeviceContext)
  if (!value) throw new Error('useDevices must be used inside DeviceProvider')
  return value
}
