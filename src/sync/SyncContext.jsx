import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { createDefaultPortableConfig, validatePortableConfig } from '../config/localConfig.js'
import { loadAccountPortable, saveAccountPortable } from './accountCache.js'
import { createSyncBackend } from './syncBackend.js'
import { DOMAINS, applyDomain, reconcileInitial, sameDomain, toDomain } from './syncLogic.js'
import { clearPending, loadPendingDomains, markPending } from './pendingSync.js'
import { SYNC_STATUS } from './syncTypes.js'

const SyncContext = createContext(null)
const WRITE_DELAY_MS = 250

export function SyncProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [portable, setPortable] = useState(createDefaultPortableConfig)
  const [status, setStatus] = useState(SYNC_STATUS.INITIALIZING)
  const [message, setMessage] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const backendRef = useRef(null)
  const timersRef = useRef(new Map())
  const portableRef = useRef(portable)
  const uidRef = useRef(uid)

  useEffect(() => { portableRef.current = portable }, [portable])
  useEffect(() => { uidRef.current = uid }, [uid])

  useEffect(() => {
    const timers = timersRef.current
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()

    if (!uid) {
      setPortable(createDefaultPortableConfig())
      setStatus(SYNC_STATUS.DISABLED)
      setMessage('')
      setLastSyncedAt(null)
      return undefined
    }

    let active = true
    const unsubscribers = []
    const backend = createSyncBackend()
    backendRef.current = backend
    const local = loadAccountPortable(uid)
    portableRef.current = local
    setPortable(local)
    setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.INITIALIZING)
    setMessage('')

    const applyRemote = (domain, result) => {
      if (!active || uidRef.current !== uid) return
      if (result.status !== 'ready') {
        if (result.status !== 'missing') {
          setStatus(SYNC_STATUS.ERROR)
          setMessage('One synced setting could not be read safely.')
        }
        return
      }
      if (loadPendingDomains(uid).has(domain)) return
      if (sameDomain(portableRef.current, domain, result.data)) return
      const next = applyDomain(portableRef.current, domain, result.data)
      if (!validatePortableConfig(next)) return
      portableRef.current = next
      saveAccountPortable(uid, next)
      setPortable(next)
      setLastSyncedAt(new Date())
      setStatus(SYNC_STATUS.SYNCED)
    }

    const initialise = async () => {
      try {
        const pairs = await Promise.all(DOMAINS.map(async domain => [domain, await backend.read(uid, domain)]))
        if (!active) return
        const cloud = Object.fromEntries(pairs)
        const pending = loadPendingDomains(uid)
        const safeCloud = { ...cloud }
        for (const domain of pending) safeCloud[domain] = { status: 'missing', data: null }
        const result = reconcileInitial(local, safeCloud)
        portableRef.current = result.portable
        saveAccountPortable(uid, result.portable)
        setPortable(result.portable)

        for (const domain of result.seed) {
          await backend.write(uid, domain, toDomain(result.portable, domain))
          clearPending(uid, domain)
        }
        if (!active) return

        for (const domain of DOMAINS) {
          const unsubscribe = await backend.subscribe(uid, domain, value => applyRemote(domain, value), error => {
            if (!active) return
            setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
            setMessage(error?.message || 'Tornado sync needs attention.')
          })
          if (typeof unsubscribe === 'function') unsubscribers.push(unsubscribe)
        }

        if (result.blocked.length) {
          setStatus(SYNC_STATUS.ERROR)
          setMessage('Some synced settings use an unsupported or malformed format.')
        } else {
          setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCED)
          setLastSyncedAt(new Date())
        }
      } catch (error) {
        if (!active) return
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
        setMessage(error?.message || 'Tornado sync needs attention.')
      }
    }

    const onOffline = () => active && setStatus(SYNC_STATUS.OFFLINE)
    const onOnline = () => active && setStatus(current => current === SYNC_STATUS.OFFLINE ? SYNC_STATUS.SYNCING : current)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    initialise()

    return () => {
      active = false
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      for (const unsubscribe of unsubscribers) unsubscribe()
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      backendRef.current = null
    }
  }, [uid])

  const updateDomain = useCallback((domain, updater) => {
    if (!uid) return
    const current = portableRef.current
    const candidate = typeof updater === 'function' ? updater(current) : updater
    const validated = validatePortableConfig(candidate)
    if (!validated) return
    portableRef.current = validated
    saveAccountPortable(uid, validated)
    markPending(uid, domain)
    setPortable(validated)
    setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCING)

    const previousTimer = timersRef.current.get(domain)
    if (previousTimer) clearTimeout(previousTimer)
    const timer = setTimeout(async () => {
      if (uidRef.current !== uid || !backendRef.current) return
      try {
        await backendRef.current.write(uid, domain, toDomain(portableRef.current, domain))
        if (uidRef.current !== uid) return
        clearPending(uid, domain)
        setLastSyncedAt(new Date())
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCED)
        setMessage('')
      } catch (error) {
        if (uidRef.current !== uid) return
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
        setMessage(error?.message || 'Tornado sync needs attention.')
      }
    }, WRITE_DELAY_MS)
    timersRef.current.set(domain, timer)
  }, [uid])

  const setAppearance = useCallback(theme => updateDomain('appearance', current => ({ ...current, appearance: { theme } })), [updateDomain])
  const setLauncher = useCallback(selectedItemIds => updateDomain('launcher', current => ({ ...current, launcher: { selectedItemIds } })), [updateDomain])
  const setPreferences = useCallback(preferences => updateDomain('preferences', current => ({ ...current, preferences })), [updateDomain])

  const value = { portable, status, message, lastSyncedAt, setAppearance, setLauncher, setPreferences }
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const value = useContext(SyncContext)
  if (!value) throw new Error('useSync must be used inside SyncProvider')
  return value
}
