import { useEffect, useMemo, useState } from 'react'
import packageInfo from '../package.json'
import { catalog } from './data/catalog.js'
import Navigation from './components/Navigation.jsx'
import Clock from './components/Clock.jsx'
import LauncherCard from './components/LauncherCard.jsx'
import AppIcon from './components/AppIcon.jsx'
import SupportDiagnostics from './components/SupportDiagnostics.jsx'
import AccountPanel from './account/AccountPanel.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { useCloudProfile } from './cloud/CloudProfileContext.jsx'
import { useSync } from './sync/SyncContext.jsx'
import { isDesktop, openExternal } from './platform/index.js'

const validViews = new Set(['home', 'store', 'profile', 'settings'])
const historyView = () => validViews.has(window.history.state?.tornadoView) ? window.history.state.tornadoView : 'home'
const rootHistoryState = { tornadoSession: true, tornadoView: 'home' }
const latestReleaseUrl = 'https://github.com/kfeeney1/tornado-app-launcher/releases/latest'

function syncLabel(status) {
  if (status === 'syncing' || status === 'initializing') return 'Syncing…'
  if (status === 'offline') return 'Offline — changes will sync when connected'
  if (status === 'error') return 'Sync problem'
  if (status === 'disabled') return 'Sync disabled'
  return 'Synced'
}

export default function App() {
  const { user } = useAuth()
  const { profile } = useCloudProfile()
  const { portable, status: syncStatus, message: syncMessage, lastSyncedAt, setAppearance, setLauncher } = useSync()
  const [view, setView] = useState(historyView)
  const [query, setQuery] = useState('')
  const [download, setDownload] = useState(null)
  const theme = portable.appearance.theme
  const selected = portable.launcher.selectedItemIds
  const displayName = profile?.displayName || user?.displayName || 'Tornado account'

  useEffect(() => {
    if (!window.history.state?.tornadoSession) {
      window.history.replaceState({ ...window.history.state, ...rootHistoryState, tornadoExitBoundary: true }, '')
      window.history.pushState(rootHistoryState, '')
    }
    const onPopState = event => {
      if (event.state?.tornadoExitBoundary) {
        if (isDesktop()) {
          window.history.pushState(rootHistoryState, '')
          setView('home')
          return
        }
        if (window.confirm('Exit Tornado?')) { window.history.back(); return }
        window.history.pushState(rootHistoryState, '')
        setView('home')
        return
      }
      setView(validViews.has(event.state?.tornadoView) ? event.state.tornadoView : 'home')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!download) return undefined
    const timer = window.setInterval(() => {
      setDownload(current => {
        if (!current) return null
        const progress = Math.min(current.progress + 20, 100)
        if (progress === 100) {
          window.clearInterval(timer)
          const next = selected.includes(current.id) ? selected : [...selected, current.id]
          setLauncher(next)
          return null
        }
        return { ...current, progress }
      })
    }, 120)
    return () => window.clearInterval(timer)
  }, [download, selected, setLauncher])

  const navigate = nextView => {
    if (!validViews.has(nextView) || nextView === view) return
    window.history.pushState({ tornadoSession: true, tornadoView: nextView }, '')
    setView(nextView)
  }

  const remove = id => setLauncher(selected.filter(itemId => itemId !== id))
  const add = item => {
    const count = selected.map(id => catalog.find(entry => entry.id === id)).filter(entry => entry?.type === item.type).length
    if (selected.includes(item.id) || count >= 5 || download) return
    setDownload({ id: item.id, progress: 0 })
  }

  const filtered = useMemo(() => catalog.filter(item => `${item.name} ${item.type} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [query])
  const chosen = type => selected.map(id => catalog.find(item => item.id === id)).filter(item => item?.type === type).slice(0, 5)

  return (
    <div className={`app ${theme}`}>
      <Navigation view={view} onNavigate={navigate} />
      <main className="content">
        {view === 'home' && <>
          <section className="hero"><div><p className="eyebrow">WELCOME BACK</p><h1>{displayName}</h1><p className={`sync-status ${syncStatus}`}>{syncLabel(syncStatus)}{syncMessage ? ` · ${syncMessage}` : ''}{lastSyncedAt ? ` · ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p></div><Clock /></section>
          <section><h2>Games</h2><div className="launcher-grid">{chosen('game').map(item => <LauncherCard key={item.id} item={item} onRemove={remove} />)}</div></section>
          <section><h2>Apps</h2><div className="launcher-grid">{chosen('app').map(item => <LauncherCard key={item.id} item={item} onRemove={remove} />)}</div></section>
        </>}
        {view === 'store' && <>
          <section className="store-header"><div><p className="eyebrow">CATALOGUE</p><h1>Add to Tornado</h1></div><input aria-label="Search catalogue" placeholder="Search apps and games" value={query} onChange={event => setQuery(event.target.value)} /></section>
          <div className="catalog-grid">{filtered.map(item => <article className="catalog-card" key={item.id}><AppIcon item={item} /><div><h3>{item.name}</h3><p>{item.description}</p></div><button type="button" disabled={selected.includes(item.id) || Boolean(download)} onClick={() => add(item)}>{selected.includes(item.id) ? 'Added' : download?.id === item.id ? `${download.progress}%` : 'Add'}</button></article>)}</div>
        </>}
        {view === 'profile' && <AccountPanel />}
        {view === 'settings' && <section className="settings"><p className="eyebrow">SETTINGS</p><h1>Tornado settings</h1><label>Appearance<select value={theme} onChange={event => setAppearance(event.target.value)}><option value="dark">Dark</option><option value="light">Light</option></select></label><p>Version {packageInfo.version}</p>{isDesktop() && <button type="button" onClick={() => openExternal(latestReleaseUrl)}>Check for updates</button>}<SupportDiagnostics /></section>}
      </main>
    </div>
  )
}
