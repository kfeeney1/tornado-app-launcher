import { useEffect, useMemo, useState } from 'react'
import packageInfo from '../package.json'
import { catalog } from './data/catalog.js'
import Navigation from './components/Navigation.jsx'
import Clock from './components/Clock.jsx'
import LauncherCard from './components/LauncherCard.jsx'
import AppIcon from './components/AppIcon.jsx'
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
  }, [download?.id, selected, setLauncher])

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
          <section className="hero"><div><p className="eyebrow">YOUR LAUNCHER</p><h1>Everything you play.<br />One clean start.</h1></div><Clock /></section>
          <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search launcher" placeholder="Search apps and games" value={query} onChange={event => setQuery(event.target.value)} /></label>
          {['app', 'game'].map(type => <section key={type} className="launcher-section">
            <div className="section-title"><h2>{type === 'app' ? 'Apps' : 'Games'}</h2><span>{chosen(type).length}/5</span></div>
            <div className="grid">
              {chosen(type).filter(item => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())).map(item => <LauncherCard key={item.id} item={item} onRemove={remove} />)}
              <button className="add-card" onClick={() => navigate('store')}>+ Add {type === 'app' ? 'app' : 'game'}</button>
            </div>
          </section>)}
        </>}

        {view === 'store' && <section>
          <PageHead title="Discover" text="Add web apps and launcher entries to Tornado." onHome={() => navigate('home')} />
          <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search store" placeholder="Search the catalogue" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <div className="store-grid">{filtered.map(item => {
            const isDownloading = download?.id === item.id
            return <article className="store-card" key={item.id}>
              <AppIcon item={item} /><div><h3>{item.name}</h3><p>{item.description}</p><small>{item.type === 'game' ? 'Game' : 'App'} · {item.url ? 'Web available' : 'Launcher demo'}</small>
              {isDownloading && <div className="download-status" aria-live="polite"><progress value={download.progress} max="100" aria-label={`Adding ${item.name}`} /><span>{download.progress}%</span></div>}</div>
              <button disabled={selected.includes(item.id) || Boolean(download)} onClick={() => add(item)}>{selected.includes(item.id) ? 'Added' : isDownloading ? 'Adding…' : 'Add'}</button>
              {isDownloading && <button className="cancel" onClick={() => setDownload(null)}>Cancel</button>}
            </article>
          })}</div>
        </section>}

        {view === 'settings' && <section>
          <PageHead title="Settings" text="Make Tornado feel like yours." onHome={() => navigate('home')} />
          <div className="panel"><h2>Appearance</h2><p>Theme follows your Tornado account across supported clients.</p><div className="segmented" aria-label="Appearance"><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setAppearance('dark')}>Dark</button><button className={theme === 'light' ? 'selected' : ''} onClick={() => setAppearance('light')}>Light</button></div></div>
          <div className="panel"><h2>Performance</h2><p>This setting area is device-specific. Tornado can keep its own interface lightweight, but browser settings do not change native game FPS.</p></div>
          <div className="panel"><h2>About</h2><p>Tornado v{packageInfo.version}</p><p className="field-help">Windows updates are currently distributed through the official Tornado GitHub Releases page.</p><button onClick={() => openExternal(latestReleaseUrl)}>Check for updates</button></div>
        </section>}

        {view === 'profile' && <section>
          <PageHead title="Profile" text="Your Tornado account and synchronized launcher." onHome={() => navigate('home')} />
          <div className="profile-card"><div className="avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</div><div><h2>{displayName}</h2><p>{user?.email}</p><small className="verification-label">{user?.emailVerified ? 'Verified email' : 'Email not verified'}</small></div></div>
          <div className="panel"><h2>Tornado Sync</h2><p role="status"><strong>{syncLabel(syncStatus)}</strong>{lastSyncedAt && syncStatus === 'synced' ? ` · Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>{syncMessage && <p className="field-help">{syncMessage}</p>}<p className="field-help">Apps, games, launcher order and portable appearance settings follow this account. Device launch capabilities remain local.</p></div>
          <AccountPanel />
          <div className="panel"><h2>Launcher</h2><p>{selected.length} items currently pinned and stored in your account-scoped local cache.</p></div>
        </section>}
      </main>
      <footer>Tornado · Account-synced launcher</footer>
    </div>
  )
}

function PageHead({ title, text, onHome }) {
  return <div className="page-head"><div><p className="eyebrow">TORNADO</p><h1>{title}</h1><p>{text}</p></div><button onClick={onHome}>Home</button></div>
}
