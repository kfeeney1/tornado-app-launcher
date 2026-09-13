import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useSync } from '../sync/SyncContext.jsx'
import { buildCurrentDeviceMetadata, getOrCreateDeviceId } from './deviceIdentity.js'
import { createDeviceRegistryService } from './deviceRegistry.js'

const DeviceContext = createContext(null)

export function DeviceProvider({ children }) {
  const { user } = useAuth()
  const { migration } = useSync()
  const [deviceId] = useState(() => getOrCreateDeviceId())
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const serviceRef = useRef(createDeviceRegistryService())
  const activeRef = useRef(true)

  const refreshDevices = useCallback(async () => {
    if (!user?.uid) return
    try {
      const next = await serviceRef.current.listDevices(user.uid, deviceId)
      if (!activeRef.current) return
      setDevices(next)
      setError('')
    } catch {
      if (!activeRef.current) return
      setError('Unable to load devices right now.')
    } finally {
      if (activeRef.current) setIsLoading(false)
    }
  }, [user?.uid, deviceId])

  const register = useCallback(async ({ force = false } = {}) => {
    if (!user?.uid || migration.state !== 'complete' || navigator.onLine === false) return
    try {
      await serviceRef.current.registerCurrentDevice(user.uid, deviceId, buildCurrentDeviceMetadata(), { force })
      await refreshDevices()
    } catch {
      if (!activeRef.current) return
      setError('Unable to update device activity right now.')
      setIsLoading(false)
    }
  }, [user?.uid, migration.state, deviceId, refreshDevices])

  const removeDevice = useCallback(async targetDeviceId => {
    if (!user?.uid || targetDeviceId === deviceId) return false
    try {
      await serviceRef.current.removeDevice(user.uid, targetDeviceId)
      await refreshDevices()
      return true
    } catch {
      if (activeRef.current) setError('Unable to remove that device right now.')
      return false
    }
  }, [user?.uid, deviceId, refreshDevices])

  useEffect(() => {
    activeRef.current = true
    if (migration.state === 'complete') register({ force: true })
    else if (migration.state === 'offline') setIsLoading(false)
    return () => { activeRef.current = false }
  }, [migration.state, register])

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

  const value = useMemo(() => ({ deviceId, devices, isLoading, error, refreshDevices, removeDevice }), [deviceId, devices, isLoading, error, refreshDevices, removeDevice])
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevices() {
  const value = useContext(DeviceContext)
  if (!value) throw new Error('useDevices must be used inside DeviceProvider')
  return value
}
