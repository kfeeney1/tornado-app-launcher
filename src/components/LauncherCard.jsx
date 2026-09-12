import AppIcon from './AppIcon.jsx'

const openWeb = url => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const launchGame = item => {
  const fallbackUrl = /Android/i.test(navigator.userAgent) && item.playStoreUrl
    ? item.playStoreUrl
    : item.installUrl

  if (!item.launchUrl) {
    openWeb(fallbackUrl || item.url)
    return
  }

  let fallbackTimer
  const stopFallback = () => {
    if (!document.hidden) return
    window.clearTimeout(fallbackTimer)
    document.removeEventListener('visibilitychange', stopFallback)
  }

  document.addEventListener('visibilitychange', stopFallback)
  fallbackTimer = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', stopFallback)
    openWeb(fallbackUrl)
  }, 1400)

  window.location.assign(item.launchUrl)
}

export default function LauncherCard({ item, onRemove }) {
  const nativeGame = item.type === 'game' && Boolean(item.launchUrl)
  const launch = () => nativeGame ? launchGame(item) : openWeb(item.url || item.installUrl)

  return <article className="launcher-card">
    <button className="launch-target" onClick={launch} aria-label={`Launch ${item.name}`}>
      <AppIcon item={item} />
      <span>{item.name}</span>
      <small>{nativeGame ? 'Launch game' : item.url ? 'Web' : 'Install'}</small>
    </button>
    <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from launcher`}>×</button>
  </article>
}
