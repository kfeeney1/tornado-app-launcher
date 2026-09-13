import { useEffect, useMemo, useState } from 'react'
import { catalog } from './data/catalog.js'
import Navigation from './components/Navigation.jsx'
import Clock from './components/Clock.jsx'
import LauncherCard from './components/LauncherCard.jsx'
import AppIcon from './components/AppIcon.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import { getPortableConfig, updatePortableConfig } from './config/localConfig.js'

const validViews = new Set(['home', 'store', 'profile', 'settings'])
const historyView = () => validViews.has(window.history.state?.tornadoView) ? window.history.state.tornadoView : 'home'
const rootHistoryState = { tornadoSession: true, tornadoView: 'home' }

export default function App() {
  const { user, signOut, resetPassword } = useAuth()
  const [view, setView] = useState(historyView)
  const [theme, setTheme] = useState(() => getPortableConfig().appearance.theme)
  const [selected, setSelected] = useState(() => getPortableConfig().launcher.selectedItemIds)
  const [query, setQuery] = useState('')
  const [download, setDownload] = useState(null)
  const [accountError, setAccountError] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    if (!window.history.state?.tornadoSession) {
      window.history.replaceState({ ...window.history.state, ...rootHistoryState, tornadoExitBoundary: true }, '')
      window.history.pushState(rootHistoryState, '')
    }
    const onPopState = event => {
      if (event.state?.tornadoExitBoundary) {
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
          setSelected(previous => {
            const next = previous.includes(current.id) ? previous : [...previous, current.id]
            updatePortableConfig(config => ({ ...config, launcher: { ...config.launcher, selectedItemIds: next } }))
            return next
          })
          return null
        }
        return { ...current, progress }
      })
    }, 120)
    return () => window.clearInterval(timer)
  }, [download?.id])

  const navigate = nextView => {
    if (!validViews.has(nextView) || nextView === view) return
    window.history.pushState({ tornadoSession: true, tornadoView: nextView }, '')
    setView(nextView)
  }

  const saveSelection = next => {
    const portable = updatePortableConfig(config => ({ ...config, launcher: { ...config.launcher, selectedItemIds: next } }))
    setSelected(portable.launcher.selectedItemIds)
  }

  const setAppearance = next => {
    const portable = updatePortableConfig(config => ({ ...config, appearance: { ...config.appearance, theme: next } }))
    setTheme(portable.appearance.theme)
  }

  const remove = id => saveSelection(selected.filter(itemId => itemId !== id))
  const add = item => {
    const count = selected.map(id => catalog.find(entry => entry.id === id)).filter(entry => entry?.type === item.type).length
    if (selected.includes(item.id) || count >= 5 || download) return
    setDownload({ id: item.id, progress: 0 })
  }

  const handleSignOut = async () => {
    setAccountError(''); setAccountMessage(''); setSigningOut(true)
    try { await signOut() } catch (error) { setAccountError(error.message); setSigningOut(false) }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setAccountError(''); setAccountMessage(''); setResettingPassword(true)
    try { await resetPassword(user.email); setAccountMessage('A password reset email has been requested for your Tornado account.') }
    catch (error) { setAccountError(error.message) }
    finally { setResettingPassword(false) }
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
          <div className="panel"><h2>Appearance</h2><p>Choose how Tornado looks across your Tornado experience. Cloud synchronization is not enabled yet.</p><div className="segmented" aria-label="Appearance"><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setAppearance('dark')}>Dark</button><button className={theme === 'light' ? 'selected' : ''} onClick={() => setAppearance('light')}>Light</button></div></div>
          <div className="panel"><h2>Performance</h2><p>Tornado can keep its own interface lightweight, but a browser launcher cannot increase FPS in native games. OS-level optimisation would require a future desktop app.</p></div>
        </section>}

        {view === 'profile' && <section>
          <PageHead title="Profile" text="Your Tornado account and this device’s launcher." onHome={() => navigate('home')} />
          <div className="profile-card"><div className="avatar" aria-hidden="true">T</div><div><h2>Tornado account</h2><p>{user?.email}</p></div></div>
          <div className="panel"><h2>Account</h2><p>Signed in as <strong>{user?.email}</strong>.</p>{accountError && <div className="auth-message error" role="alert">{accountError}</div>}{accountMessage && <div className="auth-message success" role="status">{accountMessage}</div>}<div className="account-actions"><button onClick={handlePasswordReset} className="secondary-action" disabled={resettingPassword || signingOut}>{resettingPassword ? 'Requesting reset…' : 'Reset Password'}</button><button onClick={handleSignOut} className="danger-action" disabled={signingOut || resettingPassword}>{signingOut ? 'Signing out…' : 'Sign Out'}</button></div><p className="field-help">Stage 3 separates portable preferences from device configuration. Automatic cloud sync remains intentionally disabled until Stage 4.</p></div>
          <div className="panel"><h2>Launcher</h2><p>{selected.length} items currently pinned. Portable launcher preferences are stored locally in the Stage 3 schema until cloud sync is enabled.</p></div>
        </section>}
      </main>
      <footer>Tornado · Account-enabled launcher</footer>
    </div>
  )
}

function PageHead({ title, text, onHome }) {
  return <div className="page-head"><div><p className="eyebrow">TORNADO</p><h1>{title}</h1><p>{text}</p></div><button onClick={onHome}>Home</button></div>
}
