import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { catalog } from '../data/catalog.js'
import { validatePortableConfig } from '../config/localConfig.js'
import { loadAccountPortableState, markAccountReconciled, saveAccountPortable } from './accountCache.js'
import { createSyncBackend } from './syncBackend.js'
import { DOMAINS, applyDomain, reconcileInitial, sameDomain, toDomain } from './syncLogic.js'
import { clearPending, loadPendingDomains, markPending } from './pendingSync.js'
import { MIGRATION_STATE, comparePortableConfigs, determineInitialReconciliation, portableDomainEntries } from './reconciliation.js'
import { SYNC_STATUS } from './syncTypes.js'

const SyncContext = createContext(null)
const WRITE_DELAY_MS = 250

export function SyncProvider({ children }) {
  const { user } = useAuth()
  const uid = user.uid
  const initialState = useRef(loadAccountPortableState(uid))
  const [portable, setPortable] = useState(initialState.current.portable)
  const [status, setStatus] = useState(() => navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.INITIALIZING)
  const [message, setMessage] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [migration, setMigration] = useState({ state: MIGRATION_STATE.MIGRATING, differences: null, cloudPortable: null })
  const backendRef = useRef(null)
  const timersRef = useRef(new Map())
  const portableRef = useRef(portable)
  const uidRef = useRef(uid)
  const initializedRef = useRef(false)
  const resolveConflictRef = useRef(null)

  useEffect(() => { portableRef.current = portable }, [portable])
  useEffect(() => { uidRef.current = uid }, [uid])

  useEffect(() => {
    const timers = timersRef.current
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()

    let active = true
    let initialized = false
    let initializing = false
    let currentLocalState = loadAccountPortableState(uid)
    let currentConflict = null
    const unsubscribers = []
    const backend = createSyncBackend()
    backendRef.current = backend
    initializedRef.current = false

    const setPortableSafely = value => {
      const validated = validatePortableConfig(value)
      if (!validated) throw new Error('sync/invalid-local-config')
      portableRef.current = validated
      saveAccountPortable(uid, validated)
      setPortable(validated)
      return validated
    }

    const applyRemote = (domain, result) => {
      if (!active || uidRef.current !== uid || !initializedRef.current) return
      if (result.status !== 'ready') {
        if (result.status !== 'missing') {
          setStatus(SYNC_STATUS.ERROR)
          setMessage('One synced setting could not be read safely.')
        }
        return
      }

      const pending = loadPendingDomains(uid)
      if (pending.has(domain)) {
        const cached = loadAccountPortableState(uid).portable
        if (!sameDomain(cached, domain, result.data)) return
        clearPending(uid, domain)
      }

      if (sameDomain(portableRef.current, domain, result.data)) {
        setLastSyncedAt(new Date())
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCED)
        return
      }

      const next = applyDomain(portableRef.current, domain, result.data)
      if (!validatePortableConfig(next)) return
      setPortableSafely(next)
      setLastSyncedAt(new Date())
      setStatus(SYNC_STATUS.SYNCED)
    }

    const startSubscriptions = async () => {
      if (!active || initialized) return
      for (const domain of DOMAINS) {
        const unsubscribe = await backend.subscribe(uid, domain, value => applyRemote(domain, value), error => {
          if (!active) return
          setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
          setMessage(error?.message || 'Tornado sync needs attention.')
        })
        if (typeof unsubscribe === 'function') unsubscribers.push(unsubscribe)
      }
      initialized = true
      initializedRef.current = true
      setMigration(current => ({ ...current, state: MIGRATION_STATE.COMPLETE, cloudPortable: null, differences: null }))
      setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCED)
      setLastSyncedAt(new Date())
      setMessage('')
    }

    const commitSeed = async (chosenPortable, domains) => {
      if (!domains.length) return
      const all = portableDomainEntries(chosenPortable)
      const entries = Object.fromEntries(domains.map(domain => [domain, all[domain]]))
      await backend.writeMany(uid, entries)
      for (const domain of domains) clearPending(uid, domain)
    }

    const finishReconciliation = async (chosenPortable, seed = []) => {
      const validated = setPortableSafely(chosenPortable)
      await commitSeed(validated, seed)
      if (!active || uidRef.current !== uid) return
      markAccountReconciled(uid)
      currentLocalState = { ...loadAccountPortableState(uid), portable: validated, reconciled: true }
      await startSubscriptions()
    }

    const resolveConflict = async choice => {
      if (!active || uidRef.current !== uid || !currentConflict) return
      if (navigator.onLine === false) {
        setStatus(SYNC_STATUS.OFFLINE)
        setMessage('Reconnect to resolve the account setup difference. Your local launcher remains available.')
        return
      }
      setMigration(current => ({ ...current, state: MIGRATION_STATE.MIGRATING }))
      setStatus(SYNC_STATUS.SYNCING)
      setMessage('')
      try {
        if (choice === 'cloud') {
          await finishReconciliation(currentConflict.cloudPortable, currentConflict.seed)
        } else if (choice === 'local') {
          const local = validatePortableConfig(portableRef.current)
          if (!local) throw new Error('sync/invalid-local-config')
          await backend.writeMany(uid, portableDomainEntries(local))
          for (const domain of DOMAINS) clearPending(uid, domain)
          if (!active || uidRef.current !== uid) return
          setPortableSafely(local)
          markAccountReconciled(uid)
          currentLocalState = { ...loadAccountPortableState(uid), portable: local, reconciled: true }
          await startSubscriptions()
        } else {
          throw new Error('sync/unknown-reconciliation-choice')
        }
        currentConflict = null
      } catch (error) {
        if (!active) return
        setMigration(current => ({ ...current, state: MIGRATION_STATE.CONFLICT }))
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
        setMessage(error?.message || 'Tornado could not finish setup reconciliation. Nothing was marked complete; you can retry safely.')
      }
    }
    resolveConflictRef.current = resolveConflict

    const flushPending = async () => {
      if (!initializedRef.current) return
      const pending = loadPendingDomains(uid)
      if (!pending.size) return
      setStatus(SYNC_STATUS.SYNCING)
      for (const domain of pending) {
        await backend.write(uid, domain, toDomain(portableRef.current, domain))
        clearPending(uid, domain)
      }
      if (!active) return
      setLastSyncedAt(new Date())
      setStatus(SYNC_STATUS.SYNCED)
      setMessage('')
    }

    const initialise = async () => {
      if (initializing || initialized || !active) return
      if (navigator.onLine === false) {
        setMigration(current => ({ ...current, state: MIGRATION_STATE.OFFLINE }))
        setStatus(SYNC_STATUS.OFFLINE)
        setMessage(currentLocalState.reconciled ? 'Offline — local changes will sync when connected.' : 'Connect to finish checking this device against your Tornado account. Your local launcher remains available.')
        return
      }
      initializing = true
      setMigration(current => ({ ...current, state: MIGRATION_STATE.MIGRATING }))
      try {
        const pairs = await Promise.all(DOMAINS.map(async domain => [domain, await backend.read(uid, domain)]))
        if (!active) return
        const cloud = Object.fromEntries(pairs)

        if (currentLocalState.reconciled) {
          const pending = loadPendingDomains(uid)
          const safeCloud = { ...cloud }
          for (const domain of pending) safeCloud[domain] = { status: 'missing', data: null }
          const result = reconcileInitial(portableRef.current, safeCloud)
          if (result.blocked.length) throw new Error('sync/unsupported-cloud-config')
          setPortableSafely(result.portable)
          await commitSeed(result.portable, result.seed)
          await startSubscriptions()
          return
        }

        const decision = determineInitialReconciliation({ ...currentLocalState, portable: portableRef.current }, cloud)
        if (decision.state === MIGRATION_STATE.ERROR) {
          setMigration({ state: MIGRATION_STATE.ERROR, differences: null, cloudPortable: null })
          setStatus(SYNC_STATUS.ERROR)
          setMessage(decision.reason === 'invalid-cloud' ? 'Some account settings use an unsupported or malformed format. No setup was overwritten.' : 'This local Tornado setup could not be validated safely.')
          return
        }
        if (decision.state === MIGRATION_STATE.CONFLICT) {
          currentConflict = decision
          setMigration({ state: MIGRATION_STATE.CONFLICT, differences: decision.differences, cloudPortable: decision.cloudPortable })
          setStatus(SYNC_STATUS.INITIALIZING)
          setMessage('This device and your Tornado account have different launcher setups. Choose which setup to keep before cloud sync starts.')
          return
        }

        await finishReconciliation(decision.portable, decision.seed)
      } catch (error) {
        if (!active) return
        setMigration(current => ({ ...current, state: navigator.onLine === false ? MIGRATION_STATE.OFFLINE : MIGRATION_STATE.ERROR }))
        setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.ERROR)
        setMessage(error?.message || 'Tornado sync needs attention. Your local launcher is still available.')
      } finally {
        initializing = false
      }
    }

    const onOffline = () => {
      if (!active) return
      setStatus(SYNC_STATUS.OFFLINE)
      if (!initializedRef.current) setMigration(current => ({ ...current, state: MIGRATION_STATE.OFFLINE }))
    }
    const onOnline = () => {
      if (!active) return
      const action = initializedRef.current ? flushPending() : initialise()
      action.catch(error => {
        if (!active) return
        setStatus(SYNC_STATUS.ERROR)
        setMessage(error?.message || 'Tornado sync needs attention.')
      })
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    initialise()

    return () => {
      active = false
      initializedRef.current = false
      resolveConflictRef.current = null
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      for (const unsubscribe of unsubscribers) unsubscribe()
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      backendRef.current = null
    }
  }, [uid])

  const updateDomain = useCallback((domain, updater) => {
    const current = portableRef.current
    const candidate = typeof updater === 'function' ? updater(current) : updater
    const validated = validatePortableConfig(candidate)
    if (!validated) return
    portableRef.current = validated
    saveAccountPortable(uid, validated)
    setPortable(validated)

    if (!initializedRef.current) {
      setMigration(currentMigration => currentMigration.state === MIGRATION_STATE.CONFLICT && currentMigration.cloudPortable ? {
        ...currentMigration,
        differences: comparePortableConfigs(validated, currentMigration.cloudPortable).differences,
      } : currentMigration)
      return
    }

    markPending(uid, domain)
    setStatus(navigator.onLine === false ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCING)

    const previousTimer = timersRef.current.get(domain)
    if (previousTimer) clearTimeout(previousTimer)
    const timer = setTimeout(async () => {
      if (uidRef.current !== uid || !backendRef.current || !initializedRef.current) return
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

  const resolveConflict = useCallback(choice => resolveConflictRef.current?.(choice), [])
  const setAppearance = useCallback(theme => updateDomain('appearance', current => ({ ...current, appearance: { theme } })), [updateDomain])
  const setLauncher = useCallback(selectedItemIds => updateDomain('launcher', current => ({ ...current, launcher: { selectedItemIds } })), [updateDomain])
  const setPreferences = useCallback(preferences => updateDomain('preferences', current => ({ ...current, preferences })), [updateDomain])

  const value = { portable, status, message, lastSyncedAt, migration, resolveConflict, setAppearance, setLauncher, setPreferences }
  return <SyncContext.Provider value={value}>{children}<ReconciliationDialog migration={migration} localPortable={portable} status={status} message={message} onResolve={resolveConflict} /></SyncContext.Provider>
}

function ReconciliationDialog({ migration, localPortable, status, message, onResolve }) {
  const [reviewing, setReviewing] = useState(false)
  const [confirmingLocal, setConfirmingLocal] = useState(false)
  if (migration.state !== MIGRATION_STATE.CONFLICT) return null
  const cloud = migration.cloudPortable
  const groupNames = (value, type) => value.launcher.selectedItemIds.map(id => catalog.find(item => item.id === id) ?? { id, name: id, type: 'unknown' }).filter(item => item.type === type || item.type === 'unknown').map(item => item.name)
  const format = values => values.length ? values.join(', ') : 'None'
  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(6, 9, 18, .82)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="reconcile-title" style={{ width: 'min(720px, 100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 22, padding: 24, background: '#111827', color: '#f8fafc', boxShadow: '0 24px 80px rgba(0,0,0,.45)' }}>
        <p style={{ margin: 0, opacity: .7, fontWeight: 700, letterSpacing: '.08em' }}>TORNADO SYNC</p>
        <h1 id="reconcile-title" style={{ marginBottom: 8 }}>Your Tornado setups are different</h1>
        <p>This device has a launcher setup that differs from the setup saved to your Tornado account. Nothing will be overwritten until you choose.</p>
        {reviewing && cloud && <div style={{ display: 'grid', gap: 12, margin: '20px 0' }}>
          <Difference title="Apps" local={format(groupNames(localPortable, 'app'))} cloud={format(groupNames(cloud, 'app'))} changed={migration.differences?.appsAndGames} />
          <Difference title="Games" local={format(groupNames(localPortable, 'game'))} cloud={format(groupNames(cloud, 'game'))} changed={migration.differences?.appsAndGames} />
          <Difference title="Appearance" local={localPortable.appearance.theme} cloud={cloud.appearance.theme} changed={migration.differences?.appearance} />
          {migration.differences?.preferences && <Difference title="Preferences" local="This device differs" cloud="Account differs" changed />}
          <p style={{ margin: 0, opacity: .7, fontSize: 13 }}>Launcher order is preserved and is considered part of the setup. Device-only launch paths, installation state and native preferences are not compared.</p>
        </div>}
        {confirmingLocal ? <div style={{ border: '1px solid rgba(248,113,113,.5)', borderRadius: 14, padding: 16, margin: '18px 0' }}>
          <strong>Use this device&apos;s setup?</strong>
          <p>This will replace the launcher setup currently saved to your Tornado account. Other signed-in Tornado clients will receive this setup after sync resumes.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button onClick={() => setConfirmingLocal(false)}>Cancel</button><button onClick={() => onResolve('local')} disabled={status === SYNC_STATUS.SYNCING}>Replace account setup</button></div>
        </div> : <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <button onClick={() => onResolve('cloud')} disabled={status === SYNC_STATUS.SYNCING} style={{ textAlign: 'left', padding: 14 }}><strong>Use account setup</strong><br /><span>Use the apps, games, order and appearance saved to your Tornado account.</span></button>
          <button onClick={() => setConfirmingLocal(true)} disabled={status === SYNC_STATUS.SYNCING} style={{ textAlign: 'left', padding: 14 }}><strong>Use this device</strong><br /><span>Replace the account setup with the launcher currently configured on this device.</span></button>
          <button onClick={() => setReviewing(value => !value)} style={{ textAlign: 'left', padding: 14 }}>{reviewing ? 'Hide differences' : 'Review differences'}</button>
        </div>}
        {message && <p role="status" style={{ marginTop: 16 }}>{message}</p>}
      </section>
    </div>
  )
}

function Difference({ title, local, cloud, changed }) {
  return <div style={{ border: '1px solid rgba(148,163,184,.25)', borderRadius: 14, padding: 14, opacity: changed ? 1 : .65 }}><strong>{title}{changed ? ' · Different' : ' · Same'}</strong><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}><div><small>This device</small><div>{local}</div></div><div><small>Account</small><div>{cloud}</div></div></div></div>
}

export function useSync() {
  const value = useContext(SyncContext)
  if (!value) throw new Error('useSync must be used inside SyncProvider')
  return value
}
