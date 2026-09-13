import AppIcon from './AppIcon.jsx'
import { resolveLaunchTarget } from '../platform/launchResolver.js'

const openWeb = url => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const launchGame = target => {
  let fallbackTimer
  const stopFallback = () => {
    if (!document.hidden) return
    window.clearTimeout(fallbackTimer)
    document.removeEventListener('visibilitychange', stopFallback)
  }

  document.addEventListener('visibilitychange', stopFallback)
  fallbackTimer = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', stopFallback)
    openWeb(target.fallbackUrl)
  }, 1400)

  window.location.assign(target.nativeUrl)
}

export default function LauncherCard({ item, onRemove }) {
  const target = resolveLaunchTarget(item)
  const nativeGame = target.mode === 'native-with-fallback'
  const launch = () => nativeGame ? launchGame(target) : openWeb(target.fallbackUrl)

  return <article className="launcher-card">
    <button className="launch-target" onClick={launch} aria-label={`Launch ${item.name}`}>
      <AppIcon item={item} />
      <span>{item.name}</span>
      <small>{nativeGame ? 'Launch game' : item.url ? 'Web' : 'Install'}</small>
    </button>
    <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from launcher`}>×</button>
  </article>
}
