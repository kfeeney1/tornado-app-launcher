import AppIcon from './AppIcon.jsx'

export default function LauncherCard({ item, onRemove }) {
  const launch = () => item.url ? window.open(item.url, '_blank', 'noopener,noreferrer') : null
  return <article className="launcher-card">
    <button className="launch-target" onClick={launch} aria-label={`${item.url ? 'Open' : 'View'} ${item.name}`}>
      <AppIcon item={item} />
      <span>{item.name}</span>
      <small>{item.url ? 'Web' : 'Demo entry'}</small>
    </button>
    <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from launcher`}>×</button>
  </article>
}
