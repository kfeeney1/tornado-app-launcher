import Brand from './Brand.jsx'
export default function Navigation({ view, onNavigate }) {
  return <header className="topbar"><button className="brand-button" onClick={() => onNavigate('home')}><Brand /></button><nav aria-label="Primary">
    {['home','store','profile','settings'].map(item => <button key={item} className={view === item ? 'active' : ''} onClick={() => onNavigate(item)}>{item === 'store' ? 'Add Apps' : item[0].toUpperCase()+item.slice(1)}</button>)}
  </nav></header>
}
