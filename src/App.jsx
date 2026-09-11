import { useMemo, useState } from 'react'
import { catalog, defaultSelection } from './data/catalog.js'
import Navigation from './components/Navigation.jsx'
import Clock from './components/Clock.jsx'
import LauncherCard from './components/LauncherCard.jsx'

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }

export default function App() {
  const [view, setView] = useState('home')
  const [theme, setTheme] = useState(() => read('tornado-theme', 'dark'))
  const [selected, setSelected] = useState(() => read('tornado-selection', defaultSelection))
  const [query, setQuery] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [booting, setBooting] = useState(true)
  const saveSelection = next => { setSelected(next); localStorage.setItem('tornado-selection', JSON.stringify(next)) }
  const setAppearance = next => { setTheme(next); localStorage.setItem('tornado-theme', JSON.stringify(next)) }
  const remove = id => saveSelection(selected.filter(x => x !== id))
  const add = item => {
    const count = selected.map(id => catalog.find(x => x.id === id)).filter(x => x?.type === item.type).length
    if (selected.includes(item.id) || count >= 5) return
    setDownloading(item.id); setTimeout(() => { saveSelection([...selected, item.id]); setDownloading(null) }, 650)
  }
  const filtered = useMemo(() => catalog.filter(x => `${x.name} ${x.type} ${x.description}`.toLowerCase().includes(query.toLowerCase())), [query])
  const chosen = type => selected.map(id => catalog.find(x => x.id === id)).filter(x => x?.type === type).slice(0, 5)

  if (booting) return <div className={`app ${theme}`}><main className="startup"><div className="startup-vortex">◒</div><h1>Tornado</h1><p>Ready when you are.</p><button autoFocus onClick={() => setBooting(false)}>Start</button></main></div>
  return <div className={`app ${theme}`}><Navigation view={view} onNavigate={setView}/><main className="content">
    {view === 'home' && <><section className="hero"><div><p className="eyebrow">YOUR LAUNCHER</p><h1>Everything you play.<br/>One clean start.</h1></div><Clock/></section><label className="search"><span>⌕</span><input aria-label="Search launcher" placeholder="Search apps and games" value={query} onChange={e => setQuery(e.target.value)}/></label>{['app','game'].map(type => <section key={type} className="launcher-section"><div className="section-title"><h2>{type === 'app' ? 'Apps' : 'Games'}</h2><span>{chosen(type).length}/5</span></div><div className="grid">{chosen(type).filter(x => x.name.toLowerCase().includes(query.toLowerCase())).map(item => <LauncherCard key={item.id} item={item} onRemove={remove}/>)}<button className="add-card" onClick={() => setView('store')}>+ Add {type === 'app' ? 'app' : 'game'}</button></div></section>)}</>}
    {view === 'store' && <section><PageHead title="Discover" text="Add web apps and launcher entries to Tornado." onHome={() => setView('home')}/><label className="search"><span>⌕</span><input aria-label="Search store" placeholder="Search the catalogue" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="store-grid">{filtered.map(item => <article className="store-card" key={item.id}><span className="app-icon">{item.glyph}</span><div><h3>{item.name}</h3><p>{item.description}</p><small>{item.type === 'game' ? 'Game' : 'App'} · {item.url ? 'Web available' : 'Launcher demo'}</small></div><button disabled={selected.includes(item.id) || downloading === item.id} onClick={() => add(item)}>{selected.includes(item.id) ? 'Added' : downloading === item.id ? 'Adding…' : 'Add'}</button>{downloading === item.id && <button className="cancel" onClick={() => setDownloading(null)}>Cancel</button>}</article>)}</div></section>}
    {view === 'settings' && <section><PageHead title="Settings" text="Make Tornado feel like yours." onHome={() => setView('home')}/><div className="panel"><h2>Appearance</h2><p>Choose how Tornado looks on this device.</p><div className="segmented"><button className={theme==='dark'?'selected':''} onClick={() => setAppearance('dark')}>Dark</button><button className={theme==='light'?'selected':''} onClick={() => setAppearance('light')}>Light</button></div></div><div className="panel"><h2>Performance</h2><p>Tornado can keep its own interface lightweight, but a browser launcher cannot increase FPS in native games. OS-level optimisation would require a future desktop app.</p></div></section>}
    {view === 'profile' && <section><PageHead title="Profile" text="Your local Tornado profile." onHome={() => setView('home')}/><div className="profile-card"><div className="avatar">T</div><div><h2>Player</h2><p>Local profile · no account required</p></div></div><div className="panel"><h2>Launcher</h2><p>{selected.length} items currently pinned. Profile and launcher preferences stay on this browser for now.</p></div></section>}
  </main><footer>Tornado · Browser launcher preview</footer></div>
}

function PageHead({ title, text, onHome }) { return <div className="page-head"><div><p className="eyebrow">TORNADO</p><h1>{title}</h1><p>{text}</p></div><button onClick={onHome}>Home</button></div> }
